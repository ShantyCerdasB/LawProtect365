/**
 * @file VerifyOtpApp.service.ts
 * @summary Application service for OTP verification
 * @description Orchestrates OTP verification operations, delegates to SigningCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { SigningCommandsPort, VerifyOtpCommand } from "@/app/ports/signing/SigningCommandsPort";
import { badRequest } from "@/shared/errors";

/**
 * Input parameters for OTP verification
 */
export interface VerifyOtpAppInput {
  envelopeId: string;
  signerId: string;
  code: string;
  token: string;
  actor: {
    ip?: string;
    userAgent?: string;
    email?: string;
    userId?: string;
  };
}

/**
 * Output result for OTP verification
 */
export interface VerifyOtpAppResult {
  verified: boolean;
  verifiedAt: string;
  event: any;
}

/**
 * Dependencies required by the VerifyOtp app service
 */
export interface VerifyOtpAppDependencies {
  signingCommands: SigningCommandsPort;
}

/**
 * Verifies an OTP code with proper validation
 * @param input - The input parameters containing OTP verification data
 * @param deps - The dependencies containing the signing commands port
 * @returns Promise resolving to verification result
 * @throws {AppError} When validation fails or OTP verification fails
 */
export const verifyOtpApp = async (
  input: VerifyOtpAppInput,
  deps: VerifyOtpAppDependencies
): Promise<VerifyOtpAppResult> => {
  // Validate input parameters
  if (!input.envelopeId?.trim()) {
    throw badRequest("Envelope ID is required");
  }
  if (!input.signerId?.trim()) {
    throw badRequest("Signer ID is required");
  }
  if (!input.code?.trim()) {
    throw badRequest("OTP code is required");
  }
  if (!input.token?.trim()) {
    throw badRequest("Request token is required");
  }

  // Create command for the port
  const command: VerifyOtpCommand = {
    envelopeId: input.envelopeId,
    signerId: input.signerId,
    code: input.code,
    token: input.token,
    actor: input.actor,
  };

  // Delegate to the signing commands port
  const result = await deps.signingCommands.verifyOtp(command);

  return {
    verified: result.verified,
    verifiedAt: result.verifiedAt,
    event: result.event,
  };
};
