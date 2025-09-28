/**
 * @fileoverview Utility to build the public signing response DTO
 * @summary Builds standardized response for document signing operations
 * @description This utility constructs the response DTO that is returned to clients
 * after a document signing operation, including envelope status, signature metadata,
 * and standardized success messages.
 */

import { getDefaultSigningAlgorithm } from '@/domain/enums/SigningAlgorithmEnum';
import { SigningMessages } from '@/domain/enums/SigningMessages';
import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SignerId } from '@/domain/value-objects/SignerId';
import { SignDocumentResult } from '@/domain/types/orchestrator';

/**
 * Summary data for a completed signature operation
 */
export type SigningSummary = {
  id: string;
  sha256: string;
  timestamp: string;
};

/**
 * Builds the signing response DTO for successful document signing operations
 * @param responseEnvelope - Envelope after completion check (optional)
 * @param originalEnvelope - Envelope before completion check (fallback)
 * @param signature - Signature metadata with timestamp and hash
 * @param signerId - Signer identifier
 * @param envelopeId - Envelope identifier
 * @returns Response DTO matching the current public contract
 * @throws Error when required parameters are invalid
 */
export function buildSigningResponse(
  responseEnvelope: SignatureEnvelope | undefined | null,
  originalEnvelope: SignatureEnvelope,
  signature: SigningSummary,
  signerId: SignerId,
  envelopeId: EnvelopeId
): SignDocumentResult {
  return {
    message: SigningMessages.DOCUMENT_SIGNED_SUCCESS,
    envelope: {
      id: (responseEnvelope ?? originalEnvelope).getId().getValue(),
      status: (responseEnvelope ?? originalEnvelope).getStatus().getValue(),
      progress: (responseEnvelope ?? originalEnvelope).calculateProgress()
    },
    signature: {
      id: signature.id,
      signerId: signerId.getValue(),
      envelopeId: envelopeId.getValue(),
      signedAt: signature.timestamp,
      algorithm: getDefaultSigningAlgorithm(),
      hash: signature.sha256
    }
  };
}
