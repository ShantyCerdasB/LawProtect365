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
  OutboxQueryOptions,
  OutboxListResult,
  OutboxCountResult
} from './outbox-ddb-types.js';

export {
  OutboxKeyBuilders,
  OUTBOX_STATUSES
} from './outbox-ddb-types.js';

// Mappers and utilities
export type {
  OutboxRecord
} from './outbox-mappers.js';

export {
  isOutboxDdbItem,
  outboxToDdbItem,
  outboxFromDdbItem,
  outboxDdbMapper,
  createOutboxRecordFromEvent,
  markOutboxRecordDispatched,
  markOutboxRecordFailed
} from './outbox-mappers.js';

// Result types are now exported from outbox-ddb-types.js

// Repository
export { OutboxRepository } from './OutboxRepository.js';
