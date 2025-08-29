/**
 * @file DeleteEnvelopeApp.service.ts
 * @summary Application service for deleting envelopes
 * @description Orchestrates envelope deletion operations, delegates to EnvelopesCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { TenantId, EnvelopeId } from "@/app/ports/shared";
import type { EnvelopesCommandsPort } from "@/app/ports/envelopes/EnvelopesCommandsPort";

/**
 * Input parameters for deleting an envelope
 */
export interface DeleteEnvelopeAppInput {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
}

/**
 * Dependencies required by the DeleteEnvelope app service
 */
export interface DeleteEnvelopeAppDependencies {
  envelopesCommands: EnvelopesCommandsPort;
}

/**
 * Deletes a draft envelope with proper validation
 * @param input - The input parameters containing envelope ID
 * @param deps - The dependencies containing the envelopes commands port
 * @returns Promise resolving when deletion is complete
 * @throws {AppError} When envelope is not found, not in draft status, or deletion fails
 */
export const deleteEnvelopeApp = async (
  input: DeleteEnvelopeAppInput,
  deps: DeleteEnvelopeAppDependencies
): Promise<void> => {
  await deps.envelopesCommands.delete(input.envelopeId);
};
