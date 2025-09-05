/**
 * @file DocumentRepositoryDdb.ts
 * @summary DynamoDB-backed repository for the Document aggregate
 * @description DynamoDB implementation of the Document repository using single-table design pattern.
 * Uses envelope-scoped partitioning with direct document access via composite keys.
 * Supports CRUD operations, existence checks, and envelope-based listing with pagination.
 */

import type { Repository, DdbClientLike } from "@lawprotect/shared-ts";
import { requireQuery, mapAwsError, ConflictError, ErrorCodes, nowIso } from "@lawprotect/shared-ts";

import type { Document } from "../../domain/entities/Document";
import type { DocumentId } from "../../domain/value-objects/Ids";
import { documentItemMapper, type DocumentItem } from "./mappers/documentItemMapper";
import { documentNotFound } from "../../shared/errors";

/**
 * @summary Coerces a typed object into the Record<string, unknown> shape expected by DynamoDB clients
 * @description Keeps the adapter marshalling-agnostic by converting typed objects to DynamoDB format.
 * @param v - Typed object to convert
 * @returns DynamoDB-compatible record format
 */
const toDdbItem = <T extends object>(v: T): Record<string, unknown> =>
  (v as unknown) as Record<string, unknown>;

/**
 * @summary Builds partition key for envelope-scoped documents
 * @description Creates the partition key used for envelope-scoped document queries.
 * @param envelopeId - Envelope identifier
 * @returns Partition key string
 */
const docPk = (envelopeId: string): string => `ENVELOPE#${envelopeId}`;

/**
 * @summary Builds sort key for document items
 * @description Creates the sort key used for document identification within envelopes.
 * @param documentId - Document identifier
 * @returns Sort key string
 */
const docSk = (documentId: string): string => `DOCUMENT#${documentId}`;

/**
 * @summary DynamoDB implementation of Document repository
 * @description Provides CRUD operations for Document entities using DynamoDB single-table design.
 * Supports envelope-scoped queries and direct document access via composite keys.
 */
export class DocumentRepositoryDdb
  implements Repository<Document, DocumentId, undefined>
{
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
   * @summary Loads a document by its unique identifier
   * @description Retrieves a document using direct PK/SK lookup. This method uses
   * a direct `DOCUMENT#<id>` PK/SK pattern for efficient document retrieval.
   * @param id - Document identifier
   * @returns The document or null if not found
   * @throws Errors mapped via mapAwsError
   */
  async getById(id: DocumentId): Promise<Document | null> {
    try {
      const res = await this.ddb.get({
        TableName: this.tableName,
        Key: { pk: `DOCUMENT#${id}`, sk: docSk(String(id)) },
      });
      return res.Item
        ? documentItemMapper.fromDTO(res.Item as unknown as DocumentItem)
        : null;
    } catch (err) {
      throw mapAwsError(err, "DocumentRepositoryDdb.getById");
    }
  }

  /**
   * @summary Checks if a document exists in the repository
   * @description Performs an existence check by attempting to retrieve the document.
   * @param id - Document identifier
   * @returns True if document exists, false otherwise
   */
  async exists(id: DocumentId): Promise<boolean> {
    return (await this.getById(id)) !== null;
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
  async update(id: DocumentId, patch: Partial<Document>): Promise<Document> {
    try {
      const current = await this.getById(id);
      if (!current) throw documentNotFound({ id });

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
        throw documentNotFound({ id });
      }
      throw mapAwsError(err, "DocumentRepositoryDdb.update");
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
  async delete(id: DocumentId): Promise<void> {
    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: { pk: `DOCUMENT#${id}`, sk: docSk(String(id)) },
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
      });
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw documentNotFound({ id });
      }
      throw mapAwsError(err, "DocumentRepositoryDdb.delete");
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
        ExpressionAttributeValues: { ":pk": docPk(args.envelopeId) },
        Limit: args.limit,
        ...(args.cursor ? { ExclusiveStartKey: JSON.parse(args.cursor) as Record<string, unknown> } : {}),
      };

      const result = await this.ddb.query(params);

      const items = (result.Items ?? []).map((raw) =>
        documentItemMapper.fromDTO(raw as unknown as DocumentItem)
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
