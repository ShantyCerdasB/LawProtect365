/**
 * @file OutboxItemDTO.mapper.ts
 * @summary Mapper for outbox DTO to repository row conversion
 * @description Maps between DynamoDB item format and domain types for outbox operations
 */

import type { OutboxRepoCreateInput } from "../../../domain/types/outbox";
import type { OutboxItemDTO } from "../../../domain/types/outbox/OutboxDTO";
import type { OutboxRecord } from "@lawprotect/shared-ts";
import { 
  OUTBOX_PARTITION_KEY, 
  OUTBOX_SORT_KEY_PREFIX, 
  OUTBOX_STATUS_PK_PREFIX,
  OUTBOX_STATUSES 
} from "../../../domain/constants/outbox";

/**
 * @summary Maps a create input to DynamoDB item
 * @description Converts OutboxRepoCreateInput to OutboxItemDTO for persistence
 * @param input - Input data for creating outbox record
 * @returns DynamoDB item ready for persistence
 */
export function mapCreateInputToDto(input: OutboxRepoCreateInput): OutboxItemDTO {
  const now = new Date().toISOString();
  const status = OUTBOX_STATUSES.PENDING;
  const attempts = 0;
  
  return {
    pk: OUTBOX_PARTITION_KEY,
    sk: `${OUTBOX_SORT_KEY_PREFIX}${input.id}`,
    type: "Outbox",
    id: input.id,
    eventType: input.eventType,
    payload: input.payload,
    occurredAt: typeof input.occurredAt === 'string' ? input.occurredAt : input.occurredAt.toISOString(),
    status,
    attempts,
    lastError: undefined,
    traceId: input.traceId,
    gsi1pk: `${OUTBOX_STATUS_PK_PREFIX}${status}`,
    gsi1sk: `${typeof input.occurredAt === 'string' ? input.occurredAt : input.occurredAt.toISOString()}#${input.id}`,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * @summary Maps a DynamoDB item to domain record
 * @description Converts OutboxItemDTO to OutboxRecord for domain operations
 * @param dto - DynamoDB item
 * @returns Domain outbox record
 */
export function mapDtoToRecord(dto: OutboxItemDTO): OutboxRecord {
  return {
    id: dto.id,
    type: dto.eventType,
    payload: dto.payload,
    occurredAt: dto.occurredAt,
    status: dto.status as OutboxRecord["status"],
    attempts: dto.attempts,
    lastError: dto.lastError,
    traceId: dto.traceId,
  };
}








