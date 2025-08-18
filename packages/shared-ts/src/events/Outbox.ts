import type { DomainEvent } from "./DomainEvent.js";

/**
 * Outbox record persisted in the same database as business data.
 */
export interface OutboxRecord<T = unknown> {
  id: string;
  type: string;
  payload: T;
  occurredAt: string;
  status: "pending" | "dispatched" | "failed";
  attempts: number;
  lastError?: string;
  traceId?: string;
}

/**
 * Outbox port used by repositories/services to enqueue events.
 */
export interface OutboxPort {
  /**
   * Persists an event in the outbox.
   * @param evt Domain event to store.
   * @param traceId Optional correlation id.
   */
  save(evt: DomainEvent, traceId?: string): Promise<void>;

  /**
   * Marks a record as dispatched.
   * @param id Outbox id.
   */
  markDispatched(id: string): Promise<void>;

  /**
   * Marks a record as failed and increments attempts.
   * @param id Outbox id.
   * @param error Error description.
   */
  markFailed(id: string, error: string): Promise<void>;

  /**
   * Pulls a batch of pending records for dispatch.
   * @param limit Max number of records.
   */
  pullPending(limit: number): Promise<OutboxRecord[]>;
}
