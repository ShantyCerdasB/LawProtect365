/**
 * @file DeclineSigningApp.service.ts
 * @summary Application service for signing decline operations
 * @description Orchestrates the signing decline process, delegates to the SigningCommandsPort,
 * and handles validation and error mapping for the decline signing workflow.
 */

import type { SigningCommandsPort, DeclineSigningCommand } from "@/app/ports/signing/SigningCommandsPort";
import { badRequest } from "@/errors";

/**
 * Input parameters for signing decline
 */
export interface DeclineSigningAppInput {
  envelopeId: string;
  signerId: string;
  reason: string;
  token: string;
  actor: {
    ip?: string;
    userAgent?: string;
    email?: string;
    userId?: string;
  };
}

/**
 * Output result for signing decline
 */
export interface DeclineSigningAppResult {
  declined: boolean;
  declinedAt: string;
  reason: string;
  event: any;
}

/**
 * Dependencies for the decline signing app service
 */
export interface DeclineSigningAppDeps {
  signingCommands: SigningCommandsPort;
}

/**
 * Application service for declining a signing operation
 * 
 * This service orchestrates the decline signing process by:
 * 1. Validating input parameters
 * 2. Creating the command for the port
 * 3. Delegating to the signing commands port
 * 4. Returning the structured result
 * 
 * @param input - The decline signing input parameters
 * @param deps - Dependencies including the signing commands port
 * @returns Promise resolving to the decline result
 */
export const declineSigningApp = async (
  input: DeclineSigningAppInput,
  deps: DeclineSigningAppDeps
): Promise<DeclineSigningAppResult> => {
  // Basic input validation
  if (!input.envelopeId?.trim()) {
    throw badRequest("Envelope ID is required");
  }
  if (!input.signerId?.trim()) {
    throw badRequest("Signer ID is required");
  }
  if (!input.reason?.trim()) {
    throw badRequest("Decline reason is required");
  }
  if (!input.token?.trim()) {
    throw badRequest("Request token is required");
  }

  // Create command for the port
  const command: DeclineSigningCommand = {
    envelopeId: input.envelopeId,
    signerId: input.signerId,
    reason: input.reason,
    token: input.token,
    actor: input.actor,
  };

  // Delegate to the port
  const result = await deps.signingCommands.declineSigning(command);

  // Return structured result
  return {
    declined: result.declined,
    declinedAt: result.declinedAt,
    reason: result.reason,
    event: result.event,
  };
};
