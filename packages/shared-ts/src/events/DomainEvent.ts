/**
 * Domain event describing a meaningful business occurrence.
 */
export interface DomainEvent<T = unknown> {
  /** Unique event identifier. */
  id: string;
  /** Event type (namespace.name). */
  type: string;
  /** ISO timestamp when the event occurred. */
  occurredAt: string;
  /** Event payload. */
  payload: T;
  /** Optional metadata for tracing and routing. */
  metadata?: Record<string, string>;
}
