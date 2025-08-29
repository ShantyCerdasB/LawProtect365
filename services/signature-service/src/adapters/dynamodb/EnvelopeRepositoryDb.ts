/**
 * @file EnvelopeRepositoryDdb.ts
 * @summary DynamoDB-backed repository for the `Envelope` aggregate.
 * @description
 * Implements the `Repository<Envelope>` contract using a single-table pattern:
 *   - PK = "ENVELOPE#<envelopeId>"
 *   - SK = "META"
 *
 * Extras:
 * - listByTenant(): forward cursor query over a GSI (tenant scope).
 * - `query` is not part of `DdbClientLike` (shared), so a local type guard is used.
 */

import type { Repository } from "@lawprotect/shared-ts";
import type { DdbClientLike } from "@lawprotect/shared-ts";
import {
  mapAwsError,
  ConflictError,
  ErrorCodes,
  decodeCursor,
  encodeCursor,
} from "@lawprotect/shared-ts";

import type { Envelope } from "../../domain/entities/Envelope";
import type { EnvelopeId, TenantId } from "../../domain/value-objects";
import {
  envelopeItemMapper,
  envelopePk,
  envelopeMetaSk,
} from "./mappers/envelopeItemMapper";
import { envelopeNotFound } from "@/errors";

/** Cursor payload used by `listByTenant` (stable ordering: createdAt + envelopeId). */
type ListCursorPayload = { createdAt: string; envelopeId: string };

/**
 * Converts a typed object into a `Record<string, unknown>` suitable for DynamoDB clients.
 */
const toDdbItem = <T extends object>(v: T): Record<string, unknown> =>
  (v as unknown) as Record<string, unknown>;

/** Minimal shape of the `query` operation required (SDK-agnostic). */
type DdbQueryParams = {
  TableName: string;
  IndexName?: string;
  KeyConditionExpression: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, unknown>;
  Limit?: number;
  ScanIndexForward?: boolean;
  ExclusiveStartKey?: Record<string, unknown>;
};
type DdbQueryResult = {
  Items?: Record<string, unknown>[];
  LastEvaluatedKey?: Record<string, unknown>;
};

/** DynamoDB client with `query` support. */
type DdbClientWithQuery = DdbClientLike & {
  query(params: DdbQueryParams): Promise<DdbQueryResult>;
};

/**
 * Asserts at runtime (and narrows at type-level) that the provided client implements `query`.
 */
function requireQuery(ddb: DdbClientLike): asserts ddb is DdbClientWithQuery {
  if (typeof (ddb as any)?.query !== "function") {
    throw new Error(
      "[EnvelopeRepositoryDdb] The provided DDB client does not implement `query(...)`. " +
        "Use a client compatible with DocumentClient.query or provide an adapter exposing it."
    );
  }
}

/**
 * DynamoDB implementation of `Repository<Envelope, EnvelopeId>`.
 */
export class EnvelopeRepositoryDdb
  implements Repository<Envelope, EnvelopeId, undefined>
{
  private readonly indexName: string;

  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike,
    opts?: { indexName?: string }
  ) {
    this.indexName = opts?.indexName || process.env.ENVELOPES_GSI1_NAME || "gsi1";
  }

  async getById(envelopeId: EnvelopeId): Promise<Envelope | null> {
    try {
      const res = await this.ddb.get({
        TableName: this.tableName,
        Key: { pk: envelopePk(envelopeId), sk: envelopeMetaSk() },
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
        Item: toDdbItem(envelopeItemMapper.toDTO(entity)),
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
      if (!current) throw envelopeNotFound({ envelopeId });

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
        Item: toDdbItem(envelopeItemMapper.toDTO(next)),
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
      });

      return next;
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw envelopeNotFound({ envelopeId });
      }
      throw mapAwsError(err, "EnvelopeRepositoryDdb.update");
    }
  }

  async delete(envelopeId: EnvelopeId): Promise<void> {
    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: { pk: envelopePk(envelopeId), sk: envelopeMetaSk() },
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
      });
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw envelopeNotFound({ envelopeId });
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

    // ✅ Typed cursor: fixes “Property 'envelopeId'/'createdAt' does not exist on type '{}'”
    const c = decodeCursor<ListCursorPayload>(params.cursor);

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
            envelopeId: last.envelopeId,
          })
        : undefined;

      return { items, nextCursor };
    } catch (err) {
      throw mapAwsError(err, "EnvelopeRepositoryDdb.listByTenant");
    }
  }
}
