/**
 * @file types.ts
 * @summary Shared mixin types for use case inputs to avoid duplication.
 */

export type ActorInfo = {
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
};

export type WithActor = { actor?: ActorInfo };
export type WithMetadata = { metadata?: Record<string, unknown> };
export type WithExpiresAtInput = { /** ISO-8601 string */ expiresAt?: string };

export type TenantScoped   = { tenantId: string };
export type EnvelopeScoped = { envelopeId: string };
export type ConsentScoped  = { consentId: string };
export type PartyScoped    = { partyId: string };

export type WithPagination = {
  /** Page size (capped by use case) */
  limit?: number;
  /** Forward-only opaque cursor */
  cursor?: string;
};

/** ── NEW: reusable composites used by SubmitConsent ──────────────────────── */
export type TenantEnvelopeConsentInput = TenantScoped & EnvelopeScoped & ConsentScoped;

