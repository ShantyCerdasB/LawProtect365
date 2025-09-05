/**
 * @file DocumentRepositoryDdb.ts
 * @summary DynamoDB-backed repository for the Document aggregate
 * @description DynamoDB implementation of the Document repository using single-table design pattern.
 * Uses envelope-scoped partitioning with GSI support for efficient document lookup.
 * Supports CRUD operations, existence checks, and envelope-based listing with pagination.
 */

import type { DdbClientLike } from "@lawprotect/shared-ts";
import { requireQuery, mapAwsError, ConflictError, ErrorCodes, nowIso } from "@lawprotect/shared-ts";

import type { Document } from "../../domain/entities/Document";
import type { DocumentId, EnvelopeId } from "../../domain/value-objects/Ids";
import { 
  documentItemMapper, 
  documentPk, 
  documentSk,
  type DdbDocumentItem 
} from "../../shared/types/infrastructure/DocumentDdbTypes";
import { documentNotFound, badRequest } from "../../shared/errors";
import type { DocumentsRepository, DocumentKey } from "../../shared/contracts/repositories/documents/DocumentsRepository";

/**
 * @summary Coerces a typed object into the Record<string, unknown> shape expected by DynamoDB clients
 * @description Keeps the adapter marshalling-agnostic by converting typed objects to DynamoDB format.
 * @param v - Typed object to convert
 * @returns DynamoDB-compatible record format
 */
const toDdbItem = <T extends object>(v: T): Record<string, unknown> =>
  (v as unknown) as Record<string, unknown>;

/**
 * @summary DynamoDB implementation of Document repository
 * @description Provides CRUD operations for Document entities using DynamoDB single-table design.
 * Supports envelope-scoped queries, GSI-based document lookup, and composite key operations.
 */
