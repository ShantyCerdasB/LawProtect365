/**
 * @fileoverview Outbox infrastructure types - Barrel exports for outbox infrastructure
 * @summary Centralized exports for outbox DynamoDB types and mappers
 * @description Provides centralized access to all outbox-related infrastructure types,
 * mappers, and utilities for DynamoDB operations.
 */

// DynamoDB types
export type {
  OutboxDdbItem,
  OutboxListCursorPayload,
  OutboxQueryOptions
} from './outbox-ddb-types';

export {
  OutboxKeyBuilders,
  OUTBOX_STATUSES
} from './outbox-ddb-types';

// Mappers and utilities
export type {
  OutboxRecord
} from './outbox-mappers';

export {
  isOutboxDdbItem,
  outboxToDdbItem,
  outboxFromDdbItem,
  outboxDdbMapper,
  createOutboxRecordFromEvent,
  markOutboxRecordDispatched,
  markOutboxRecordFailed
} from './outbox-mappers';

// Result types for outbox operations
import type { OutboxRecord } from './outbox-mappers';

export interface OutboxListResult {
  items: OutboxRecord[];
  cursor?: string;
  hasMore: boolean;
}

export interface OutboxCountResult {
  count: number;
  status?: string;
  eventType?: string;
}
