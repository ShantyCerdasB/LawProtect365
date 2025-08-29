/**
 * @file DelegateConsent.ts
 * @summary Use case: delegate a consent to another party.
 */

import type { EnvelopesPort } from "@/domain/ports/envelopes";
import type { PartiesPort } from "@/domain/ports/parties";
import type { ConsentsPort, DelegationsPort, DelegationRecord } from "@/domain/ports/consent";
import { asISOOpt } from "@lawprotect/shared-ts";
import { unprocessable } from "@/errors";
import { SignatureErrorCodes } from "@/errors/codes";
import {
  ensureEnvelopeAccess,
  assertEnvelopeMutable,
  ensurePartyInEnvelope,
  ensureConsentInEnvelope,
} from "@/use-cases/shared/guards/consent.guard";
import type {
  TenantScoped, EnvelopeScoped, ConsentScoped, WithActor, WithMetadata, WithExpiresAtInput,
} from "@/use-cases/shared/types/types";

export interface DelegateConsentInput
  extends TenantScoped, EnvelopeScoped, ConsentScoped, WithActor, WithMetadata, WithExpiresAtInput {
  delegatePartyId: string;
  reason?: string;
}

export type DelegateConsentOutput = DelegationRecord;

export interface DelegateConsentContext {
  envelopes: EnvelopesPort;
  consents: ConsentsPort;
  parties: PartiesPort;
  delegations: DelegationsPort;
}

/**
 * Delegates a granted consent to another party within the same envelope.
 * @param input DelegateConsentInput
 * @param ctx   DelegateConsentContext
 */
export async function delegateConsent(
  input: DelegateConsentInput,
  ctx: DelegateConsentContext
): Promise<DelegateConsentOutput> {
  const { tenantId, envelopeId, consentId, delegatePartyId, reason, expiresAt, metadata } = input;
  const { envelopes, consents, parties, delegations } = ctx;

  const env = await ensureEnvelopeAccess(envelopes, tenantId, envelopeId);
  assertEnvelopeMutable(env.status, envelopeId);

  const con = await ensureConsentInEnvelope(consents, envelopeId, consentId);

  if (con.status !== "granted") {
    throw unprocessable(
      "Can only delegate consents that have been granted",
      SignatureErrorCodes.INPUT_TYPE_NOT_ALLOWED,
      { consentId, status: con.status }
    );
  }

  const delegate = await ensurePartyInEnvelope(parties, envelopeId, delegatePartyId);
  if (con.partyId === delegate.partyId) {
    throw unprocessable(
      "Cannot delegate consent to the same party",
      SignatureErrorCodes.INPUT_TYPE_NOT_ALLOWED,
      { consentId, partyId: delegatePartyId }
    );
  }

  return delegations.create({
    tenantId,
    envelopeId,
    consentId,
    originalPartyId: con.partyId,
    delegatePartyId,
    reason,
    expiresAt: asISOOpt(expiresAt),
    metadata,
  });
}

