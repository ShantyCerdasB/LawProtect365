/**
 * @file SubmitConsent.ts
 * @summary Use case: submit (grant) a consent with audit evidence.
 *
 * Ensures:
 * - Envelope exists & belongs to tenant and is mutable.
 * - Consent exists within the envelope and is not revoked/denied.
 * Then marks it as "granted" and merges the consent evidence into metadata.
 */

import type { EnvelopesPort } from "@/domain/ports/envelopes";
import type { ConsentRecord as DomainConsentRecord, ConsentState } from "@/domain/ports/consent/ConsentsPort";
import { unprocessable } from "@/shared/errors";
import { SignatureErrorCodes } from "@/shared/errors/codes";
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
  WithMetadataOptional,
} from "@/use-cases/shared/types/types";

/** VO name conflicts with domain type, so alias it */
import type {
  ConsentRecord as ConsentEvidence,
} from "@/domain/value-objects/ConsentRecord";

/** Input for submitting (granting) a consent. */
export interface SubmitConsentInput
  extends TenantScoped, EnvelopeScoped, ConsentScoped, WithActor, WithMetadataOptional {
  /** Consent evidence (timestamp/ip/ua/locale) validated at the edge. */
  consent: ConsentEvidence;
}

/** Output is the updated domain-level consent record. */
export type SubmitConsentOutput = DomainConsentRecord;

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
      status: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<DomainConsentRecord>;
}

/** External dependencies (ports). */
export interface SubmitConsentContext {
  envelopes: EnvelopesPort;
  consents: UpdateConsentPort;
}

/**
 * Submits a consent: validates guards, then marks it as granted and
 * persists the consent evidence into metadata.
 *
 * @param input - {@link SubmitConsentInput}
 * @param ctx   - {@link SubmitConsentContext}
 * @returns Updated {@link DomainConsentRecord}
 */
export async function submitConsent(
  input: SubmitConsentInput,
  ctx: SubmitConsentContext
): Promise<SubmitConsentOutput> {
  const { tenantId, envelopeId, consentId, consent, metadata } = input;
  const { envelopes, consents } = ctx;

  // 1) Envelope boundary + mutability
  const env = await ensureEnvelopeAccess(envelopes, tenantId, envelopeId);
  assertEnvelopeMutable(env.status, envelopeId);

  // 2) Consent must exist in the envelope
  const con = await ensureConsentInEnvelope(consents, envelopeId, consentId);

  // 3) Business rule: cannot grant revoked/denied
  if (con.status === "revoked" || con.status === "denied") {
    throw unprocessable(
      "Cannot grant a revoked/denied consent",
      SignatureErrorCodes.INPUT_TYPE_NOT_ALLOWED,
      { consentId, status: con.status }
    );
  }

  // 4) Merge evidence into metadata
  const mergedMetadata = {
    ...(metadata ?? {}),
    consent, // store evidence under a stable key
  };

  // 5) Persist changes
  const updated = await consents.update(envelopeId, consentId, {
    status: "granted",
    metadata: mergedMetadata,
  });

  return updated;
}
