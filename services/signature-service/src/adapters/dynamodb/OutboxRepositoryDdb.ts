/**
 * @file OutboxRepositoryDdb.ts
 * @summary DynamoDB-backed implementation of the shared OutboxPort
 * @description DynamoDB-backed implementation of the shared `OutboxPort`.
 * Persists `OutboxRecord` entries and supports:
 * - `save` to append a new pending record (append-only semantics).
 * - `pullPending` to fetch the next N pending records in chronological order.
 * - `markDispatched` to mark a record as dispatched and move it out of the pending index.
 * - `markFailed` to mark a record as failed and increment the attempts counter.
 * Key design (single-table friendly):
 *  PK  = `OUTBOX`
 *  SK  = `ID#<id>`
 * Status GSI (by current state):
 *  GSI1 PK = `STATUS#<status>`                // pending | dispatched | failed
 *  GSI1 SK = `<occurredAt>#<id>`              // time-then-id for stable ordering
 */

/**
 * @file OutboxRepositoryDdb.ts
 * @summary DynamoDB-backed implementation of the shared `OutboxPort`.
 *
 * @description
 * Persists `OutboxRecord` entries and supports:
 * - `save` to append a new pending record (append-only semantics).
 * - `pullPending` to fetch the next N pending records in chronological order.
 * - `markDispatched` to mark a record as dispatched and move it out of the pending index.
 * - `markFailed` to mark a record as failed and increment the attempts counter.
 *
 * Key design (single-table friendly):
 *  PK  = `OUTBOX`
 *  SK  = `ID#<id>`
 *
 * Status GSI (by current state):
 *  GSI1 PK = `STATUS#<status>`                // pending | dispatched | failed
 *  GSI1 SK = `<occurredAt>#<id>`              // time-then-id for stable ordering
 *
 * Notes:
 * - Records are written with a conditional put to avoid accidental overwrites.
 * - `pullPending` uses GSI1 with `STATUS#pending`, returning the oldest first.
 * - Status transitions update `gsi1pk` atomically to remove/add items from the index.
 */

import type {
  OutboxPort,
  OutboxRecord,
  DomainEvent,
  DdbClientLike,
} from "@lawprotect/shared-ts";
import {
  clamp,
  mapAwsError,
  ConflictError,
  ErrorCodes,
  requireQuery,
  requireUpdate,
} from "@lawprotect/shared-ts";
import { toJsonObject } from "@/utils";

/** Logical entity marker for outbox items. */
const OUTBOX_ENTITY = "Outbox" as const;

/** Default index name for status-based lookups (override via `indexes`). */
const DEFAULT_IDX_STATUS = "gsi1";

/**
 * @description DynamoDB persistence shape for an outbox row.
 */
interface OutboxItem {
  pk: string;        // "OUTBOX"
  sk: string;        // "ID#<id>"
  type: typeof OUTBOX_ENTITY;

  id: string;
  eventType: string;
  payload?: Record<string, unknown>;
  occurredAt: string;

  status: OutboxRecord["status"];
  attempts: number;
  lastError?: string;
  traceId?: string;

  gsi1pk: string;    // "STATUS#<status>"
  gsi1sk: string;    // "<occurredAt>#<id>"
}

/** Key builders. */
const PK = "OUTBOX";
const skOf = (id: string) => `ID#${id}`;
const statusPk = (status: OutboxRecord["status"]) => `STATUS#${status}`;
const statusSk = (occurredAt: string, id: string) => `${occurredAt}#${id}`;

/**
 * @description Construction options for the repository.
 */
export interface OutboxRepositoryDdbProps {
  /** DynamoDB table name. */
  tableName: string;
  /** Minimal DDB client (DocumentClient-like) provided by the container. */
  client: DdbClientLike;
  /** Optional index names override. */
  indexes?: {
    byStatus?: string; // default "gsi1"
  };
}

/**
 * @description DynamoDB implementation of the `OutboxPort`.
 *
 * The repository is storage/SDK-agnostic via `DdbClientLike`.
 * It relies on:
 *  - `put` for appends (conditional).
 *  - `query` for pulling pending records.
 *  - `update` for status transitions and attempts increments.
 */
export class OutboxRepositoryDdb implements OutboxPort {
  private readonly table: string;
  private readonly ddb: DdbClientLike;
  private readonly idxByStatus: string;

  /**
   * @description Creates a new OutboxRepositoryDdb instance.
   * @param {OutboxRepositoryDdbProps} props - Repository configuration properties
   */
  constructor(props: OutboxRepositoryDdbProps) {
    this.table = props.tableName;
    this.ddb = props.client;
    this.idxByStatus = props.indexes?.byStatus ?? DEFAULT_IDX_STATUS;
  }

