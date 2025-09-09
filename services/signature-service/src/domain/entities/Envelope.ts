/**
 * @file Envelope.ts
 * @summary Envelope aggregate root for the signature domain.
 *
 * @description
 * Represents an e-signature envelope that owns documents, parties, and inputs.
 * Lifecycle invariants and transitions are enforced by dedicated domain rules.
 * This aggregate is intentionally minimal and serializable.
 */

import type { EnvelopeId, TenantId, UserId } from "@/domain/value-objects/ids";
import type { EnvelopeStatus } from "@/domain/value-objects/index";

/**
 * Envelope aggregate.
 */
export interface Envelope {
  /** Canonical identifier of the envelope (ULID/UUID brand). */
  readonly envelopeId: EnvelopeId;

  /** Owner (creator) of the envelope. */
  readonly ownerId: UserId;

  /** Tenant owning the resource (multitenancy boundary). */
  readonly tenantId: TenantId;

  /** Human-friendly title (trimmed, typically ≤ 255 chars). */
  readonly title: string;

  /** Current lifecycle status of the envelope. */
  readonly status: EnvelopeStatus;

  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;

  /** ISO-8601 last update timestamp. */
  readonly updatedAt: string;

  /** Associated party identifiers. */
  readonly parties: string[];

  /** Associated document identifiers. */
  readonly documents: string[];

  /** Optional policy configuration at the envelope level. */
  readonly policies?: Record<string, unknown>;

  /** Free-form metadata for extensibility. */
  readonly metadata?: Record<string, unknown>;
}






