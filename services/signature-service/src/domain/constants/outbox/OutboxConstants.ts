/**
 * @file OutboxConstants.ts
 * @summary Domain constants for outbox operations
 * @description Defines essential constants used throughout the outbox domain
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









