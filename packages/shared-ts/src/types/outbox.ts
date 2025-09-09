/**
 * @file outbox.ts
 * @summary Types for outbox repository operations
 * @description Defines interfaces and types for outbox repository functionality
 */

/**
 * Input for creating a new outbox record.
 */
export interface OutboxRepoCreateInput {
  /** Unique identifier for the outbox record. */
  id: string;
  /** Type of domain event. */
  eventType: string;
  /** Event payload data. */
  payload?: Record<string, unknown>;
  /** When the event occurred (ISO string or Date). */
  occurredAt: string | Date;
  /** Optional trace ID for distributed tracing. */
  traceId?: string;
}



