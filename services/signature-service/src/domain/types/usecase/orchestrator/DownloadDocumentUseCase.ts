/**
 * @fileoverview DownloadDocumentUseCase Types - Input and result types for DownloadDocumentUseCase
 * @summary Type definitions for document download operations
 * @description This module contains the input and result type definitions for the
 * DownloadDocumentUseCase, including request parameters, response structure, and
 * download information for document download operations in signature envelopes.
 */

import { EnvelopeId } from '../../../value-objects/EnvelopeId';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';

/**
 * Input parameters for downloading a document from an envelope
 * @param envelopeId - The unique identifier of the envelope
 * @param userId - Optional user identifier for owner access
 * @param invitationToken - Optional invitation token for external access
 * @param expiresIn - Optional expiration time in seconds for the download URL
 * @param securityContext - Optional network security context for the request
 */
export interface DownloadDocumentInput {
  envelopeId: EnvelopeId;
  userId?: string;
  invitationToken?: string;
  expiresIn?: number;
  securityContext?: NetworkSecurityContext;
}

/**
 * Result structure for successful document download operation
 * @param downloadUrl - The signed URL for downloading the document
 * @param expiresIn - The expiration time in seconds for the download URL
 */
export interface DownloadDocumentResult {
  downloadUrl: string;
  expiresIn: number;
}
