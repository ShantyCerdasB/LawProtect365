/**
 * @file CancelApp.service.ts
 * @summary Application service for canceling envelopes.
 * @description Orchestrates envelope cancellation operations, delegates to RequestsCommandsPort,
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
 * @description Input parameters for canceling an envelope.
 */
export interface CancelAppInput {
  /** The envelope ID to cancel */
  envelopeId: EnvelopeId;
  /** Optional reason for cancellation */
  reason?: string;
  /** Optional actor context for audit purposes */
  actor?: ActorContext;
}

/**
 * @description Output result for envelope cancellation.
 */
export interface CancelAppResult {
  /** The envelope ID that was canceled */
  envelopeId: EnvelopeId;
  /** The new status of the envelope */
  status: string;
  /** Timestamp when the envelope was canceled */
  canceledAt: string;
}

/**
 * @description Dependencies required by the CancelApp service.
 */
export interface CancelAppDependencies {
  /** Requests commands port for cancellation operations */
  requestsCommands: RequestsCommandsPort;
}

/**
 * @description Cancels an envelope with proper validation and event emission.
 * 
 * @param {CancelAppInput} input - The input parameters containing cancellation data
 * @param {CancelAppDependencies} deps - The dependencies containing the requests commands port
 * @returns {Promise<CancelAppResult>} Promise resolving to cancellation result
 * @throws {AppError} When validation fails or cancellation fails
 */
export const cancelEnvelopeApp = async (
  input: CancelAppInput,
  deps: CancelAppDependencies
): Promise<CancelAppResult> => {
  const result = await deps.requestsCommands.cancelEnvelope({
    envelopeId: input.envelopeId,
    reason: input.reason,
    actor: input.actor,
  });

  return {
    envelopeId: result.envelopeId,
    status: result.status,
    canceledAt: result.canceledAt,
  };
};
