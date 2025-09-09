/**
 * @file Audit.rules.ts
 * @summary Domain invariants for immutable audit trail events.
 *
 * Provides guards to enforce immutability, ordering, scoping, and
 * basic payload sanity for audit events persisted by the adapters.
 */

import { BadRequestError, ErrorCodes } from "../errors/index.js";

/**
 * Assert the minimal immutable shape of an audit event.
 *
 * @param e - Candidate audit event.
 * @throws {BadRequestError} When the value is not an object or required fields are missing.
 */
export const assertImmutable = (e: any): void => {
  if (!e || typeof e !== "object") {
    throw new BadRequestError("Invalid audit event value");
  }
  if (!e.id || !e.occurredAt || !e.type) {
    throw new BadRequestError("Invalid audit event shape");
  }
};

/**
 * Assert items are strictly ordered by `occurredAt` ascending,
 * using `id` as a stable tiebreaker when timestamps are equal.
 *
 * @param items - Sequence of audit events to validate.
 * @throws {BadRequestError} When the order is not strictly ascending or stable by id.
 */
export const assertAscendingByTime = (items: readonly any[]): void => {
  for (let i = 1; i < items.length; i++) {
    const a = items[i - 1];
    const b = items[i];
    if (a.occurredAt > b.occurredAt) {
      throw new BadRequestError("Audit events are not ordered by occurredAt ASC");
    }
    if (a.occurredAt === b.occurredAt && a.id > b.id) {
      throw new BadRequestError("Audit events are not stable-ordered (id tiebreaker)");
    }
  }
};

/**
 * Check if the event belongs to the given tenant.
 *
 * @param eventTenantId - Tenant id in the event.
 * @param tenantId - Expected tenant id.
 * @returns True when both tenant ids match.
 */
export const sameTenant = (eventTenantId: string, tenantId: string): boolean =>
  eventTenantId === tenantId;

/**
 * Check if the event belongs to the given envelope.
 *
 * @param eventEnvelopeId - Envelope id in the event.
 * @param envelopeId - Expected envelope id.
 * @returns True when both envelope ids match.
 */
export const sameEnvelope = (eventEnvelopeId: string, envelopeId: string): boolean =>
  eventEnvelopeId === envelopeId;

/**
 * Assert a non-empty event type string.
 *
 * @param t - Event type to validate.
 * @throws {BadRequestError} When the type is empty or not a string.
 */
export const assertEventType = (t: string): void => {
  if (!t || typeof t !== "string" || !t.trim()) {
    throw new BadRequestError("Invalid audit event type");
  }
};

/**
 * Assert the actor payload has an object shape (if present).
 *
 * @param a - Actor payload to validate.
 * @throws {BadRequestError} When the actor payload is not an object.
 */
export const assertActorShape = (a: unknown): void => {
  if (a && typeof a !== "object") {
    throw new BadRequestError("Invalid actor payload");
  }
};

/**
 * Assert the metadata is JSON-serializable at a basic level.
 *
 * @param m - Metadata to validate.
 * @throws {BadRequestError} When serialization fails.
 */
export const assertMetadataSerializable = (m: unknown): void => {
  try {
    JSON.stringify(m);
  } catch {
    throw new BadRequestError("Audit metadata is not serializable");
  }
};

/**
 * Chain-link invariant: if `prevHash` is present then `hash` must be present.
 *
 * @param e - Audit event to validate.
 * @throws {BadRequestError} When `prevHash` exists but `hash` is missing.
 */
export const assertChainLink = (e: any): void => {
  if (e.prevHash && !e.hash) {
    throw new BadRequestError("prevHash present but hash missing");
  }
};






