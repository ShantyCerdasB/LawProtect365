/**
 * @file consent.guard.ts
 * @summary Consent guard functions
 * @description Guard functions for consent-related operations and validations
 */

import type { EnvelopeId, TenantId } from "@/domain/value-objects/Ids";
import type { EnvelopesPort } from "@/app/ports/envelopes/EnvelopesQueriesPort";

/**
 * @summary Ensures envelope access for consent operations
 * @description Validates that the user has access to the envelope for consent operations
 *
 * @param {EnvelopesPort} envelopesRepo - Envelopes repository
 * @param {TenantId} tenantId - Tenant ID
 * @param {EnvelopeId} envelopeId - Envelope ID
 * @returns {Promise<void>} Promise that resolves when access is confirmed
 * @throws {Error} When access is denied
 */
export const ensureEnvelopeAccess = async (
  envelopesRepo: EnvelopesPort,
  tenantId: TenantId,
  envelopeId: EnvelopeId
): Promise<void> => {
  const envelope = await envelopesRepo.getById(envelopeId);
  if (!envelope) {
    throw new Error(`Envelope ${envelopeId} not found`);
  }
  
  if (envelope.tenantId !== tenantId) {
    throw new Error(`Access denied to envelope ${envelopeId}`);
  }
};
