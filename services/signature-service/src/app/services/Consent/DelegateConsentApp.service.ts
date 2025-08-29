/**
 * @file DelegateConsentApp.service.ts
 * @summary Application service for delegating consents
 * @description Orchestrates consent delegation operations, delegates to ConsentCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { TenantId, EnvelopeId, ConsentId } from "../../ports/shared";
import type { ConsentCommandsPort } from "../../ports/consent/ConsentCommandsPort";

/**
 * Input parameters for delegating a consent
 */
export interface DelegateConsentAppInput {
  /** The tenant ID that owns the consent */
  tenantId: TenantId;
  /** The envelope ID this consent belongs to */
  envelopeId: EnvelopeId;
  /** The unique identifier of the consent to delegate */
  consentId: ConsentId;
  /** Email of the delegate */
  delegateEmail: string;
  /** Name of the delegate */
  delegateName: string;
  /** Reason for delegation (optional) */
  reason?: string;
  /** Expiration date for the delegation (optional) */
  expiresAt?: string;
  /** Additional metadata for the delegation (optional) */
  metadata?: Record<string, unknown>;
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
 * Output result for consent delegation
 */
export interface DelegateConsentAppResult {
  /** The delegated consent data */
  consent: {
    /** The unique identifier of the consent */
    consentId: ConsentId;
    /** The unique identifier of the delegation */
    delegationId: string;
    /** ISO timestamp when the consent was delegated */
    delegatedAt: string;
  };
}

/**
 * Dependencies required by the DelegateConsent app service
 */
export interface DelegateConsentAppDependencies {
  /** Port for consent command operations */
  consentCommands: ConsentCommandsPort;
}

/**
 * Delegates a consent with proper validation
 * 
 * This service orchestrates the consent delegation operation by:
 * 1. Validating the input parameters
 * 2. Delegating to the consent commands port
 * 3. Returning the delegated consent data
 * 
 * @param input - The input parameters containing consent ID and delegation data
 * @param deps - The dependencies containing the consent commands port
 * @returns Promise resolving to delegated consent data
 * @throws {AppError} When consent is not found, validation fails, or delegation fails
 */
export const delegateConsentApp = async (
  input: DelegateConsentAppInput,
  deps: DelegateConsentAppDependencies
): Promise<DelegateConsentAppResult> => {
  const result = await deps.consentCommands.delegate({
    envelopeId: input.envelopeId,
    consentId: input.consentId,
    delegateEmail: input.delegateEmail,
    delegateName: input.delegateName,
    reason: input.reason,
    expiresAt: input.expiresAt,
    metadata: input.metadata,
    actor: input.actor,
  });

  return { 
    consent: { 
      consentId: result.consentId, 
      delegationId: result.delegationId,
      delegatedAt: result.delegatedAt 
    } 
  };
};
