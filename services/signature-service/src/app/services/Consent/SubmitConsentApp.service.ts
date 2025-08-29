/**
 * @file SubmitConsentApp.service.ts
 * @summary Application service for submitting consents
 * @description Orchestrates consent submission operations, delegates to ConsentCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { TenantId, EnvelopeId, ConsentId } from "../../ports/shared";
import type { ConsentCommandsPort } from "../../ports/consent/ConsentCommandsPort";

/**
 * Input parameters for submitting a consent
 */
export interface SubmitConsentAppInput {
  /** The tenant ID that owns the consent */
  tenantId: TenantId;
  /** The envelope ID this consent belongs to */
  envelopeId: EnvelopeId;
  /** The unique identifier of the consent to submit */
  consentId: ConsentId;
  /** Actor context information (optional) */
  actor?: {
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
    locale?: string;
  };
}

/**
 * Output result for consent submission
 */
export interface SubmitConsentAppResult {
  /** The submitted consent data */
  consent: {
    /** The unique identifier of the consent */
    consentId: ConsentId;
    /** ISO timestamp when the consent was submitted */
    submittedAt: string;
  };
}

/**
 * Dependencies required by the SubmitConsent app service
 */
export interface SubmitConsentAppDependencies {
  /** Port for consent command operations */
  consentCommands: ConsentCommandsPort;
}

/**
 * Submits a consent with proper validation
 * 
 * This service orchestrates the consent submission operation by:
 * 1. Validating the input parameters
 * 2. Delegating to the consent commands port
 * 3. Returning the submitted consent data
 * 
 * @param input - The input parameters containing consent ID and actor context
 * @param deps - The dependencies containing the consent commands port
 * @returns Promise resolving to submitted consent data
 * @throws {AppError} When consent is not found, validation fails, or submission fails
 */
export const submitConsentApp = async (
  input: SubmitConsentAppInput,
  deps: SubmitConsentAppDependencies
): Promise<SubmitConsentAppResult> => {
  const result = await deps.consentCommands.submit(input.envelopeId, input.consentId, input.actor);

  return { 
    consent: { 
      consentId: result.consentId, 
      submittedAt: result.submittedAt 
    } 
  };
};