  /**
   * Saves a `DomainEvent` into the outbox as a `pending` record.
   * Uses a conditional put to ensure the same `id` is not overwritten.
   */
  async save(evt: DomainEvent, traceId?: string): Promise<void> {
    const item: OutboxItem = {
      pk: PK,
      sk: skOf(evt.id),
      type: OUTBOX_ENTITY,

      id: evt.id,
      eventType: evt.type,
      payload: evt.payload ? toJsonObject(evt.payload as Record<string, unknown>) : undefined,
      occurredAt: evt.occurredAt,

      status: "pending",
      attempts: 0,
      lastError: undefined,
      traceId,

      gsi1pk: statusPk("pending"),
      gsi1sk: statusSk(evt.occurredAt, evt.id),
    };

    try {
      await this.ddb.put({
        TableName: this.table,
        Item: item as unknown as Record<string, unknown>,
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      });
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new ConflictError("Outbox record already exists", ErrorCodes.COMMON_CONFLICT);
      }
      throw mapAwsError(err, "OutboxRepositoryDdb.save");
    }
  }

  /**
   * Marks a record as successfully dispatched and moves it out of the `pending` index.
   */
  async markDispatched(id: string): Promise<void> {
    requireUpdate(this.ddb);
    try {
      await this.ddb.update({
        TableName: this.table,
        Key: { pk: PK, sk: skOf(id) },
        UpdateExpression: [
          "SET #status = :s",
          "#gpk = :g",
          // ensure attempts is initialized; not strictly required but useful
          "#attempts = if_not_exists(#attempts, :zero)",
          // clear lastError on success
          "REMOVE #lastError",
        ].join(", "),
        ExpressionAttributeNames: {
          "#status": "status",
          "#gpk": "gsi1pk",
          "#attempts": "attempts",
          "#lastError": "lastError",
        },
        ExpressionAttributeValues: {
          ":s": "dispatched",
          ":g": statusPk("dispatched"),
          ":zero": 0,
        },
        ReturnValues: "NONE",
      });
    } catch (err) {
      throw mapAwsError(err, "OutboxRepositoryDdb.markDispatched");
    }
  }

  /**
   * Marks a record as failed, increments the attempts counter, and moves it to the `failed` index.
   */
  async markFailed(id: string, error: string): Promise<void> {
    requireUpdate(this.ddb);
    try {
      await this.ddb.update({
        TableName: this.table,
        Key: { pk: PK, sk: skOf(id) },
        UpdateExpression: [
          "SET #status = :s",
          "#gpk = :g",
          "#attempts = if_not_exists(#attempts, :zero) + :one",
          "#lastError = :err",
        ].join(", "),
        ExpressionAttributeNames: {
          "#status": "status",
          "#gpk": "gsi1pk",
          "#attempts": "attempts",
          "#lastError": "lastError",
        },
        ExpressionAttributeValues: {
          ":s": "failed",
          ":g": statusPk("failed"),
          ":zero": 0,
          ":one": 1,
          ":err": String(error),
        },
        ReturnValues: "NONE",
      });
    } catch (err) {
      throw mapAwsError(err, "OutboxRepositoryDdb.markFailed");
    }
  }

  /**
   * Pulls up to `limit` oldest pending records ordered by `occurredAt` then `id`.
   * Results are mapped back to `OutboxRecord`.
   */
  async pullPending(limit: number): Promise<OutboxRecord[]> {
    const pageSize = clamp(limit, 1, 100);
    requireQuery(this.ddb);

    try {
      const out = await this.ddb.query({
        TableName: this.table,
        IndexName: this.idxByStatus,
        KeyConditionExpression: "#pk = :pk",
        ExpressionAttributeNames: { "#pk": "gsi1pk" },
        ExpressionAttributeValues: { ":pk": statusPk("pending") },
        Limit: pageSize,
        ScanIndexForward: true, // oldest first
      });

      const items = (out.Items ?? []) as Array<Record<string, unknown>>;
      return items.map((raw) => this.toOutboxRecord(raw as unknown as OutboxItem));
    } catch (err) {
      throw mapAwsError(err, "OutboxRepositoryDdb.pullPending");
    }
  }

  /** Maps a persistence `OutboxItem` into a shared `OutboxRecord`. */
  private toOutboxRecord(it: OutboxItem): OutboxRecord {
    return {
      id: it.id,
      type: it.eventType,
      payload: (it.payload ?? undefined) as unknown,
      occurredAt: it.occurredAt,
      status: it.status,
      attempts: it.attempts,
      lastError: it.lastError,
      traceId: it.traceId,
    };
  }
}
