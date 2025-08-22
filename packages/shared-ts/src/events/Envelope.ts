import type { DomainEvent } from "./DomainEvent.js";

/**
 * Transport envelope for domain events.
 * Captures broker-specific metadata without leaking into domain.
 */
export interface EventEnvelopes<T = unknown> {
  /** Embedded domain event. */
  event: DomainEvent<T>;
  /** Broker message id or delivery tag. */
  messageId?: string;
  /** Trace correlation id. */
  traceId?: string;
  /** Redelivery counter. */
  deliveries?: number;
  /** Logical source (service name). */
  source?: string;
  /** Partition key for ordered streams. */
  partitionKey?: string;
  /** Deduplication key for FIFO queues. */
  deduplicationKey?: string;
  /** Additional transport headers. */
  headers?: Record<string, string>;
}
