/**
 * @file EnvelopeRepositoryDdb.ts
 * @summary DynamoDB-backed repository for the `Envelope` aggregate
 * @description Implements Repository<Envelope> using single-table pattern
 */

import type { Repository, DdbClientLike } from "@lawprotect/shared-ts";
import { 
  mapAwsError, 
  ConflictError, 
  ErrorCodes, 
  decodeCursor, 
  encodeCursor,
  NotFoundError 
} from "@lawprotect/shared-ts";

import type { Envelope } from "../../domain/entities/Envelope";
import type { EnvelopeId, TenantId } from "@/domain/value-objects/ids";
import { 
  envelopeItemMapper, 
  envelopePk, 
  envelopeMetaSk,
  requireQuery 
} from "../../domain/types/infrastructure/dynamodb";
import type { EnvelopeListCursorPayload } from "../../domain/types/envelopes/EnvelopesTypes";

/**
 * @description DynamoDB implementation of `Repository<Envelope, EnvelopeId>`.
 * Provides CRUD operations for envelope entities using DynamoDB single-table pattern.
 */
export class EnvelopeRepositoryDdb
  implements Repository<Envelope, EnvelopeId, undefined>
{
  private readonly indexName: string;

  /**
   * @description Creates a new EnvelopeRepositoryDdb instance.
   *
   * @param {string} tableName - DynamoDB table name
   * @param {DdbClientLike} ddb - DynamoDB client instance
   * @param {Object} opts - Optional configuration
   * @param {string} opts.indexName - GSI name for tenant queries (default: from env or "gsi1")
   */
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike,
    opts?: { indexName?: string }
  ) {
    this.indexName = opts?.indexName || process.env.ENVELOPES_GSI1_NAME || "gsi1";
  }

  /**
   * @description Retrieves an envelope by its identifier.
   *
   * @param {EnvelopeId} envelopeId - The envelope identifier
   * @returns {Promise<Envelope | null>} Promise resolving to envelope or null if not found
   * @throws {AppError} When DynamoDB operation fails
   */
  async getById(envelopeId: EnvelopeId): Promise<Envelope | null> {
    try {
      const res = await this.ddb.get({
        TableName: this.tableName,
        Key: { pk: envelopePk(envelopeId as unknown as string), sk: envelopeMetaSk() },
      });
      return res.Item ? envelopeItemMapper.fromDTO(res.Item as any) : null;
    } catch (err) {
      throw mapAwsError(err, "EnvelopeRepositoryDdb.getById");
    }
  }

  async exists(envelopeId: EnvelopeId): Promise<boolean> {
    return (await this.getById(envelopeId)) !== null;
  }

  async create(entity: Envelope): Promise<Envelope> {
    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: envelopeItemMapper.toDTO(entity) as any,
        ConditionExpression:
          "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      });
      return entity;
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new ConflictError("Envelope already exists", ErrorCodes.COMMON_CONFLICT);
      }
      throw mapAwsError(err, "EnvelopeRepositoryDdb.create");
    }
  }

  async update(envelopeId: EnvelopeId, patch: Partial<Envelope>): Promise<Envelope> {
    try {
      const current = await this.getById(envelopeId);
      if (!current) {
        throw new NotFoundError(
          "Envelope not found",
          ErrorCodes.COMMON_NOT_FOUND,
          { envelopeId }
        );
      }

      const next: Envelope = Object.freeze({
        ...current,
        title: patch.title ?? current.title,
        status: patch.status ?? current.status,
        parties: patch.parties ?? current.parties,
        documents: patch.documents ?? current.documents,
        updatedAt: new Date().toISOString(),
      });

      await this.ddb.put({
        TableName: this.tableName,
        Item: envelopeItemMapper.toDTO(next) as any,
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
      });

      return next;
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new NotFoundError(
          "Envelope not found",
          ErrorCodes.COMMON_NOT_FOUND,
          { envelopeId }
        );
      }
      throw mapAwsError(err, "EnvelopeRepositoryDdb.update");
    }
  }

  async delete(envelopeId: EnvelopeId): Promise<void> {
    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: { pk: envelopePk(envelopeId as unknown as string), sk: envelopeMetaSk() },
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
      });
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new NotFoundError(
          "Envelope not found",
          ErrorCodes.COMMON_NOT_FOUND,
          { envelopeId }
        );
      }
      throw mapAwsError(err, "EnvelopeRepositoryDdb.delete");
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // listByTenant with forward-only cursor
  // ─────────────────────────────────────────────────────────────────────────────

  async listByTenant(params: {
    tenantId: TenantId;
    limit: number;
    cursor?: string;
  }): Promise<{ items: Envelope[]; nextCursor?: string }> {
    const take = Math.max(1, Math.min(params.limit ?? 25, 100)) + 1;

    // ✅ Typed cursor: fixes "Property 'envelopeId'/'createdAt' does not exist on type '{}'"
    const c = decodeCursor<EnvelopeListCursorPayload>(params.cursor);

    requireQuery(this.ddb);

    try {
      const res = await this.ddb.query({
        TableName: this.tableName,
        IndexName: this.indexName,
        KeyConditionExpression:
          "#gsi1pk = :tenant" + (c ? " AND #gsi1sk > :after" : ""),
        ExpressionAttributeNames: {
          "#gsi1pk": "gsi1pk",
          "#gsi1sk": "gsi1sk",
        },
        ExpressionAttributeValues: {
          ":tenant": `TENANT#${params.tenantId}`,
          ...(c ? { ":after": `${c.createdAt}#${c.envelopeId}` } : {}),
        },
        Limit: take,
        ScanIndexForward: true,
      });

      const rows = (res.Items ?? []) as any[];
      const mapped = rows
        .filter((it) => it.sk === "META")
        .map((it) => envelopeItemMapper.fromDTO(it));

      const items = mapped.slice(0, take - 1);
      const hasMore = mapped.length === take;

      // ✅ Guard + typed payload for encodeCursor
      const last = items.at(-1);
      const nextCursor = hasMore && last
        ? encodeCursor({
            createdAt: last.createdAt,
            envelopeId: last.envelopeId as unknown as string,
          })
        : undefined;

      return { items, nextCursor };
    } catch (err) {
      throw mapAwsError(err, "EnvelopeRepositoryDdb.listByTenant");
    }
  }
}






