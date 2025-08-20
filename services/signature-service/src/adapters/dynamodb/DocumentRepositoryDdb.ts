/**
 * @file DocumentRepositoryDdb.ts
 * @summary DynamoDB-backed repository for the `Document` entity.
 * @description
 * Single-table pattern:
 *   - PK = "ENVELOPE#<envelopeId>"
 *   - SK = "DOCUMENT#<documentId>"
 * SDK-agnostic via `DdbClientLike`, provider errors normalized with `mapAwsError`.
 */

import type { Repository } from "@lawprotect/shared-ts";
import { ConflictError, NotFoundError } from "@lawprotect/shared-ts";
import { mapAwsError } from "@lawprotect/shared-ts";
import { nowIso } from "@lawprotect/shared-ts";
import type { DdbClientLike } from "@lawprotect/shared-ts";
import type { Document } from "../../domain/entities/Document";
import { documentItemMapper } from "./__mappers__/documentItemMapper";

/** Narrow ➜ wide helper for DocumentClient’s `Record<string, unknown>` shape. */
const toDdbItem = <T extends object>(v: T): Record<string, unknown> =>
  (v as unknown) as Record<string, unknown>;

/** Local key builders kept in sync with the mapper’s convention. */
const docPk = (envelopeId: string): string => `ENVELOPE#${envelopeId}`;
const docSk = (documentId: string): string => `DOCUMENT#${documentId}`;

/** Composite id for documents. */
export type DocumentId = { envelopeId: string; documentId: string };

/**
 * DynamoDB implementation of `Repository<Document, DocumentId>`.
 */
export class DocumentRepositoryDdb
  implements Repository<Document, DocumentId, undefined>
{
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike
  ) {}

  /** Loads a Document by composite id. */
  async getById(id: DocumentId): Promise<Document | null> {
    try {
      const res = await this.ddb.get({
        TableName: this.tableName,
        Key: { pk: docPk(id.envelopeId), sk: docSk(id.documentId) },
      });
      return res.Item ? documentItemMapper.fromDTO(res.Item as any) : null;
    } catch (err) {
      throw mapAwsError(err, "DocumentRepositoryDdb.getById");
    }
  }

  /** Existence check by id. */
  async exists(id: DocumentId): Promise<boolean> {
    return (await this.getById(id)) !== null;
  }

  /**
   * Creates a new Document (fails if already exists).
   * Uses conditional write to guarantee idempotency.
   */
  async create(entity: Document): Promise<Document> {
    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: toDdbItem(documentItemMapper.toDTO(entity)),
        ConditionExpression:
          "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      });
      return entity;
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new ConflictError("Document already exists");
      }
      throw mapAwsError(err, "DocumentRepositoryDdb.create");
    }
  }

  /**
   * Read–modify–write partial update.
   * Only whitelisted fields are mutable; identifiers and `createdAt` remain immutable.
   */
  async update(id: DocumentId, patch: Partial<Document>): Promise<Document> {
    try {
      const current = await this.getById(id);
      if (!current) throw new NotFoundError("Document not found");

      const next: Document = Object.freeze({
        ...current,
        name: patch.name ?? current.name,
        mimeType: patch.mimeType ?? current.mimeType,
        size: patch.size ?? current.size,
        bucket: patch.bucket ?? current.bucket,
        key: patch.key ?? current.key,
        status: patch.status ?? current.status,
        updatedAt: nowIso(),
      });

      await this.ddb.put({
        TableName: this.tableName,
        Item: toDdbItem(documentItemMapper.toDTO(next)),
        ConditionExpression:
          "attribute_exists(pk) AND attribute_exists(sk)",
      });

      return next;
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new NotFoundError("Document not found");
      }
      throw mapAwsError(err, "DocumentRepositoryDdb.update");
    }
  }

  /** Deletes a Document by composite id. */
  async delete(id: DocumentId): Promise<void> {
    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: { pk: docPk(id.envelopeId), sk: docSk(id.documentId) },
        ConditionExpression:
          "attribute_exists(pk) AND attribute_exists(sk)",
      });
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new NotFoundError("Document not found");
      }
      throw mapAwsError(err, "DocumentRepositoryDdb.delete");
    }
  }
}
