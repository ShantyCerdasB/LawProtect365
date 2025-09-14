/**
 * @fileoverview Outbox DynamoDB mappers - Mappers for outbox DynamoDB operations
 * @summary Mappers for converting between outbox domain entities and DynamoDB items
 * @description Provides mappers for converting outbox entities to/from DynamoDB items,
 * including type guards and validation functions.
 */

import type { OutboxDdbItem } from './outbox-ddb-types';
import { OutboxKeyBuilders, OUTBOX_STATUSES } from './outbox-ddb-types';
import { DdbMapperUtils } from '../common/dynamodb-mappers';
import { DynamoDbPrefixes } from '../../../enums/DynamoDbPrefixes';

/**
 * Outbox record interface (domain representation)
 * Represents an outbox record in the domain layer
 */
export interface OutboxRecord {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
  occurredAt: string;
  status: typeof OUTBOX_STATUSES[keyof typeof OUTBOX_STATUSES];
  attempts: number;
  lastError?: string;
  traceId?: string;
}

/**
 * Type guard for outbox DynamoDB items
 * Validates that an object has the structure of an OutboxDdbItem
 */
export function isOutboxDdbItem(item: unknown): item is OutboxDdbItem {
  const obj = item as Partial<OutboxDdbItem> | null | undefined;
  
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const requiredFields = [
    'pk', 'sk', 'type', 'id', 'eventType', 'occurredAt', 'status',
    'attempts', 'gsi1pk', 'gsi1sk', 'createdAt', 'updatedAt'
  ];

  return requiredFields.every(field => 
    typeof obj[field as keyof OutboxDdbItem] === 'string'
  ) && 
  typeof obj.attempts === 'number' &&
  (obj.status === OUTBOX_STATUSES.PENDING || obj.status === OUTBOX_STATUSES.DISPATCHED || obj.status === OUTBOX_STATUSES.FAILED);
}

/**
 * Converts outbox record to DynamoDB item
 * @param record - The outbox record
 * @returns DynamoDB item
 */
export function outboxToDdbItem(record: OutboxRecord): OutboxDdbItem {
  const now = new Date().toISOString();
  const gsi1Key = OutboxKeyBuilders.buildGsi1Key(
    record.status,
    record.occurredAt,
    record.id
  );

  return {
    pk: DynamoDbPrefixes.OUTBOX,
    sk: `ID#${record.id}`,
    type: 'Outbox',
    id: record.id,
    eventType: record.type,
    payload: record.payload,
    occurredAt: record.occurredAt,
    status: record.status,
    attempts: record.attempts,
    lastError: record.lastError,
    traceId: record.traceId,
    gsi1pk: gsi1Key.gsi1pk,
    gsi1sk: gsi1Key.gsi1sk,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Converts DynamoDB item to outbox record
 * @param item - The DynamoDB item
 * @returns Outbox record
 */
export function outboxFromDdbItem(item: OutboxDdbItem): OutboxRecord {
  return {
    id: item.id,
    type: item.eventType,
    payload: item.payload,
    occurredAt: item.occurredAt,
    status: item.status,
    attempts: item.attempts,
    lastError: item.lastError,
    traceId: item.traceId
  };
}

/**
 * Outbox DynamoDB mapper
 * Complete mapper for outbox DynamoDB operations with type guard
 */
export const outboxDdbMapper = DdbMapperUtils.createMapper(
  'Outbox',
  ['pk', 'sk', 'type', 'id', 'eventType', 'occurredAt', 'status', 'attempts', 'gsi1pk', 'gsi1sk', 'createdAt', 'updatedAt'],
  outboxToDdbItem,
  outboxFromDdbItem
);

/**
 * Creates a new outbox record from domain event
 * @param event - Domain event
 * @param traceId - Optional trace ID
 * @returns Outbox record
 */
export function createOutboxRecordFromEvent(
  event: { id: string; type: string; payload?: Record<string, unknown>; occurredAt: string },
  traceId?: string
): OutboxRecord {
  return {
    id: event.id,
    type: event.type,
    payload: event.payload,
    occurredAt: event.occurredAt,
    status: OUTBOX_STATUSES.PENDING,
    attempts: 0,
    traceId
  };
}

/**
 * Updates outbox record status to dispatched
 * @param record - Current outbox record
 * @returns Updated outbox record
 */
export function markOutboxRecordDispatched(record: OutboxRecord): OutboxRecord {
  return {
    ...record,
    status: OUTBOX_STATUSES.DISPATCHED,
    lastError: undefined
  };
}

/**
 * Updates outbox record status to failed
 * @param record - Current outbox record
 * @param error - Error message
 * @returns Updated outbox record
 */
export function markOutboxRecordFailed(record: OutboxRecord, error: string): OutboxRecord {
  return {
    ...record,
    status: OUTBOX_STATUSES.FAILED,
    attempts: record.attempts + 1,
    lastError: error
  };
}
