/**
 * @file guards.ts
 * @summary Reusable guards for use cases (multi-tenancy, state checks, lookups).
 */

import {
  envelopeNotFound,
  partyNotFound,
  inputNotFound,
  unprocessable,
} from "@/shared/errors";
import { SignatureErrorCodes } from "@/shared/errors/codes";
import type { ConsentState } from "@/domain/ports/consent/ConsentsPort";

/** Accept both spellings just in case data mixes them. */
export const isEnvelopeClosed = (status: string) =>
  status === "completed" || status === "canceled" || status === "cancelled";

/**
 * Ensures the envelope exists and belongs to the tenant boundary.
 * Returns the envelope with at least { envelopeId, tenantId, status }.
 */
export async function ensureEnvelopeAccess(
  envelopes: { getById(id: string): Promise<{ envelopeId: string; tenantId: string; status: string } | null> },
  tenantId: string,
  envelopeId: string
) {
  const env = await envelopes.getById(envelopeId);
  if (!env || env.tenantId !== tenantId) {
    throw envelopeNotFound({ tenantId, envelopeId });
  }
  return env;
}

/**
 * Throws when envelope is not mutable (completed / canceled).
 */
export function assertEnvelopeMutable(envStatus: string, envelopeId: string) {
  if (isEnvelopeClosed(envStatus)) {
    throw unprocessable(
      "Cannot update consents for envelope in completed or canceled status",
      SignatureErrorCodes.ENVELOPE_INVALID_STATE,
      { envelopeId }
    );
  }
}

/**
 * Ensures the party exists and belongs to the envelope.
 * Returns a minimal shape that includes partyId (needed by callers).
 */
export async function ensurePartyInEnvelope(
  parties: { getById(id: string): Promise<{ partyId: string; envelopeId: string } | null> },
  envelopeId: string,
  partyId: string
) {
  const p = await parties.getById(partyId);
  if (!p || p.envelopeId !== envelopeId) {
    throw partyNotFound({ envelopeId, partyId });
  }
  return p; // { partyId, envelopeId }
}

/**
 * Ensures the consent exists and belongs to the envelope.
 * Returns the full ConsentState so callers can read status/partyId/etc.
 */
export async function ensureConsentInEnvelope(
  consents: { getById(envelopeId: string, consentId: string): Promise<ConsentState | null> },
  envelopeId: string,
  consentId: string
): Promise<ConsentState> {
  const c = await consents.getById(envelopeId, consentId);
  if (!c || c.envelopeId !== envelopeId) {
    throw inputNotFound({ consentId, envelopeId });
  }
  return c; // ConsentState { consentId, envelopeId, partyId, consentType, status }
}
