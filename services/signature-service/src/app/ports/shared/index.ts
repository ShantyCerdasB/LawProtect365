/**
 * Shared app-port types to avoid duplication across envelopes/parties adapters.
 * Prefer importing enums and id value objects from the domain.
 */
import type { EnvelopeStatus, PartyRole, PartyStatus } from "@/domain/values/enums";
import type { TenantId, EnvelopeId, PartyId, UserId } from "@/domain/value-objects/Ids";

/** Common pagination input (forward-only). */
export type PageOpts = { limit?: number; cursor?: string };

/** Common pagination result. */
export type Page<T> = { items: T[]; nextCursor?: string };

/** Minimal envelope head used across app flows. */
export type EnvelopeHead = {
  envelopeId: EnvelopeId;
  tenantId: TenantId;
  status: EnvelopeStatus;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
};

/** Minimal party head used across app flows. */
export type PartyHead = {
  partyId: PartyId;
  envelopeId: EnvelopeId;
  email?: string;
  name?: string;
  role?: PartyRole;
  status?: PartyStatus;
  order?: number;
};

/** Common patch shapes */
export type EnvelopePatch = {
  title?: string;
  status?: EnvelopeStatus;
  metadata?: Record<string, unknown>;
};

export type PartyPatch = {
  email?: string;
  name?: string;
  role?: PartyRole;
  status?: PartyStatus;
  order?: number;
  metadata?: Record<string, unknown>;
};

/** Re-export domain ids to keep single source of truth for types. */
export type { TenantId, EnvelopeId, PartyId, UserId };
export type { EnvelopeStatus, PartyRole, PartyStatus };

export type PartyRow = {
  partyId: PartyId | string;
  envelopeId: EnvelopeId | string;
  email?: string;
  name?: string;
  role?: PartyRole | string;
  status?: PartyStatus | string;
  order?: number;
};