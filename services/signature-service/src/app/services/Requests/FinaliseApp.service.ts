/**
 * @file FinaliseApp.service.ts
 * @summary Application service for finalizing envelopes.
 * @description Orchestrates envelope finalization operations, delegates to RequestsCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { EnvelopeId } from "@/app/ports/shared";
import type { RequestsCommandsPort } from "@/app/ports/requests/RequestsCommandsPort";

/**
 * @description Actor context for audit and attribution purposes.
 */
export interface ActorContext {
  /** User identifier */
  userId?: string;
  /** User email address */
  email?: string;
  /** Client IP address */
  ip?: string;
  /** User agent string */
  userAgent?: string;
  /** User locale preference */
  locale?: string;
}

/**
 * @description Input parameters for finalizing an envelope.
 */
export interface FinaliseAppInput {
  /** The envelope ID to finalize */
  envelopeId: EnvelopeId;
  /** Optional message for finalization */
  message?: string;
  /** Optional actor context for audit purposes */
  actor?: ActorContext;
}

/**
 * @description Output result for envelope finalization.
 */
export interface FinaliseAppResult {
  /** The envelope ID that was finalized */
  envelopeId: EnvelopeId;
  /** Array of generated artifact IDs (certificates, PDFs, etc.) */
  artifactIds: string[];
  /** Timestamp when the envelope was finalized */
  finalizedAt: string;
}

/**
 * @description Dependencies required by the FinaliseApp service.
 */
export interface FinaliseAppDependencies {
  /** Requests commands port for finalization operations */
  requestsCommands: RequestsCommandsPort;
}

/**
 * @description Finalizes an envelope with proper validation and event emission.
 * 
 * @param {FinaliseAppInput} input - The input parameters containing finalization data
 * @param {FinaliseAppDependencies} deps - The dependencies containing the requests commands port
 * @returns {Promise<FinaliseAppResult>} Promise resolving to finalization result
 * @throws {AppError} When validation fails or finalization fails
 */
export const finaliseEnvelopeApp = async (
  input: FinaliseAppInput,
  deps: FinaliseAppDependencies
): Promise<FinaliseAppResult> => {
  const result = await deps.requestsCommands.finaliseEnvelope({
    envelopeId: input.envelopeId,
    message: input.message,
    actor: input.actor,
  });

  return {
    envelopeId: result.envelopeId,
    artifactIds: result.artifactIds,
    finalizedAt: result.finalizedAt,
  };
};
