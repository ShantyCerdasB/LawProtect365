/**
 * @file AddConsent.ts
 * @summary Use case: add a consent for a party to an envelope.
 *
 * Validates envelope & party existence and creates a consent via domain ports.
 * Emits service-specific errors that the shared HTTP layer maps to proper responses.
 */

import type { EnvelopesPort } from "@/domain/ports/envelopes";
import type { PartiesPort } from "@/domain/ports/parties";
import type { ConsentsPort, ConsentType, ConsentRecord } from "@/domain/ports/consent";
import { asISOOpt } from "@lawprotect/shared-ts";
import { ensureEnvelopeAccess, ensurePartyInEnvelope } from "@/use-cases/shared/guards/consent.guard";
import type {
  TenantScoped, EnvelopeScoped, PartyScoped, WithActor, WithMetadata, WithExpiresAtInput,
} from "@/use-cases/shared/types/types";

export interface AddConsentInput
  extends TenantScoped, EnvelopeScoped, PartyScoped, WithActor, WithMetadata, WithExpiresAtInput {
  consentType: ConsentType;
}

export type AddConsentOutput = ConsentRecord;

export interface AddConsentContext {
  envelopes: EnvelopesPort;
  parties: PartiesPort;
  consents: ConsentsPort;
}

/**
 * Creates a consent for a party within an envelope.
 * @param input AddConsentInput
 * @param ctx   AddConsentContext
 */
export async function addConsent(
  input: AddConsentInput,
  ctx: AddConsentContext
): Promise<AddConsentOutput> {
  const { tenantId, envelopeId, partyId, consentType, metadata, expiresAt } = input;
  const { envelopes, parties, consents } = ctx;

  await ensureEnvelopeAccess(envelopes, tenantId, envelopeId);
  await ensurePartyInEnvelope(parties, envelopeId, partyId);

  return consents.create({
    tenantId,
    envelopeId,
    partyId,
    consentType,
    metadata,
    // Validate & brand to ISODateString
    expiresAt: asISOOpt(expiresAt),
  });
}

