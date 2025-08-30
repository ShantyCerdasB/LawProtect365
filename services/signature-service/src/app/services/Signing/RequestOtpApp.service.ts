/**
 * @file RequestOtpApp.service.ts
 * @summary Application service for OTP request
 * @description Orchestrates OTP request operations, delegates to SigningCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { SigningCommandsPort, RequestOtpCommand } from "@/app/ports/signing/SigningCommandsPort";
import { badRequest } from "@/shared/errors";

/**
 * Input parameters for OTP request
 */
export interface RequestOtpAppInput {
  envelopeId: string;
  signerId: string;
  delivery: "sms" | "email";
  token: string;
  actor: {
    ip?: string;
    userAgent?: string;
    email?: string;
    userId?: string;
  };
}

/**
 * Output result for OTP request
 */
export interface RequestOtpAppResult {
  channel: "sms" | "email";
  expiresAt: string;
  cooldownSeconds: number;
  event: any;
}

/**
 * Dependencies required by the RequestOtp app service
 */
export interface RequestOtpAppDependencies {
  signingCommands: SigningCommandsPort;
}

/**
 * Requests an OTP code with proper validation
 * @param input - The input parameters containing OTP request data
 * @param deps - The dependencies containing the signing commands port
 * @returns Promise resolving to request result
 * @throws {AppError} When validation fails or OTP request fails
 */
export const requestOtpApp = async (
  input: RequestOtpAppInput,
  deps: RequestOtpAppDependencies
): Promise<RequestOtpAppResult> => {
  // Validate input parameters
  if (!input.envelopeId?.trim()) {
    throw badRequest("Envelope ID is required");
  }
  if (!input.signerId?.trim()) {
    throw badRequest("Signer ID is required");
  }
  if (!input.delivery || !["sms", "email"].includes(input.delivery)) {
    throw badRequest("Valid delivery channel (sms or email) is required");
  }
  if (!input.token?.trim()) {
    throw badRequest("Request token is required");
  }

  // Create command for the port
  const command: RequestOtpCommand = {
    envelopeId: input.envelopeId,
    signerId: input.signerId,
    delivery: input.delivery,
    token: input.token,
    actor: input.actor,
  };

  // Delegate to the signing commands port
  const result = await deps.signingCommands.requestOtp(command);

  return {
    channel: result.channel,
    expiresAt: result.expiresAt,
    cooldownSeconds: result.cooldownSeconds,
    event: result.event,
  };
};
