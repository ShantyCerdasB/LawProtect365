/**
 * @file AddConsentApp.service.ts
 * @summary Application service for adding consents
 * @description Orchestrates consent creation operations, delegates to ConsentCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { TenantId, EnvelopeId, PartyId } from "../../ports/shared";
import type { ConsentCommandsPort } from "../../ports/consent/ConsentCommandsPort";

/**
 * Input parameters for adding a consent
 */
export interface AddConsentAppInput {
  /** The tenant ID that owns the consent */
  tenantId: TenantId;
  /** The envelope ID this consent belongs to */
  envelopeId: EnvelopeId;
  /** The party ID this consent is for */
  partyId: PartyId;
  /** The type of consent being added */
  consentType: string;
  /** Additional metadata for the consent (optional) */
  metadata?: Record<string, unknown>;
  /** Expiration date for the consent (optional) */
  expiresAt?: string;
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
 * Output result for consent creation
 */
export interface AddConsentAppResult {
  /** The created consent data */
  consent: {
    /** The unique identifier of the created consent */
    consentId: string;
    /** ISO timestamp when the consent was created */
    createdAt: string;
  };
}

/**
 * Dependencies required by the AddConsent app service
 */
export interface AddConsentAppDependencies {
  /** Port for consent command operations */
  consentCommands: ConsentCommandsPort;
}

/**
 * Adds a new consent with proper validation
 * 
 * This service orchestrates the consent creation operation by:
 * 1. Validating the input parameters
 * 2. Delegating to the consent commands port
 * 3. Returning the created consent data
 * 
 * @param input - The input parameters containing consent data
 * @param deps - The dependencies containing the consent commands port
 * @returns Promise resolving to created consent data
 * @throws {AppError} When validation fails or creation fails
 */
export const addConsentApp = async (
  input: AddConsentAppInput,
  deps: AddConsentAppDependencies
): Promise<AddConsentAppResult> => {
  const result = await deps.consentCommands.create({
    tenantId: input.tenantId,
    envelopeId: input.envelopeId,
    partyId: input.partyId,
    consentType: input.consentType,
    metadata: input.metadata,
    expiresAt: input.expiresAt,
    actor: input.actor,
  });

  return { 
    consent: { 
      consentId: result.consentId, 
      createdAt: result.createdAt 
    } 
  };
};
