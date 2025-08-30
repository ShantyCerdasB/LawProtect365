/**
 * @file RequestSignatureApp.service.ts
 * @summary Application service for requesting signatures.
 * @description Orchestrates signature request operations, delegates to RequestsCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { EnvelopeId, PartyId } from "@/app/ports/shared";
import type { RequestsCommandsPort } from "@/app/ports/requests/RequestsCommandsPort";
import { ActorContext } from "@/app/ports/shared";
import { OtpChannel } from "@/domain/values/enums";

/**
 * @description Input parameters for requesting a signature.
 */
export interface RequestSignatureAppInput {
  /** The envelope ID to request signature for */
  envelopeId: EnvelopeId;
  /** The party ID to request signature from */
  partyId: PartyId;
  /** Optional custom message for the signature request */
  message?: string;
  /** Optional channel for sending the request (email, sms) */
  channel?: OtpChannel;
  /** Optional actor context for audit purposes */
  actor?: ActorContext;
}

/**
 * @description Output result for signature request.
 */
export interface RequestSignatureAppResult {
  /** The party ID that was requested to sign */
  partyId: PartyId;
  /** The signing URL generated for the party */
  signingUrl: string;
  /** When the signing URL expires */
  expiresAt: string;
  /** Whether the envelope status was changed to 'sent' */
  statusChanged: boolean;
}

/**
 * @description Dependencies required by the RequestSignatureApp service.
 */
export interface RequestSignatureAppDependencies {
  /** Requests commands port for signature request operations */
  requestsCommands: RequestsCommandsPort;
}

/**
 * @description Requests a signature from a specific party with proper validation and event emission.
 * 
 * @param {RequestSignatureAppInput} input - The input parameters containing signature request data
 * @param {RequestSignatureAppDependencies} deps - The dependencies containing the requests commands port
 * @returns {Promise<RequestSignatureAppResult>} Promise resolving to signature request result
 * @throws {AppError} When validation fails or signature request fails
 */
export const requestSignatureApp = async (
  input: RequestSignatureAppInput,
  deps: RequestSignatureAppDependencies
): Promise<RequestSignatureAppResult> => {
  const result = await deps.requestsCommands.requestSignature({
    envelopeId: input.envelopeId,
    partyId: input.partyId,
    message: input.message,
    channel: input.channel,
    actor: input.actor,
  });

  return {
    partyId: result.partyId,
    signingUrl: result.signingUrl,
    expiresAt: result.expiresAt,
    statusChanged: result.statusChanged,
  };
};
