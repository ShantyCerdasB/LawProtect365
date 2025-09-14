/**
 * @file OutboxConstants.ts
 * @summary Domain constants for outbox operations
 * @description Defines essential constants used throughout the outbox domain
 * 
 * This module contains all constants related to outbox operations, including
 * status values, DynamoDB key prefixes, and other configuration values
 * used for reliable event processing and delivery.
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
  FAILED: "failed"} as const;

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
 * @summary Repository operation limits
 * @description Standard limits for repository operations across the domain
 */
export const REPOSITORY_LIMITS = {
  /** Maximum page size allowed for list operations */
  MAX_PAGE_SIZE: 100,
  /** Default page size when not specified */
  DEFAULT_PAGE_SIZE: 20,
  /** Minimum page size allowed */
  MIN_PAGE_SIZE: 1,
  /** Maximum items per batch operation */
  MAX_BATCH_SIZE: 25,
  /** Maximum retry attempts for failed operations */
  MAX_RETRY_ATTEMPTS: 3,
  /** Default timeout for repository operations (milliseconds) */
  DEFAULT_TIMEOUT_MS: 30000} as const;
