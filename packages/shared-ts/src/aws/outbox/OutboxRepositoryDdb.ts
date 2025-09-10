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

import type {
  OutboxPort,
  DomainEvent,
  OutboxRecord} from "../../index.js";
import type { DdbClientLike } from "../ddb.js";
import {
  clamp,
  mapAwsError,
  ConflictError,
  ErrorCodes,
  requireQuery,
  requireUpdate} from "../../index.js";
import { mapCreateInputToDto, mapDtoToRecord } from "./mappers.js";
import type { OutboxRepositoryDdbProps, AwsOutboxRepoCreateInput, OutboxItemDTO } from "./types.js";
import { 
  DEFAULT_ENTITY_INDEX,
  OUTBOX_PARTITION_KEY, 
  OUTBOX_SORT_KEY_PREFIX, 
  OUTBOX_STATUS_PK_PREFIX,
  OUTBOX_STATUSES 
} from "./types.js";

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
    this.ddb = props.client as DdbClientLike;
    this.idxByStatus = props.indexes?.byStatus ?? DEFAULT_ENTITY_INDEX;
  }

  /**
   * Saves a `DomainEvent` into the outbox as a `pending` record.
   * Uses a conditional put to ensure the same `id` is not overwritten.
   * Implements OutboxPort.save
   */
  async save(evt: DomainEvent, traceId?: string): Promise<void> {
    const input: AwsOutboxRepoCreateInput = {
      id: evt.id,
      eventType: evt.type,
      payload: evt.payload ? (evt.payload as Record<string, unknown>) : undefined,
      occurredAt: evt.occurredAt,
      traceId};

    const item = mapCreateInputToDto(input);

    try {
      await this.ddb.put({
        TableName: this.table,
        Item: item as unknown as Record<string, unknown>,
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"});
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
        Key: { pk: OUTBOX_PARTITION_KEY, sk: `${OUTBOX_SORT_KEY_PREFIX}${id}` },
        UpdateExpression: [
          "SET #status = :s",
          "#gpk = :g",
          "#updatedAt = :now",
          // ensure attempts is initialized; not strictly required but useful
          "#attempts = if_not_exists(#attempts, :zero)",
          // clear lastError on success
          "REMOVE #lastError",
        ].join(", "),
        ExpressionAttributeNames: {
          "#status": "status",
          "#gpk": "gsi1pk",
          "#updatedAt": "updatedAt",
          "#attempts": "attempts",
          "#lastError": "lastError"},
        ExpressionAttributeValues: {
          ":s": OUTBOX_STATUSES.DISPATCHED,
          ":g": `${OUTBOX_STATUS_PK_PREFIX}${OUTBOX_STATUSES.DISPATCHED}`,
          ":now": new Date().toISOString(),
          ":zero": 0},
        ReturnValues: "NONE"});
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
        Key: { pk: OUTBOX_PARTITION_KEY, sk: `${OUTBOX_SORT_KEY_PREFIX}${id}` },
        UpdateExpression: [
          "SET #status = :s",
          "#gpk = :g",
          "#updatedAt = :now",
          "#attempts = if_not_exists(#attempts, :zero) + :one",
          "#lastError = :err",
        ].join(", "),
        ExpressionAttributeNames: {
          "#status": "status",
          "#gpk": "gsi1pk",
          "#updatedAt": "updatedAt",
          "#attempts": "attempts",
          "#lastError": "lastError"},
        ExpressionAttributeValues: {
          ":s": OUTBOX_STATUSES.FAILED,
          ":g": `${OUTBOX_STATUS_PK_PREFIX}${OUTBOX_STATUSES.FAILED}`,
          ":now": new Date().toISOString(),
          ":zero": 0,
          ":one": 1,
          ":err": String(error)},
        ReturnValues: "NONE"});
    } catch (err) {
      throw mapAwsError(err, "OutboxRepositoryDdb.markFailed");
    }
  }

  /**
   * Pulls up to `limit` oldest pending records ordered by `occurredAt` then `id`.
   * Results are mapped back to `OutboxRecord`.
   * Implements OutboxPort.pullPending
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
        ExpressionAttributeValues: { ":pk": `${OUTBOX_STATUS_PK_PREFIX}${OUTBOX_STATUSES.PENDING}` },
        Limit: pageSize,
        ScanIndexForward: true, // oldest first
      });

      const items = (out.Items ?? []) as Array<Record<string, unknown>>;
      return items.map((raw) => mapDtoToRecord(raw as unknown as OutboxItemDTO));
    } catch (err) {
      throw mapAwsError(err, "OutboxRepositoryDdb.pullPending");
    }
  }
}

