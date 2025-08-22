
/**
 * @file Audit.rules.ts
 * @summary Domain invariants for immutable audit trail events.
 *
 * @description
 * Provides lightweight guards to enforce immutability, ordering, scoping, and
 * basic payload sanity for audit events persisted by the adapters.
 */

import type { AuditEvent } from "../value-objects/Audit";

/**
 * Asserts the event has the minimal immutable shape.
 * Guards against accidental mutation-prone shapes reaching persistence.
 *
 * @throws Error when required fields are missing.
 */
export const assertImmutable = (e: AuditEvent): void => {
  if (!e || typeof e !== "object") throw new Error("Invalid audit event value");
  if (!e.id || !e.occurredAt || !e.type) {
    throw new Error("Invalid audit event shape");
  }
};

/**
 * Asserts items are strictly ordered by `occurredAt` ascending,
 * using `id` as a stable tiebreaker when timestamps are equal.
 *
 * @throws Error when the order is not strictly ascending.
 */
export const assertAscendingByTime = (items: readonly AuditEvent[]): void => {
  for (let i = 1; i < items.length; i++) {
    const a = items[i - 1];
    const b = items[i];
    if (a.occurredAt > b.occurredAt) {
      throw new Error("Audit events are not ordered by occurredAt ASC");
    }
    if (a.occurredAt === b.occurredAt && a.id > b.id) {
      throw new Error("Audit events are not stable-ordered (id tiebreaker)");
    }
  }
};

/** Returns true when the event belongs to the given tenant. */
export const sameTenant = (eventTenantId: string, tenantId: string): boolean =>
  eventTenantId === tenantId;

/** Returns true when the event belongs to the given envelope. */
export const sameEnvelope = (eventEnvelopeId: string, envelopeId: string): boolean =>
  eventEnvelopeId === envelopeId;

/**
 * Asserts a non-empty event type string.
 *
 * @throws Error when the type is empty or not a string.
 */
export const assertEventType = (t: string): void => {
  if (!t || typeof t !== "string" || !t.trim()) {
    throw new Error("Invalid audit event type");
  }
};

/**
 * Asserts the actor payload has an object shape (if present).
 *
 * @throws Error when the actor payload is invalid.
 */
export const assertActorShape = (a: unknown): void => {
  if (a && typeof a !== "object") throw new Error("Invalid actor payload");
};

/**
 * Asserts the metadata is JSON-serializable at a basic level.
 *
 * @throws Error when serialization fails.
 */
export const assertMetadataSerializable = (m: unknown): void => {
  try {
    JSON.stringify(m);
  } catch {
    throw new Error("Audit metadata is not serializable");
  }
};

/**
 * Chain-link invariant: if `prevHash` is present then `hash` must be present.
 *
 * @throws Error when the chain-link is inconsistent.
 */
export const assertChainLink = (e: AuditEvent): void => {
  if (e.prevHash && !e.hash) {
    throw new Error("prevHash present but hash missing");
  }
};
