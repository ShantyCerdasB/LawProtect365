/**
 * @file PatchEnvelopeApp.service.ts
 * @summary Application service for patching envelopes
 * @description Orchestrates envelope patching operations, delegates to EnvelopesCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { TenantId, EnvelopeId } from "../../ports/shared";
import type { EnvelopesCommandsPort } from "../../ports/envelopes/EnvelopesCommandsPort";

/**
 * Input parameters for patching an envelope
 */
export interface PatchEnvelopeAppInput {
  /** The tenant ID that owns the envelope */
  tenantId: TenantId;
  /** The unique identifier of the envelope to patch */
  envelopeId: EnvelopeId;
  /** The new title for the envelope (optional) */
  title?: string;
  /** The new status for the envelope (optional) */
  status?: string;
}

/**
 * Output result for envelope patching
 */
export interface PatchEnvelopeAppResult {
  /** The updated envelope data */
  envelope: {
    /** The unique identifier of the envelope */
    envelopeId: EnvelopeId;
    /** ISO timestamp when the envelope was last updated */
    updatedAt: string;
  };
}

/**
 * Dependencies required by the PatchEnvelope app service
 */
export interface PatchEnvelopeAppDependencies {
  /** Port for envelope command operations */
  envelopesCommands: EnvelopesCommandsPort;
}

/**
 * Patches an envelope with proper validation
 * 
 * This service orchestrates the envelope patching operation by:
 * 1. Validating the input parameters
 * 2. Delegating to the envelopes commands port
 * 3. Returning the updated envelope data
 * 
 * @param input - The input parameters containing envelope ID and patch data
 * @param deps - The dependencies containing the envelopes commands port
 * @returns Promise resolving to updated envelope data
 * @throws {AppError} When envelope is not found, validation fails, or update fails
 */
export const patchEnvelopeApp = async (
  input: PatchEnvelopeAppInput,
  deps: PatchEnvelopeAppDependencies
): Promise<PatchEnvelopeAppResult> => {
  // Build the patch object with only defined values
  const patch: Partial<{ title: string; status: string }> = {};
  
  if (input.title !== undefined) {
    patch.title = input.title;
  }
  
  if (input.status !== undefined) {
    patch.status = input.status;
  }

  // Delegate to the commands port for the actual update
  const result = await deps.envelopesCommands.update(input.envelopeId, patch);

  return { 
    envelope: { 
      envelopeId: result.envelopeId, 
      updatedAt: result.updatedAt 
    } 
  };
};
