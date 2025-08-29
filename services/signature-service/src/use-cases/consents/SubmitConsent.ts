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
import type { ConsentRecord as DomainConsentRecord } from "@/domain/ports/consent/ConsentsPort";
import type { UpdateConsentPort } from "@/app/ports/consent/MakeUpdateConsentPort";
import { unprocessable } from "@/errors";
import { SignatureErrorCodes } from "@/errors/codes";
import {
  ensureEnvelopeAccess,
  assertEnvelopeMutable,
  ensureConsentInEnvelope,
} from "@/use-cases/shared/guards/consent.guard";
import type {
  TenantEnvelopeConsentInput,
  WithActor,
  WithMetadataOptional,
} from "@/use-cases/shared/types/types";

/** VO name conflicts with domain type, so alias it */
import type {
  ConsentRecord as ConsentEvidence,
} from "@/domain/value-objects/ConsentRecord";

/** Input for submitting (granting) a consent. */
export interface SubmitConsentInput
  extends TenantEnvelopeConsentInput, WithActor, WithMetadataOptional {
  /** Consent evidence (timestamp/ip/ua/locale) validated at the edge. */
  consent: ConsentEvidence;
}

/** Output is the updated domain-level consent record. */
export type SubmitConsentOutput = DomainConsentRecord;

/** External dependencies (ports). */
export interface SubmitConsentContext {
  envelopes: EnvelopesPort;
  /** getById(envelopeId, consentId) + update(...) */
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
