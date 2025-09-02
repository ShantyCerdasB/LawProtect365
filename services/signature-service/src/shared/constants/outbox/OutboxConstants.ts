/**
 * @file OutboxConstants.ts
 * @summary Constants for outbox operations
 * @description Defines constants used throughout the outbox system
 */

/**
 * Outbox record statuses.
 */
export const OUTBOX_STATUSES = {
  /** Event is pending processing. */
  PENDING: "pending",
  /** Event was successfully processed. */
  DISPATCHED: "dispatched",
  /** Event processing failed. */
  FAILED: "failed",
} as const;

export type OutboxStatus = (typeof OUTBOX_STATUSES)[keyof typeof OUTBOX_STATUSES];

/**
 * DynamoDB partition key for outbox records.
 */
export const OUTBOX_PARTITION_KEY = "OUTBOX";

/**
 * DynamoDB sort key prefix for outbox records.
 */
export const OUTBOX_SORT_KEY_PREFIX = "ID#";

/**
 * GSI partition key prefix for status-based queries.
 */
export const OUTBOX_STATUS_PK_PREFIX = "STATUS#";

/**
 * Default configuration values for outbox worker.
 */
export const DEFAULT_OUTBOX_WORKER_CONFIG = {
  /** Default batch size for processing events. */
  MAX_BATCH_SIZE: 10,
  /** Default wait time before processing batch (ms). */
  MAX_WAIT_TIME_MS: 5000,
  /** Default maximum retry attempts. */
  MAX_RETRIES: 3,
  /** Default delay between retries (ms). */
  RETRY_DELAY_MS: 1000,
  /** Default debug mode. */
  DEBUG: false,
} as const;

/**
 * Maximum values for outbox worker configuration.
 */
export const MAX_OUTBOX_WORKER_CONFIG = {
  /** Maximum batch size. */
  MAX_BATCH_SIZE: 100,
  /** Maximum wait time (ms). */
  MAX_WAIT_TIME_MS: 30000,
  /** Maximum retry attempts. */
  MAX_RETRIES: 10,
  /** Maximum retry delay (ms). */
  RETRY_DELAY_MS: 10000,
} as const;
