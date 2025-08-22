/**
 * @file IdempotencyStoreDdb.ts
 * @description
 * DynamoDB-backed implementation of the `IdempotencyStore` contract.
 *
 * Single-table layout:
 *  - PK = `IDEMPOTENCY#<key>`
 *  - SK = `META`
 *
 * Attributes:
 *  - type           : `"Idempotency"`
 *  - idempotencyKey : string
 *  - state          : `"pending"` | `"completed"`
 *  - resultJson?    : string (stable JSON snapshot when completed)
 *  - createdAt      : ISO-8601 string
 *  - updatedAt      : ISO-8601 string
 *  - ttl?           : epoch seconds (number)
 *
 * Notes:
 *  - Uses an SDK-agnostic client (`DdbClientLike`) to remain decoupled.
 *  - Employs a runtime/type guard to ensure `update` is present when needed.
 */

import type { IdempotencyStore } from "@lawprotect/shared-ts";
import { ConflictError, NotFoundError, ErrorCodes, mapAwsError, nowIso, stableStringify } from "@lawprotect/shared-ts";
import type { DdbClientLike } from "@lawprotect/shared-ts";
import { requireUpdate } from "@lawprotect/shared-ts";

/** Stable entity marker. */
const IDEMPOTENCY_ENTITY = "Idempotency" as const;
/** Fixed sort key segment. */
const META = "META" as const;

/** Key builders. */
const idempotencyPk = (key: string): string => `IDEMPOTENCY#${key}`;
const idempotencySk = (): string => META;

/** Persisted item shape. */
interface DdbIdempotencyItem {
  pk: string;
  sk: string;
  type: typeof IDEMPOTENCY_ENTITY;
  idempotencyKey: string;
  state: "pending" | "completed";
  resultJson?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  ttl?: number;      // epoch seconds
}

/**
 * Runtime guard for safe deserialization.
 *
 * @param v Value to validate.
 * @returns `true` if `v` matches `DdbIdempotencyItem`.
 */
const isDdbIdempotencyItem = (v: unknown): v is DdbIdempotencyItem => {
  const o = v as DdbIdempotencyItem;
  return Boolean(
    o &&
      typeof o === "object" &&
      typeof o.pk === "string" &&
      typeof o.sk === "string" &&
      o.type === IDEMPOTENCY_ENTITY &&
      typeof o.idempotencyKey === "string" &&
      (o.state === "pending" || o.state === "completed") &&
      typeof o.createdAt === "string" &&
      typeof o.updatedAt === "string"
  );
};

/**
 * Converts a relative TTL in seconds to epoch seconds.
 *
 * @param ttlSeconds Relative TTL in seconds.
 * @returns Epoch seconds or `undefined` if `ttlSeconds` is falsy or not positive.
 */
const toTtl = (ttlSeconds: number | undefined): number | undefined =>
  typeof ttlSeconds === "number" && ttlSeconds > 0
    ? Math.floor(Date.now() / 1000) + Math.floor(ttlSeconds)
    : undefined;

/**
 * Narrows an object to the DocumentClient-compatible item shape.
 *
 * @param v Arbitrary object.
 * @returns The same value typed as `Record<string, unknown>`.
 */
const toDdbItem = <T extends object>(v: T): Record<string, unknown> =>
  (v as unknown) as Record<string, unknown>;

/**
 * Produces a stable JSON snapshot for an arbitrary payload.
 *
 * @param result Payload to snapshot.
 * @returns JSON string; falls back to a safe payload if serialization fails.
 */
const stringifyResult = (result: unknown): string => {
  try {
    return stableStringify(result as any);
  } catch {
    return stableStringify({ ok: false, reason: "non-serializable-result" });
  }
};

/**
 * DynamoDB implementation of `IdempotencyStore`.
 *
 * Semantics:
 * - `putPending` creates the record if it does not already exist.
 * - `get` returns `"pending" | "completed" | null`.
 * - `putCompleted` sets state to `"completed"`, stores a JSON snapshot, and sets TTL.
 */
export class IdempotencyStoreDdb implements IdempotencyStore {
  /**
   * Creates a new instance of the store.
   *
   * @param tableName DynamoDB table name.
   * @param ddb Minimal client compatible with `DdbClientLike`.
   */
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike
  ) {}

  /**
   * Retrieves the current state for an idempotency key.
   *
   * @param key Idempotency key.
   * @returns `"pending" | "completed" | null`.
   * @throws Normalized HttpError via `mapAwsError`.
   */
  async get(key: string): Promise<"pending" | "completed" | null> {
    try {
      const res = await this.ddb.get({
        TableName: this.tableName,
        Key: { pk: idempotencyPk(key), sk: idempotencySk() },
        ConsistentRead: true,
      });

      if (!res.Item) return null;
      if (!isDdbIdempotencyItem(res.Item)) return null;
      return res.Item.state;
    } catch (err) {
      throw mapAwsError(err, "IdempotencyStoreDdb.get");
    }
  }

  /**
   * Marks a key as `pending` with a TTL.
   *
   * @param key Idempotency key.
   * @param ttlSeconds Relative TTL in seconds.
   * @throws {ConflictError} If the record already exists.
   */
  async putPending(key: string, ttlSeconds: number): Promise<void> {
    const now = nowIso();
    const item: DdbIdempotencyItem = {
      pk: idempotencyPk(key),
      sk: idempotencySk(),
      type: IDEMPOTENCY_ENTITY,
      idempotencyKey: key,
      state: "pending",
      createdAt: now,
      updatedAt: now,
      ttl: toTtl(ttlSeconds),
    };

    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: toDdbItem(item),
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      });
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new ConflictError("Idempotency key already exists", ErrorCodes.COMMON_CONFLICT);
      }
      throw mapAwsError(err, "IdempotencyStoreDdb.putPending");
    }
  }

  /**
   * Marks a key as `completed` with a stable result snapshot and TTL.
   *
   * @param key Idempotency key.
   * @param result Arbitrary result payload.
   * @param ttlSeconds Relative TTL in seconds.
   * @throws {NotFoundError} If the record does not exist.
   */
  async putCompleted(
    key: string,
    result: unknown,
    ttlSeconds: number
  ): Promise<void> {
    const now = nowIso();
    const ttl = toTtl(ttlSeconds);
    const resultJson = stringifyResult(result);

    try {
      requireUpdate(this.ddb);

      await this.ddb.update({
        TableName: this.tableName,
        Key: { pk: idempotencyPk(key), sk: idempotencySk() },
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
        UpdateExpression:
          "SET #state = :completed, #resultJson = :resultJson, #updatedAt = :updatedAt" +
          (ttl ? ", #ttl = :ttl" : ""),
        ExpressionAttributeNames: {
          "#state": "state",
          "#resultJson": "resultJson",
          "#updatedAt": "updatedAt",
          ...(ttl ? { "#ttl": "ttl" } : {}),
        },
        ExpressionAttributeValues: {
          ":completed": "completed",
          ":resultJson": resultJson,
          ":updatedAt": now,
          ...(ttl ? { ":ttl": ttl } : {}),
        },
        ReturnValues: "NONE",
      });
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new NotFoundError("Idempotency key not found", ErrorCodes.COMMON_NOT_FOUND);
      }
      throw mapAwsError(err, "IdempotencyStoreDdb.putCompleted");
    }
  }
}
