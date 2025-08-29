/**
 * @file DeleteConsent.ts
 * @summary Use case: delete a consent record.
 *
 * Ensures the envelope exists and belongs to the tenant, checks the envelope
 * is mutable (not completed/canceled), verifies the consent exists within the
 * envelope, enforces business rules (cannot delete a granted consent), and
 * delegates the deletion to the ConsentsPort.
 */

import type { EnvelopesPort } from "@/domain/ports/envelopes";
import type {
  ConsentsPort,
  DeleteConsentResult,
} from "@/domain/ports/consent/ConsentsPort";
import { unprocessable } from "@/errors";
import { SignatureErrorCodes } from "@/errors/codes";
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
} from "@/use-cases/shared/types/types";

/** Input for deleting a consent (mixins to avoid duplication). */
export interface DeleteConsentInput
  extends TenantScoped, EnvelopeScoped, ConsentScoped, WithActor {}

/** Dependencies required by the use case. */
export interface DeleteConsentContext {
  envelopes: EnvelopesPort;
  consents: ConsentsPort;
}

/**
 * Deletes a consent from an envelope.
 *
 * @param input - {@link DeleteConsentInput} identifying the tenant, envelope and consent.
 * @param ctx   - {@link DeleteConsentContext} ports (envelopes + consents).
 * @returns A promise resolving to {@link DeleteConsentResult} with the deletion receipt.
 *
 * @throws NotFoundError    - If the envelope does not exist or belongs to another tenant,
 *                            or if the consent does not exist within the envelope.
 * @throws UnprocessableError - If the envelope is not mutable, or the consent is granted.
 */
export async function deleteConsent(
  input: DeleteConsentInput,
  ctx: DeleteConsentContext
): Promise<DeleteConsentResult> {
  const { tenantId, envelopeId, consentId } = input;
  const { envelopes, consents } = ctx;

  // 1) Multi-tenant guard + envelope existence
  const env = await ensureEnvelopeAccess(envelopes, tenantId, envelopeId);

  // 2) Envelope must be mutable (not completed/canceled)
  assertEnvelopeMutable(env.status, envelopeId);

  // 3) Consent must exist and belong to this envelope
  const con = await ensureConsentInEnvelope(consents, envelopeId, consentId);

  // 4) Business rule: cannot delete granted consents
  if (con.status === "granted") {
    throw unprocessable(
      "Cannot delete consent that has been granted",
      SignatureErrorCodes.INPUT_TYPE_NOT_ALLOWED,
      { consentId }
    );
  }

  // 5) Delegate deletion to the port (returns receipt with deletedAt)
  return consents.delete(envelopeId, consentId);
}

