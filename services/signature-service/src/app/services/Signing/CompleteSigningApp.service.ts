/**
 * @file CompleteSigningApp.service.ts
 * @summary Application service for signing completion
 * @description Orchestrates signing completion operations, delegates to SigningCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { SigningCommandsPort, CompleteSigningCommand } from "@/app/ports/signing/SigningCommandsPort";
import { HashAlgorithm, KmsAlgorithm } from "@/domain/values/enums";
import { badRequest } from "@/shared/errors";

/**
 * Input parameters for signing completion
 */
export interface CompleteSigningAppInput {
  envelopeId: string;
  signerId: string;
  digest: {
    alg: HashAlgorithm;
    value: string;
  };
  algorithm: KmsAlgorithm;
  keyId?: string;
  otpCode?: string;
  token: string;
  actor: {
    ip?: string;
    userAgent?: string;
    email?: string;
    userId?: string;
  };
}

/**
 * Output result for signing completion
 */
export interface CompleteSigningAppResult {
  completed: boolean;
  completedAt: string;
  signature: string;
  keyId: string;
  algorithm: string;
  event: any;
}

/**
 * Dependencies required by the CompleteSigning app service
 */
export interface CompleteSigningAppDependencies {
  signingCommands: SigningCommandsPort;
}

/**
 * Completes the signing process with proper validation
 * @param input - The input parameters containing signing completion data
 * @param deps - The dependencies containing the signing commands port
 * @returns Promise resolving to completion result
 * @throws {AppError} When validation fails or signing completion fails
 */
export const completeSigningApp = async (
  input: CompleteSigningAppInput,
  deps: CompleteSigningAppDependencies
): Promise<CompleteSigningAppResult> => {
  // Validate input parameters
  if (!input.envelopeId?.trim()) {
    throw badRequest("Envelope ID is required");
  }
  if (!input.signerId?.trim()) {
    throw badRequest("Signer ID is required");
  }
  if (!input.token?.trim()) {
    throw badRequest("Request token is required");
  }

  // Create command for the port
  const command: CompleteSigningCommand = {
    envelopeId: input.envelopeId,
    signerId: input.signerId,
    digest: input.digest,
    algorithm: input.algorithm,
    keyId: input.keyId,
    otpCode: input.otpCode,
    token: input.token,
    actor: input.actor,
  };

  // Delegate to the signing commands port
  const result = await deps.signingCommands.completeSigning(command);

  return {
    completed: result.completed,
    completedAt: result.completedAt,
    signature: result.signature,
    keyId: result.keyId,
    algorithm: result.algorithm,
    event: result.event,
  };
};
