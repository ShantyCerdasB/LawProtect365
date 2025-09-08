/**
 * @file DocumentRepositoryDdb.ts
 * @summary DynamoDB-backed repository for the Document aggregate
 * @description DynamoDB implementation of the Document repository using single-table design pattern.
 * Uses envelope-scoped partitioning with GSI support for efficient document lookup.
 * Supports CRUD operations, existence checks, and envelope-based listing with pagination.
 */

import type { DdbClientLike } from "@lawprotect/shared-ts";
import { requireQuery, mapAwsError, ConflictError, ErrorCodes, nowIso, toDdbItem } from "@lawprotect/shared-ts";

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
   * @summary Updates an existing document by unique identifier
   * @description Performs optimistic update with existence check and timestamp update.
   * Uses GSI to find the document, then updates using envelope-scoped key.
   * @param documentId - Document identifier
   * @param patch - Partial document with fields to update
   * @returns Updated document snapshot
   * @throws DocumentNotFoundError when document doesn't exist
   * @throws Errors mapped via mapAwsError
   */
  async update(documentId: DocumentId, patch: Partial<Document>): Promise<Document> {
    try {
      // First, get the document to obtain envelopeId
      const current = await this.getById(documentId);
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
      throw mapAwsError(err, "DocumentRepositoryDdb.update");
    }
  }

  /**
   * @summary Updates an existing document by composite key
   * @description Performs optimistic update with existence check and timestamp update.
   * @param documentKey - The Document composite key
   * @param patch - Partial document with fields to update
   * @returns Updated document snapshot
   * @throws DocumentNotFoundError when document doesn't exist
   * @throws Errors mapped via mapAwsError
   */
  async updateByKey(documentKey: DocumentKey, patch: Partial<Document>): Promise<Document> {
    try {
      const current = await this.getByKey(documentKey);
      if (!current) throw documentNotFound({ id: documentKey.documentId });

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
        throw documentNotFound({ id: documentKey.documentId });
      }
      throw mapAwsError(err, "DocumentRepositoryDdb.updateByKey");
    }
  }

  /**
   * @summary Deletes a document by unique identifier
   * @description Removes a document with conditional delete to ensure it exists.
   * Uses GSI to find the document, then deletes using envelope-scoped key.
   * @param documentId - Document identifier
   * @throws DocumentNotFoundError when document doesn't exist
   * @throws Errors mapped via mapAwsError
   */
  async delete(documentId: DocumentId): Promise<void> {
    try {
      // First, get the document to obtain envelopeId
      const document = await this.getById(documentId);
      if (!document) {
        throw documentNotFound({ id: documentId });
      }

      // Now delete using the envelope-scoped key
      await this.ddb.delete({
        TableName: this.tableName,
        Key: { 
          pk: documentPk(document.envelopeId), 
          sk: documentSk(String(documentId)) 
        },
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
      });
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw documentNotFound({ id: documentId });
      }
      throw mapAwsError(err, "DocumentRepositoryDdb.delete");
    }
  }

  /**
   * @summary Deletes a document by composite key
   * @description Removes a document with conditional delete to ensure it exists.
   * @param documentKey - The Document composite key
   * @throws DocumentNotFoundError when document doesn't exist
   * @throws Errors mapped via mapAwsError
   */
  async deleteByKey(documentKey: DocumentKey): Promise<void> {
    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: { 
          pk: documentPk(documentKey.envelopeId), 
          sk: documentSk(String(documentKey.documentId)) 
        },
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
      });
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw documentNotFound({ id: documentKey.documentId });
      }
      throw mapAwsError(err, "DocumentRepositoryDdb.deleteByKey");
    }
  }

  /**
   * @summary Lists documents within an envelope with forward-only pagination
   * @description Retrieves documents scoped to a specific envelope using partition key queries.
   * Supports cursor-based pagination for efficient large result set handling.
   * @param params - Query parameters including envelope scope and pagination
   * @param params.envelopeId - Envelope identifier for partition scope
   * @param params.limit - Maximum number of documents to return
   * @param params.cursor - Opaque continuation token for pagination
   * @returns Page of documents with optional next cursor
   * @throws Errors mapped via mapAwsError
   */
  async listByEnvelope(params: {
    envelopeId: EnvelopeId;
    limit?: number;
    cursor?: string;
  }): Promise<{ items: Document[]; nextCursor?: string }> {
    try {
      requireQuery(this.ddb);

      const queryParams: {
        TableName: string;
        KeyConditionExpression: string;
        ExpressionAttributeValues: Record<string, unknown>;
        Limit: number;
        ExclusiveStartKey?: Record<string, unknown>;
      } = {
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": documentPk(params.envelopeId) },
        Limit: params.limit || 50,
        ...(params.cursor ? { ExclusiveStartKey: JSON.parse(params.cursor) as Record<string, unknown> } : {}),
      };

      const result = await this.ddb.query(queryParams);

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

