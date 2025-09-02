/**
 * @file OutboxWorkerTypes.ts
 * @summary Types for outbox worker operations
 * @description Defines interfaces and types for outbox worker functionality
 */

/**
 * Configuration options for the outbox worker.
 */
export interface OutboxWorkerOptions {
  /** Maximum number of events to process in a single batch. */
  maxBatchSize?: number;
  /** Maximum time to wait before processing a batch (milliseconds). */
  maxWaitTimeMs?: number;
  /** Maximum number of retry attempts for failed events. */
  maxRetries?: number;
  /** Delay between retry attempts (milliseconds). */
  retryDelayMs?: number;
  /** Whether to enable debug logging. */
  debug?: boolean;
}

/**
 * Result of processing a single outbox event.
 */
export interface OutboxProcessingResult {
  /** Event ID that was processed. */
  eventId: string;
  /** Whether the event was successfully processed. */
  success: boolean;
  /** Error message if processing failed. */
  error?: string;
  /** Number of attempts made. */
  attempts: number;
  /** Processing duration in milliseconds. */
  durationMs: number;
}

/**
 * Result of processing a batch of outbox events.
 */
export interface OutboxBatchProcessingResult {
  /** Total number of events in the batch. */
  totalEvents: number;
  /** Number of successfully processed events. */
  successfulEvents: number;
  /** Number of failed events. */
  failedEvents: number;
  /** Detailed results for each event. */
  results: OutboxProcessingResult[];
  /** Total processing duration in milliseconds. */
  totalDurationMs: number;
}
