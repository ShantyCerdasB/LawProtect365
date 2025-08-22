/**
 * @file DocumentRepositoryDdb.ts
 * @summary DynamoDB-backed repository for the `Document` aggregate.
 * @remarks
 * Single-table pattern:
 * - `pk = "ENVELOPE#<envelopeId>"`
 * - `sk = "DOCUMENT#<documentId>"`
 *
 * The implementation is SDK-agnostic via {@link DdbClientLike}. All provider errors
 * are normalized with {@link mapAwsError}.
 */

import type { Repository } from "@lawprotect/shared-ts";
import type { DdbClientLike } from "@lawprotect/shared-ts";
import type { Document } from "../../domain/entities/Document";
import { documentItemMapper } from "./__mappers__/documentItemMapper";

import {
  mapAwsError,
  ConflictError,
  ErrorCodes,
  /** Domain factory for a not-found error with a stable code. */
  documentNotFound,
} from "@/errors";
import { nowIso } from "@lawprotect/shared-ts";

/**
 * Loosens a typed object into the generic `Record<string, unknown>` shape
 * expected by DocumentClient-like DynamoDB adapters.
 *
 * @typeParam T - Narrow, strongly-typed item.
 * @param v - The value to coerce.
 * @returns A `Record<string, unknown>` suitable for DynamoDB adapters.
 */
const toDdbItem = <T extends object>(v: T): Record<string, unknown> =>
  (v as unknown) as Record<string, unknown>;

/**
 * Builds the partition key for a document.
 * @param envelopeId - Envelope identifier.
 * @returns The partition key (e.g., `ENVELOPE#abc`).
 */
const docPk = (envelopeId: string): string => `ENVELOPE#${envelopeId}`;

/**
 * Builds the sort key for a document.
 * @param documentId - Document identifier.
 * @returns The sort key (e.g., `DOCUMENT#xyz`).
 */
const docSk = (documentId: string): string => `DOCUMENT#${documentId}`;

/** Composite identifier for a document entity. */
export type DocumentId = { envelopeId: string; documentId: string };

/**
 * DynamoDB implementation of {@link Repository} for {@link Document}.
 *
 * @remarks
 * - Uses conditional expressions to guarantee idempotent creates/updates.
 * - Maps AWS/adapter errors to stable HTTP/domain errors.
 */
export class DocumentRepositoryDdb
  implements Repository<Document, DocumentId, undefined>
{
  /**
   * @param tableName - DynamoDB table name.
   * @param ddb - Minimal DynamoDB client (see {@link DdbClientLike}).
   */
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike
  ) {}

  /**
   * Loads a document by composite id.
   *
   * @param id - `{ envelopeId, documentId }`.
   * @returns The document or `null` if not found.
   * @throws Error - Provider errors mapped via {@link mapAwsError}.
   */
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

  /**
   * Checks if a document exists.
   *
   * @param id - Composite id.
   * @returns `true` if the item exists; otherwise `false`.
   * @throws Error - Provider errors mapped via {@link mapAwsError}.
   */
  async exists(id: DocumentId): Promise<boolean> {
    return (await this.getById(id)) !== null;
  }

  /**
   * Creates a new document (fails if it already exists).
   *
   * @remarks
   * Uses a conditional write:
   * `attribute_not_exists(pk) AND attribute_not_exists(sk)`.
   *
   * @param entity - Document to persist.
   * @returns The created document (echo of the input).
   * @throws ConflictError - When the item already exists.
   * @throws Error - Other provider errors mapped via {@link mapAwsError}.
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
        throw new ConflictError(
          "Document already exists",
          ErrorCodes.COMMON_CONFLICT
        );
      }
      throw mapAwsError(err, "DocumentRepositoryDdb.create");
    }
  }

  /**
   * Performs a read–modify–write partial update.
   *
   * @remarks
   * Only a whitelisted set of fields is mutable. Identifiers and `createdAt`
   * remain immutable. Update is implemented as a full `put` guarded by:
   * `attribute_exists(pk) AND attribute_exists(sk)`.
   *
   * @param id - Composite id.
   * @param patch - Partial state to apply (name, mimeType, size, bucket, key, status).
   * @returns The updated document.
   * @throws Error - When the current item cannot be loaded (mapped `not found`) or provider error via {@link mapAwsError}.
   */
  async update(id: DocumentId, patch: Partial<Document>): Promise<Document> {
    try {
      const current = await this.getById(id);
      if (!current) throw documentNotFound({ id });

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
        throw documentNotFound({ id });
      }
      throw mapAwsError(err, "DocumentRepositoryDdb.update");
    }
  }

  /**
   * Deletes a document by composite id.
   *
   * @param id - Composite id.
   * @returns Resolves when the item has been deleted.
   * @throws Error - Mapped `not found` when the item does not exist; other provider errors via {@link mapAwsError}.
   */
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
        throw documentNotFound({ id });
      }
      throw mapAwsError(err, "DocumentRepositoryDdb.delete");
    }
  }
}
