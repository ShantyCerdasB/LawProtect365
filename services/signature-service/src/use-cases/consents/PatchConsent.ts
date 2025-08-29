/**
 * @file PatchConsent.ts
 * @summary Use case: partially update a consent (status/metadata/expiresAt).
 *
 * Reuses shared input mixins (tenant, envelope, consent scopes; metadata; actor; expiresAt)
 * and shared guards (multi-tenant access, envelope mutability, ownership checks).
 *
 * This use case does **not** use `actor` yet; it is included for forward compatibility.
 */

import type { EnvelopesPort } from "@/domain/ports/envelopes";
import type { ConsentRecord, ConsentState } from "@/domain/ports/consent/ConsentsPort";
import type { ConsentStatus } from "@/domain/values/enums";
import {
  ensureEnvelopeAccess,
  assertEnvelopeMutable,
  ensureConsentInEnvelope,
} from "@/use-cases/shared/guards/consent.guard";
import type {
  TenantScoped,
  EnvelopeScoped,
  ConsentScoped,
  WithActor,
  WithMetadata,
  WithExpiresAtInput,
} from "@/use-cases/shared/types/types";
import { asISOOpt, type ISODateString } from "@lawprotect/shared-ts";

/** Adds the optional status field as a composable mixin for patches. */
type WithConsentStatusPatch = { status?: ConsentStatus };

/** Input (max reuse via mixins). */
export interface PatchConsentInput
  extends TenantScoped,
    EnvelopeScoped,
    ConsentScoped,
    WithActor,
    WithMetadata,
    WithExpiresAtInput,
    WithConsentStatusPatch {}

/** Output (reuse canonical domain shape). */
export type PatchConsentOutput = ConsentRecord;

/**
 * Minimal write port needed by this use case (get + update).
 * Keep this local and stable; adapters conform to it.
 */
export interface UpdateConsentPort {
  getById(envelopeId: string, consentId: string): Promise<ConsentState | null>;
  update(
    envelopeId: string,
    consentId: string,
    changes: {
      status?: ConsentStatus;
      metadata?: Record<string, unknown>;
      /** Branded ISO-8601 string */
      expiresAt?: ISODateString;
    }
  ): Promise<ConsentRecord>;
}

/** Context dependencies. */
export interface PatchConsentContext {
  envelopes: EnvelopesPort;
  consents: UpdateConsentPort;
}

/**
 * Partially updates a consent.
 *
 * @param input - Tenant/envelope/consent identifiers plus optional fields to patch
 *                (`status`, `metadata`, `expiresAt`). `actor` is accepted but unused.
 * @param ctx   - Domain ports to access envelopes and consents.
 * @returns     The updated consent record.
 *
 * @throws NotFoundError   If the envelope is not accessible for the tenant or the consent
 *                         does not belong to the envelope.
 * @throws Unprocessable   If the envelope is not in a mutable state.
 */
export async function patchConsent(
  input: PatchConsentInput,
  ctx: PatchConsentContext
): Promise<PatchConsentOutput> {
  const { tenantId, envelopeId, consentId, status, metadata, expiresAt } = input;
  const { envelopes, consents } = ctx;

  // 1) Tenant guard + envelope existence
  const env = await ensureEnvelopeAccess(envelopes, tenantId, envelopeId);

  // 2) Envelope must be mutable (not completed/canceled)
  assertEnvelopeMutable(env.status, envelopeId);

  // 3) Consent must exist and belong to the envelope
  await ensureConsentInEnvelope(consents, envelopeId, consentId);

  // 4) Persist partial changes (brand ISO date at the boundary)
  const updated = await consents.update(envelopeId, consentId, {
    status,
    metadata,
    expiresAt: asISOOpt(expiresAt),
  });

  // 5) Return canonical domain record
  return updated;
}