export class DocumentRepositoryDdb implements DocumentsRepository {
  /**
   * @summary Creates a new DocumentRepositoryDdb instance
   * @description Initializes the repository with DynamoDB table and client configuration.
   * @param tableName - DynamoDB table name
   * @param ddb - Minimal DynamoDB client
   */
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike
  ) {}

  /**
   * @summary Loads a document by its unique identifier using GSI
   * @description Retrieves a document using GSI1 for efficient document lookup by documentId.
   * Falls back to error message if GSI is not available.
   * @param documentId - Document identifier
   * @returns The document or null if not found
   * @throws Errors mapped via mapAwsError
   */
  async getById(documentId: DocumentId): Promise<Document | null> {
    try {
      requireQuery(this.ddb);
      const result = await this.ddb.query({
        TableName: this.tableName,
        IndexName: "GSI1", // GSI on documentId
        KeyConditionExpression: "gsi1pk = :gsi1pk",
        ExpressionAttributeValues: {
          ":gsi1pk": `DOCUMENT#${documentId}`,
        },
        Limit: 1,
      });

      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      return documentItemMapper.fromDTO(result.Items[0] as unknown as DdbDocumentItem);
    } catch (err: any) {
      // If GSI doesn't exist, provide helpful error message
      if (String(err?.name) === "ValidationException" && String(err?.message).includes("GSI1")) {
        throw badRequest(
          "GSI1 not available for document lookup. Use getByKey(envelopeId, documentId) instead.",
          ErrorCodes.COMMON_BAD_REQUEST,
          { documentId, suggestion: "Use getByKey method with envelopeId" }
        );
      }
      throw mapAwsError(err, "DocumentRepositoryDdb.getById");
    }
  }

  /**
   * @summary Loads a document by composite key (envelope-scoped)
   * @description Retrieves a document using envelope-scoped PK/SK lookup.
   * @param documentKey - The Document composite key (envelopeId + documentId)
   * @returns The document or null if not found
   * @throws Errors mapped via mapAwsError
   */
  async getByKey(documentKey: DocumentKey): Promise<Document | null> {
    try {
      const res = await this.ddb.get({
        TableName: this.tableName,
        Key: { 
          pk: documentPk(documentKey.envelopeId), 
          sk: documentSk(String(documentKey.documentId)) 
        },
      });
      return res.Item
        ? documentItemMapper.fromDTO(res.Item as unknown as DdbDocumentItem)
        : null;
    } catch (err) {
      throw mapAwsError(err, "DocumentRepositoryDdb.getByKey");
    }
  }

  /**
   * @summary Checks if a document exists by unique identifier
   * @description Performs an existence check using GSI lookup.
   * @param documentId - Document identifier
   * @returns True if document exists, false otherwise
   */
  async exists(documentId: DocumentId): Promise<boolean> {
    return (await this.getById(documentId)) !== null;
  }

  /**
   * @summary Checks if a document exists by composite key
   * @description Performs an existence check using envelope-scoped lookup.
   * @param documentKey - The Document composite key
   * @returns True if document exists, false otherwise
   */
  async existsByKey(documentKey: DocumentKey): Promise<boolean> {
    return (await this.getByKey(documentKey)) !== null;
  }

  /**
   * @summary Persists a new document with idempotent create semantics
   * @description Creates a new document with conditional put to ensure idempotency.
   * Uses conditional expression to prevent duplicate creation.
   * @param entity - Document entity to persist
   * @returns The persisted document
   * @throws ConflictError when document already exists
   * @throws Errors mapped via mapAwsError
   */
  async create(entity: Document): Promise<Document> {
    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: toDdbItem(documentItemMapper.toDTO(entity)),
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      });
      return entity;
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new ConflictError("Document already exists", ErrorCodes.COMMON_CONFLICT);
      }
      throw mapAwsError(err, "DocumentRepositoryDdb.create");
    }
  }

  /**
   * @summary Updates an existing document with read-modify-write semantics
   * @description Performs optimistic update with existence check and timestamp update.
   * Uses conditional put to ensure document exists before modification.
   * @param id - Document identifier
   * @param patch - Partial document with fields to update
   * @returns Updated document snapshot
   * @throws DocumentNotFoundError when document doesn't exist
   * @throws Errors mapped via mapAwsError
   */
  async update(_id: DocumentId, _patch: Partial<Document>): Promise<Document> {
    // This method requires envelopeId for single-table design
    // Consider implementing updateByEnvelopeAndId(envelopeId, documentId, patch) instead
    throw new Error(
      "DocumentRepositoryDdb.update requires envelopeId for single-table design. " +
      "Use updateByEnvelopeAndId(envelopeId, documentId, patch) instead."
    );
  }

  /**
   * @summary Updates an existing document by envelope and document identifiers
   * @description Performs optimistic update with existence check and timestamp update.
   * @param envelopeId - Envelope identifier
   * @param documentId - Document identifier
   * @param patch - Partial document with fields to update
   * @returns Updated document snapshot
   * @throws DocumentNotFoundError when document doesn't exist
   * @throws Errors mapped via mapAwsError
   */
  async updateByEnvelopeAndId(envelopeId: string, documentId: DocumentId, patch: Partial<Document>): Promise<Document> {
    try {
      const current = await this.getByEnvelopeAndId(envelopeId, documentId);
      if (!current) throw documentNotFound({ id: documentId });

      const next: Document = Object.freeze({
        ...current,
        ...patch,
        updatedAt: nowIso(),
      });

      await this.ddb.put({
        TableName: this.tableName,
        Item: toDdbItem(documentItemMapper.toDTO(next)),
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
      });

      return next;
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw documentNotFound({ id: documentId });
      }
      throw mapAwsError(err, "DocumentRepositoryDdb.updateByEnvelopeAndId");
    }
  }

  /**
   * @summary Deletes a document by identifier with existence check
   * @description Removes a document with conditional delete to ensure it exists.
   * Uses conditional expression to prevent deletion of non-existent documents.
   * @param id - Document identifier
   * @throws DocumentNotFoundError when document doesn't exist
   * @throws Errors mapped via mapAwsError
   */
  async delete(_id: DocumentId): Promise<void> {
    // This method requires envelopeId for single-table design
    // Consider implementing deleteByEnvelopeAndId(envelopeId, documentId) instead
    throw new Error(
      "DocumentRepositoryDdb.delete requires envelopeId for single-table design. " +
      "Use deleteByEnvelopeAndId(envelopeId, documentId) instead."
    );
  }

  /**
   * @summary Deletes a document by envelope and document identifiers
   * @description Removes a document with conditional delete to ensure it exists.
   * @param envelopeId - Envelope identifier
   * @param documentId - Document identifier
   * @throws DocumentNotFoundError when document doesn't exist
   * @throws Errors mapped via mapAwsError
   */
  async deleteByEnvelopeAndId(envelopeId: string, documentId: DocumentId): Promise<void> {
    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: { 
          pk: documentPk(envelopeId), 
          sk: documentSk(String(documentId)) 
        },
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
      });
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw documentNotFound({ id: documentId });
      }
      throw mapAwsError(err, "DocumentRepositoryDdb.deleteByEnvelopeAndId");
    }
  }

  /**
   * @summary Lists documents within an envelope with forward-only pagination
   * @description Retrieves documents scoped to a specific envelope using partition key queries.
   * Supports cursor-based pagination for efficient large result set handling.
   * @param args - Query parameters including envelope scope and pagination
   * @param args.envelopeId - Envelope identifier for partition scope
   * @param args.limit - Maximum number of documents to return
   * @param args.cursor - Opaque continuation token for pagination
   * @returns Page of documents with optional next cursor
   * @throws Errors mapped via mapAwsError
   */
  async listByEnvelope(args: {
    envelopeId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ items: Document[]; nextCursor?: string }> {
    try {
      requireQuery(this.ddb);

      const params: {
        TableName: string;
        KeyConditionExpression: string;
        ExpressionAttributeValues: Record<string, unknown>;
        Limit: number;
        ExclusiveStartKey?: Record<string, unknown>;
      } = {
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": documentPk(args.envelopeId) },
        Limit: args.limit,
        ...(args.cursor ? { ExclusiveStartKey: JSON.parse(args.cursor) as Record<string, unknown> } : {}),
      };

      const result = await this.ddb.query(params);

      const items = (result.Items ?? []).map((raw) =>
        documentItemMapper.fromDTO(raw as unknown as DdbDocumentItem)
      );

      return {
        items,
        nextCursor: result.LastEvaluatedKey
          ? JSON.stringify(result.LastEvaluatedKey)
          : undefined,
      };
    } catch (err) {
      throw mapAwsError(err, "DocumentRepositoryDdb.listByEnvelope");
    }
  }
}

