import { ulid } from "../utils/id.js";
import type { DomainEvent } from "./DomainEvent.js";

/**
 * Creates a new domain event with generated id and timestamp.
 * @param type Fully-qualified event type.
 * @param payload Event payload.
 * @param metadata Optional metadata for routing/tracing.
 */
export const makeEvent = <T>(
  type: string,
  payload: T,
  metadata?: Record<string, string>
): DomainEvent<T> => ({
  id: ulid(),
  type,
  occurredAt: new Date().toISOString(),
  payload,
  metadata
});
