/**
 * @file mappers.ts
 * @summary Outbox mappers for DynamoDB
 * @description Mappers between domain and DynamoDB types
 */

import type { OutboxRecord } from "../../events/index.js";
import { nowIso } from "../../utils/index.js";
import type { AwsOutboxRepoCreateInput, OutboxItemDTO } from "./types.js";
import { OUTBOX_PARTITION_KEY, OUTBOX_SORT_KEY_PREFIX, OUTBOX_STATUS_PK_PREFIX, OUTBOX_STATUSES } from "./types.js";

export const mapCreateInputToDto = (input: AwsOutboxRepoCreateInput): OutboxItemDTO => {
  const now = nowIso();
  const item: Record<string, any> = {
    pk: OUTBOX_PARTITION_KEY,
    sk: `${OUTBOX_SORT_KEY_PREFIX}${input.id}`,
    type: "Outbox",
    id: input.id,
    eventType: input.eventType,
    occurredAt: input.occurredAt,
    status: OUTBOX_STATUSES.PENDING,
    gsi1pk: `${OUTBOX_STATUS_PK_PREFIX}${OUTBOX_STATUSES.PENDING}`,
    gsi1sk: `${input.occurredAt}#${input.id}`,
    attempts: 0,
    createdAt: now,
    updatedAt: now
  };

  // Only add optional fields if they have values
  if (input.payload) {
    item.payload = input.payload;
  }
  if (input.traceId) {
    item.traceId = input.traceId;
  }

  return item as OutboxItemDTO;
};

export const mapDtoToRecord = (dto: OutboxItemDTO): OutboxRecord => {
  return {
    id: dto.id,
    type: dto.eventType,
    payload: dto.payload,
    occurredAt: dto.occurredAt,
    status: dto.status as "pending" | "dispatched" | "failed",
    attempts: dto.attempts,
    lastError: dto.lastError,
    traceId: dto.traceId};
};
