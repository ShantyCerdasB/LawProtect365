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
import { mapAwsError, ConflictError, ErrorCodes } from "@lawprotect/shared-ts";

import type { Envelope } from "../../domain/entities/Envelope";
import type { EnvelopeId, TenantId } from "../../domain/value-objects";
import {
  envelopeItemMapper,
  envelopePk,
  envelopeMetaSk,
} from "./__mappers__/envelopeItemMapper";
import { envelopeNotFound } from "@/errors";

/**
 * Converts a typed object into a `Record<string, unknown>` suitable for DynamoDB clients.
 * @typeParam T - Any object type accepted by the mapper layer.
 * @param v - The source value.
 * @returns A plain record safe to pass to DynamoDB client methods.
 */
const toDdbItem = <T extends object>(v: T): Record<string, unknown> =>
  (v as unknown) as Record<string, unknown>;

/** Cursor payload used by `listByTenant` (stable ordering: createdAt + envelopeId). */
type ListCursorPayload = { createdAt: string; envelopeId: string };

/**
 * Encodes an opaque cursor string (base64url over JSON).
 * @param p - The cursor payload to encode.
 * @returns Base64url-encoded string representing the cursor.
 */
const encodeCursor = (p: ListCursorPayload): string =>
  Buffer.from(JSON.stringify(p)).toString("base64url");

/**
 * Decodes an opaque cursor string (base64url over JSON).
 * @param c - The base64url cursor to decode; if falsy, returns `undefined`.
 * @returns The decoded payload or `undefined` if input is invalid.
 */
const decodeCursor = (c?: string): ListCursorPayload | undefined => {
  if (!c) return undefined;
  try {
    return JSON.parse(Buffer.from(c, "base64url").toString("utf8"));
  } catch {
    return undefined;
  }
};

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
 * @param ddb - The DynamoDB-like client.
 * @throws {Error} If the client does not implement a `query` function.
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

  /**
   * Creates a new repository instance.
   * @param tableName - DynamoDB table name.
   * @param ddb - DynamoDB-like client implementing `get`, `put`, `delete`, and (optionally) `query`.
   * @param opts - Optional configuration.
   * @param opts.indexName - Name of the GSI used by `listByTenant`. Defaults to `process.env.ENVELOPES_GSI1_NAME` or `"gsi1"`.
   */
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike,
    opts?: { indexName?: string }
  ) {
    this.indexName =
      opts?.indexName ||
      process.env.ENVELOPES_GSI1_NAME ||
      "gsi1";
  }

  /**
   * Loads an Envelope by its identifier.
   * @param envelopeId - Envelope identifier.
   * @returns The envelope, or `null` if not found.
   * @throws Any error mapped by {@link mapAwsError}.
   */
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

  /**
   * Checks whether an Envelope exists.
   * @param envelopeId - Envelope identifier.
   * @returns `true` if the envelope exists; otherwise `false`.
   * @throws Any error mapped by {@link mapAwsError} from `getById`.
   */
  async exists(envelopeId: EnvelopeId): Promise<boolean> {
    return (await this.getById(envelopeId)) !== null;
  }

  /**
   * Persists a new Envelope.
   * Fails if an item with the same PK/SK already exists.
   * @param entity - Envelope to persist.
   * @returns The same entity on success.
   * @throws {ConflictError} If the item already exists (conditional check failed).
   * @throws Any other AWS/DynamoDB error mapped by {@link mapAwsError}.
   */
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
        throw new ConflictError(
          "Envelope already exists",
          ErrorCodes.COMMON_CONFLICT
        );
      }
      throw mapAwsError(err, "EnvelopeRepositoryDdb.create");
    }
  }

  /**
   * Performs a read–modify–write update on an Envelope.
   * Only controlled fields are updated; operation is conditional on prior existence.
   * @param envelopeId - Envelope identifier.
   * @param patch - Partial fields to apply over the current entity.
   * @returns The updated envelope snapshot.
   * @throws If the envelope does not exist.
   * @throws Any other AWS/DynamoDB error mapped by {@link mapAwsError}.
   */
  async update(
    envelopeId: EnvelopeId,
    patch: Partial<Envelope>
  ): Promise<Envelope> {
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
        ConditionExpression:
          "attribute_exists(pk) AND attribute_exists(sk)",
      });

      return next;
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw envelopeNotFound({ envelopeId });
      }
      throw mapAwsError(err, "EnvelopeRepositoryDdb.update");
    }
  }

  /**
   * Deletes an Envelope by its identifier.
   * Operation is conditional on prior existence.
   * @param envelopeId - Envelope identifier.
   * @returns Resolves when the delete succeeds.
   * @throws If the envelope does not exist.
   * @throws Any other AWS/DynamoDB error mapped by {@link mapAwsError}.
   */
  async delete(envelopeId: EnvelopeId): Promise<void> {
    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: { pk: envelopePk(envelopeId), sk: envelopeMetaSk() },
        ConditionExpression:
          "attribute_exists(pk) AND attribute_exists(sk)",
      });
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw envelopeNotFound({ envelopeId });
      }
      throw mapAwsError(err, "EnvelopeRepositoryDdb.delete");
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Extra method: listing by tenant with forward cursor pagination
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Lists envelopes for a tenant with forward-only cursor pagination.
   *
   * @remarks
   * Assumes a GSI with derived keys:
   *  - `gsi1pk = "TENANT#<tenantId>"`
   *  - `gsi1sk = "<createdAt>#<envelopeId>"`
   * The actual names/attributes depend on your table definition.
   * Provide `indexName` in the constructor or via `ENVELOPES_GSI1_NAME`.
   *
   * @param params - Listing options.
   * @param params.tenantId - Tenant identifier to scope the query.
   * @param params.limit - Page size (clamped to 1..100). Internally requests `limit + 1` to detect continuation.
   * @param params.cursor - Opaque forward cursor returned by a previous call.
   * @returns A page of envelopes and (optionally) a `nextCursor` if more results are available.
   * @throws {Error} If the provided client does not implement `query`.
   * @throws Any AWS/DynamoDB error mapped by {@link mapAwsError}.
   */
  async listByTenant(params: {
    tenantId: TenantId;
    limit: number;
    cursor?: string;
  }): Promise<{ items: Envelope[]; nextCursor?: string }> {
    const take = Math.max(1, Math.min(params.limit ?? 25, 100)) + 1;
    const c = decodeCursor(params.cursor);

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

      const nextCursor = hasMore
        ? encodeCursor({
            createdAt: items[items.length - 1].createdAt,
            envelopeId: items[items.length - 1].envelopeId,
          })
        : undefined;

      return { items, nextCursor };
    } catch (err) {
      throw mapAwsError(err, "EnvelopeRepositoryDdb.listByTenant");
    }
  }
}
