/**
 * @file Envelope.ts
 * @summary Envelope aggregate root for the signature domain.
 *
 * @description
 * Represents an e-signature envelope that owns documents, parties, and inputs.
 * Lifecycle invariants and transitions are enforced by dedicated domain rules.
 * This aggregate is intentionally minimal and serializable.
 */

import type { EnvelopeId, TenantId, UserId } from "../value-objects/Ids";
import type { EnvelopeStatus } from "../value-objects/EnvelopeStatus";

/**
 * Envelope aggregate.
 */
export interface Envelope {
  /** Canonical identifier of the envelope (ULID/UUID brand). */
  envelopeId: EnvelopeId;

  /** Owner (creator) of the envelope. */
  ownerId: UserId;

  /** Tenant owning the resource (multitenancy boundary). */
  tenantId: TenantId;

  /** Human-friendly title (trimmed, typically ≤ 255 chars). */
  title: string;

  /** Current lifecycle status of the envelope. */
  status: EnvelopeStatus;

  /** ISO-8601 creation timestamp. */
  createdAt: string;

  /** ISO-8601 last update timestamp. */
  updatedAt: string;

  /** Associated party identifiers. */
  parties: string[];

  /** Associated document identifiers. */
  documents: string[];

  /** Optional policy configuration at the envelope level. */
  policies?: Record<string, unknown>;

  /** Free-form metadata for extensibility. */
  metadata?: Record<string, unknown>;
}
