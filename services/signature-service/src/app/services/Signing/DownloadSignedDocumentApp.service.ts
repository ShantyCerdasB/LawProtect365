/**
 * @file DownloadSignedDocumentApp.service.ts
 * @summary Application service for download signed document operations
 * @description Orchestrates the download signed document process, delegates to the SigningCommandsPort,
 * and handles validation and error mapping for the download signed document workflow.
 */

import type { SigningCommandsPort, DownloadSignedDocumentCommand } from "@/app/ports/signing/SigningCommandsPort";
import { badRequest } from "@/shared/errors";

/**
 * Input parameters for download signed document
 */
export interface DownloadSignedDocumentAppInput {
  envelopeId: string;
  token: string;
  actor: {
    ip?: string;
    userAgent?: string;
    email?: string;
    userId?: string;
  };
}

/**
 * Output result for download signed document
 */
export interface DownloadSignedDocumentAppResult {
  downloadUrl: string;
  objectKey: string;
  expiresAt: string;
  event: any;
}

/**
 * Dependencies for the download signed document app service
 */
export interface DownloadSignedDocumentAppDeps {
  signingCommands: SigningCommandsPort;
}

/**
 * Application service for creating a presigned URL for downloading a signed document
 * 
 * This service orchestrates the download signed document process by:
 * 1. Validating input parameters
 * 2. Creating the command for the port
 * 3. Delegating to the signing commands port
 * 4. Returning the structured result
 * 
 * @param input - The download signed document input parameters
 * @param deps - Dependencies including the signing commands port
 * @returns Promise resolving to the download result
 */
export const downloadSignedDocumentApp = async (
  input: DownloadSignedDocumentAppInput,
  deps: DownloadSignedDocumentAppDeps
): Promise<DownloadSignedDocumentAppResult> => {
  // Basic input validation
  if (!input.envelopeId?.trim()) {
    throw badRequest("Envelope ID is required");
  }
  if (!input.token?.trim()) {
    throw badRequest("Request token is required");
  }

  // Create command for the port
  const command: DownloadSignedDocumentCommand = {
    envelopeId: input.envelopeId,
    token: input.token,
    actor: input.actor,
  };

  // Delegate to the port
  const result = await deps.signingCommands.downloadSignedDocument(command);

  // Return structured result
  return {
    downloadUrl: result.downloadUrl,
    objectKey: result.objectKey,
    expiresAt: result.expiresAt,
    event: result.event,
  };
};
