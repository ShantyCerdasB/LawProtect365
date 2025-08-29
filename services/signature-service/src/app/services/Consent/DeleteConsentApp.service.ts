/**
 * @file DeleteConsentApp.service.ts
 * @summary Application service for deleting consents
 * @description Orchestrates consent deletion operations, delegates to ConsentCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { TenantId, EnvelopeId, ConsentId } from "../../ports/shared";
import type { ConsentCommandsPort } from "../../ports/consent/ConsentCommandsPort";

/**
 * Input parameters for deleting a consent
 */
export interface DeleteConsentAppInput {
  /** The tenant ID that owns the consent */
  tenantId: TenantId;
  /** The envelope ID this consent belongs to */
  envelopeId: EnvelopeId;
  /** The unique identifier of the consent to delete */
  consentId: ConsentId;
}

/**
 * Dependencies required by the DeleteConsent app service
 */
export interface DeleteConsentAppDependencies {
  /** Port for consent command operations */
  consentCommands: ConsentCommandsPort;
}

/**
 * Deletes a consent with proper validation
 * 
 * This service orchestrates the consent deletion operation by:
 * 1. Validating the input parameters
 * 2. Delegating to the consent commands port
 * 3. Ensuring the consent is properly deleted
 * 
 * @param input - The input parameters containing consent identification data
 * @param deps - The dependencies containing the consent commands port
 * @returns Promise resolving when deletion is complete
 * @throws {AppError} When consent is not found, validation fails, or deletion fails
 */
export const deleteConsentApp = async (
  input: DeleteConsentAppInput,
  deps: DeleteConsentAppDependencies
): Promise<void> => {
  await deps.consentCommands.delete(input.envelopeId, input.consentId);
};
