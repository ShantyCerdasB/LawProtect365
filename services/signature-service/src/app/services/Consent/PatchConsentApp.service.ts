/**
 * @file PatchConsentApp.service.ts
 * @summary Application service for patching consents
 * @description Orchestrates consent patching operations, delegates to ConsentCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { TenantId, EnvelopeId, ConsentId, ConsentStatus } from "../../ports/shared";
import type { ConsentCommandsPort } from "../../ports/consent/ConsentCommandsPort";

/**
 * Input parameters for patching a consent
 */
export interface PatchConsentAppInput {
  /** The tenant ID that owns the consent */
  tenantId: TenantId;
  /** The envelope ID this consent belongs to */
  envelopeId: EnvelopeId;
  /** The unique identifier of the consent to patch */
  consentId: ConsentId;
  /** The new status for the consent (optional) */
  status?: ConsentStatus;
  /** Additional metadata for the consent (optional) */
  metadata?: Record<string, unknown>;
  /** New expiration date for the consent (optional) */
  expiresAt?: string;
}

/**
 * Output result for consent patching
 */
export interface PatchConsentAppResult {
  /** The updated consent data */
  consent: {
    /** The unique identifier of the consent */
    consentId: ConsentId;
    /** ISO timestamp when the consent was last updated */
    updatedAt: string;
  };
}

/**
 * Dependencies required by the PatchConsent app service
 */
export interface PatchConsentAppDependencies {
  /** Port for consent command operations */
  consentCommands: ConsentCommandsPort;
}

/**
 * Patches a consent with proper validation
 * 
 * This service orchestrates the consent patching operation by:
 * 1. Validating the input parameters
 * 2. Delegating to the consent commands port
 * 3. Returning the updated consent data
 * 
 * @param input - The input parameters containing consent ID and patch data
 * @param deps - The dependencies containing the consent commands port
 * @returns Promise resolving to updated consent data
 * @throws {AppError} When consent is not found, validation fails, or update fails
 */
export const patchConsentApp = async (
  input: PatchConsentAppInput,
  deps: PatchConsentAppDependencies
): Promise<PatchConsentAppResult> => {
  const patch: Partial<{ status: ConsentStatus; metadata: Record<string, unknown>; expiresAt: string }> = {};
  
  if (input.status !== undefined) {
    patch.status = input.status;
  }
  
  if (input.metadata !== undefined) {
    patch.metadata = input.metadata;
  }
  
  if (input.expiresAt !== undefined) {
    patch.expiresAt = input.expiresAt;
  }

  const result = await deps.consentCommands.update(input.envelopeId, input.consentId, patch);

  return { 
    consent: { 
      consentId: result.consentId, 
      updatedAt: result.updatedAt 
    } 
  };
};
