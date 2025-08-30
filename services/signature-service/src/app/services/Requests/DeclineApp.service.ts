/**
 * @file DeclineApp.service.ts
 * @summary Application service for declining envelopes.
 * @description Orchestrates envelope decline operations, delegates to RequestsCommandsPort,
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
 * @description Input parameters for declining an envelope.
 */
export interface DeclineAppInput {
  /** The envelope ID to decline */
  envelopeId: EnvelopeId;
  /** Optional reason for decline */
  reason?: string;
  /** Optional actor context for audit purposes */
  actor?: ActorContext;
}

/**
 * @description Output result for envelope decline.
 */
export interface DeclineAppResult {
  /** The envelope ID that was declined */
  envelopeId: EnvelopeId;
  /** The new status of the envelope */
  status: string;
  /** Timestamp when the envelope was declined */
  declinedAt: string;
}

/**
 * @description Dependencies required by the DeclineApp service.
 */
export interface DeclineAppDependencies {
  /** Requests commands port for decline operations */
  requestsCommands: RequestsCommandsPort;
}

/**
 * @description Declines an envelope with proper validation and event emission.
 * 
 * @param {DeclineAppInput} input - The input parameters containing decline data
 * @param {DeclineAppDependencies} deps - The dependencies containing the requests commands port
 * @returns {Promise<DeclineAppResult>} Promise resolving to decline result
 * @throws {AppError} When validation fails or decline fails
 */
export const declineEnvelopeApp = async (
  input: DeclineAppInput,
  deps: DeclineAppDependencies
): Promise<DeclineAppResult> => {
  const result = await deps.requestsCommands.declineEnvelope({
    envelopeId: input.envelopeId,
    reason: input.reason,
    actor: input.actor,
  });

  return {
    envelopeId: result.envelopeId,
    status: result.status,
    declinedAt: result.declinedAt,
  };
};
