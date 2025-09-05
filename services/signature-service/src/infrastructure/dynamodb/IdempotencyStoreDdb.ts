/**
 * @file IdempotencyStoreDdb.ts
 * @summary DynamoDB-backed implementation of the IdempotencyStore contract
 * @description DynamoDB-backed implementation of the `IdempotencyStore` contract.
 * Single-table layout:
 *  - PK = `IDEMPOTENCY#<key>`
 *  - SK = `META`
 * Attributes:
 *  - type           : `"Idempotency"`
 *  - idempotencyKey : string
 *  - state          : `"pending"` | `"completed"`
 *  - resultJson?    : string (stable JSON snapshot when completed)
 *  - createdAt      : ISO-8601 string
 *  - updatedAt      : ISO-8601 string
 *  - ttl?           : epoch seconds (number)
 * Notes:
 *  - Uses an SDK-agnostic client (`DdbClientLike`) to remain decoupled.
 *  - Employs a runtime/type guard to ensure `update` is present when needed.
 */

import type { IdempotencyStore, DdbClientLike } from "@lawprotect/shared-ts";
import { 
  ConflictError, 
  NotFoundError, 
  ErrorCodes, 
  mapAwsError, 
  nowIso, 
  requireUpdate 
} from "@lawprotect/shared-ts";
import type { DdbIdempotencyItem } from "../../shared/types/idempotency";
import { 
  isDdbIdempotencyItem,
  idempotencyPk,
  idempotencySk
} from "../../shared/types/idempotency";
import { 
  toTtl, 
  toDdbItem, 
  stringifyResult 
} from "../../shared/utils/idempotency/idempotencyUtils";

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
      type: "Idempotency",
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
