/**
 * @file DocumentRepositoryDdb.ts
 * @summary DynamoDB-backed repository for the Document aggregate.
 *
 * @description
 * Single-table pattern:
 *   - `pk = "ENVELOPE#<envelopeId>"`
 *   - `sk = "DOCUMENT#<documentId>"`
 *
 * This adapter is SDK-agnostic via {@link DdbClientLike}. Provider errors are
 * normalized with {@link mapAwsError}. The optional `query` method is asserted
 * at runtime via {@link requireQuery}.
 */

import type { Repository } from "@lawprotect/shared-ts";
import type { DdbClientLike } from "@lawprotect/shared-ts";
import { requireQuery, mapAwsError, ConflictError, ErrorCodes, nowIso } from "@lawprotect/shared-ts";

import type { Document } from "../../domain/entities/Document";
import type { DocumentId } from "../../domain/value-objects/Ids";
import { documentItemMapper, type DocumentItem } from "./mappers/documentItemMapper";
import { documentNotFound } from "@/errors";

/**
 * Coerces a typed object into the `Record<string, unknown>` shape expected by
 * DynamoDB clients. This keeps the adapter marshalling-agnostic.
 */
const toDdbItem = <T extends object>(v: T): Record<string, unknown> =>
  (v as unknown) as Record<string, unknown>;

/** Partition key builder for envelope-scoped documents. */
const docPk = (envelopeId: string): string => `ENVELOPE#${envelopeId}`;

/** Sort key builder for document items. */
const docSk = (documentId: string): string => `DOCUMENT#${documentId}`;

/**
 * DynamoDB implementation of `Repository<Document, DocumentId>`.
 */
export class DocumentRepositoryDdb
  implements Repository<Document, DocumentId, undefined>
{
  /**
   * Creates a new repository instance.
   * @param tableName DynamoDB table name.
   * @param ddb Minimal DynamoDB client (see {@link DdbClientLike}).
   */
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike
  ) {}

  /**
   * Loads a document by id.
   *
   * @remarks
   * This lookup uses a direct `DOCUMENT#<id>` PK/SK. If your table stores
   * documents only under `ENVELOPE#<envelopeId>`, you will need a GSI or an
   * alternative access path.
   *
   * @param id Document identifier.
   * @returns The document or `null` if not found.
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
   * Checks existence of a document.
   * @param id Document identifier.
   */
  async exists(id: DocumentId): Promise<boolean> {
    return (await this.getById(id)) !== null;
    }

  /**
   * Persists a new document (idempotent create).
   * @param entity Document to persist.
   * @throws ConflictError when the item already exists.
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
   * Read–modify–write update guarded by existence.
   * @param id Document id.
   * @param patch Mutable fields to apply.
   * @returns Updated snapshot.
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
   * Deletes a document by id (conditional on prior existence).
   * @param id Document id.
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
   * Lists documents under an envelope (forward-only pagination).
   *
   * @param args.envelopeId Envelope identifier (partition scope).
   * @param args.limit Page size.
   * @param args.cursor Opaque continuation token (stringified LastEvaluatedKey).
   * @returns Page of documents and optional `nextCursor`.
   */
  async listByEnvelope(args: {
    envelopeId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ items: Document[]; nextCursor?: string }> {
    try {
      // Assert presence of `query` and narrow type (fixes “possibly undefined”).
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
