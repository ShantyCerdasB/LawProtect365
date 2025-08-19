/**
 * @file RequestTokenStoreDdb.ts
 * @summary DynamoDB-backed implementation of the `IdempotencyStore` contract.
 * @description
 * Key design:
 *  - PK = IDEMPOTENCY#<key>
 *  - SK = META
 *
 * Attributes:
 *  - type           : "Idempotency"
 *  - idempotencyKey : string
 *  - state          : "pending" | "completed"
 *  - resultJson?    : string (stable JSON snapshot when completed)
 *  - createdAt      : ISO-8601
 *  - updatedAt      : ISO-8601
 *  - ttl?           : epoch seconds
 */

import type { IdempotencyStore, JsonValue } from "@lawprotect/shared-ts";
import { ConflictError, NotFoundError, ErrorCodes } from "@lawprotect/shared-ts";
import { mapAwsError } from "@lawprotect/shared-ts";
import { nowIso, stableStringify } from "@lawprotect/shared-ts";
import type { DdbClientLike } from "@lawprotect/shared-ts";

/**
 * Refinement of the shared DynamoDB client contract where `update` is required.
 * This store uses `update`, so the dependency is tightened locally without
 * changing the shared interface.
 */
type DdbClientWithUpdate = DdbClientLike & {
  update: NonNullable<DdbClientLike["update"]>;
};

const IDEMPOTENCY_ENTITY = "Idempotency" as const;
const META = "META" as const;

const idempotencyPk = (key: string): string => `IDEMPOTENCY#${key}`;
const idempotencySk = (): string => META;

interface DdbIdempotencyItem {
  pk: string;
  sk: string;
  type: typeof IDEMPOTENCY_ENTITY;
  idempotencyKey: string;
  state: "pending" | "completed";
  resultJson?: string;
  createdAt: string;
  updatedAt: string;
  ttl?: number;
}

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

const toTtl = (ttlSeconds: number | undefined): number | undefined =>
  typeof ttlSeconds === "number" && ttlSeconds > 0
    ? Math.floor(Date.now() / 1000) + Math.floor(ttlSeconds)
    : undefined;

const toDdbItem = <T extends object>(v: T): Record<string, unknown> =>
  (v as unknown) as Record<string, unknown>;

export class RequestTokenStoreDdb implements IdempotencyStore {
  /**
   * @param tableName DynamoDB table name.
   * @param ddb DynamoDB client with `update` capability.
   */
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientWithUpdate
  ) {}

  /** Retrieves the state for a key. */
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
      throw mapAwsError(err, "RequestTokenStoreDdb.get");
    }
  }

  /** Creates a pending record (fails if it already exists). */
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
        ConditionExpression:
          "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      });
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new ConflictError(
          "Idempotency key already exists",
          ErrorCodes.COMMON_CONFLICT
        );
      }
      throw mapAwsError(err, "RequestTokenStoreDdb.putPending");
    }
  }

  /**
   * Marks a key as completed with a stable JSON snapshot and optional TTL.
   * Requires an existing pending record.
   */
  async putCompleted(
    key: string,
    result: unknown,
    ttlSeconds: number
  ): Promise<void> {
    const now = nowIso();
    const ttl = toTtl(ttlSeconds);

    const snapshot: JsonValue = (result ?? null) as JsonValue;
    const resultJson = stableStringify(snapshot);

    try {
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
        throw new NotFoundError(
          "Idempotency key not found",
          ErrorCodes.COMMON_NOT_FOUND
        );
      }
      throw mapAwsError(err, "RequestTokenStoreDdb.putCompleted");
    }
  }
}
