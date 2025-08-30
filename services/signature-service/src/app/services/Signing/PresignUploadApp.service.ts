/**
 * @file PresignUploadApp.service.ts
 * @summary Application service for presign upload operations
 * @description Orchestrates the presign upload process, delegates to the SigningCommandsPort,
 * and handles validation and error mapping for the presign upload workflow.
 */

import type { SigningCommandsPort, PresignUploadCommand } from "@/app/ports/signing/SigningCommandsPort";
import { badRequest } from "@/errors";

/**
 * Input parameters for presign upload
 */
export interface PresignUploadAppInput {
  envelopeId: string;
  filename: string;
  contentType: string;
  token: string;
  actor: {
    ip?: string;
    userAgent?: string;
    email?: string;
    userId?: string;
  };
}

/**
 * Output result for presign upload
 */
export interface PresignUploadAppResult {
  uploadUrl: string;
  objectKey: string;
  expiresAt: string;
  event: any;
}

/**
 * Dependencies for the presign upload app service
 */
export interface PresignUploadAppDeps {
  signingCommands: SigningCommandsPort;
}

/**
 * Application service for creating a presigned URL for file upload
 * 
 * This service orchestrates the presign upload process by:
 * 1. Validating input parameters
 * 2. Creating the command for the port
 * 3. Delegating to the signing commands port
 * 4. Returning the structured result
 * 
 * @param input - The presign upload input parameters
 * @param deps - Dependencies including the signing commands port
 * @returns Promise resolving to the presign result
 */
export const presignUploadApp = async (
  input: PresignUploadAppInput,
  deps: PresignUploadAppDeps
): Promise<PresignUploadAppResult> => {
  // Basic input validation
  if (!input.envelopeId?.trim()) {
    throw badRequest("Envelope ID is required");
  }
  if (!input.filename?.trim()) {
    throw badRequest("Filename is required");
  }
  if (!input.contentType?.trim()) {
    throw badRequest("Content type is required");
  }
  if (!input.token?.trim()) {
    throw badRequest("Request token is required");
  }

  // Create command for the port
  const command: PresignUploadCommand = {
    envelopeId: input.envelopeId,
    filename: input.filename,
    contentType: input.contentType,
    token: input.token,
    actor: input.actor,
  };

  // Delegate to the port
  const result = await deps.signingCommands.presignUpload(command);

  // Return structured result
  return {
    uploadUrl: result.uploadUrl,
    objectKey: result.objectKey,
    expiresAt: result.expiresAt,
    event: result.event,
  };
};
