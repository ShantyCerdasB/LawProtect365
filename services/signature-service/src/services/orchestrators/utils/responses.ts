/**
 * @fileoverview Response builders for signing operations
 * @summary Utilities for building standardized API responses
 * @description This module provides utilities for constructing standardized response DTOs
 * for signing operations, ensuring consistent message formatting and response structure
 * across the signature service API endpoints.
 */

import { getDefaultSigningAlgorithm } from '@/domain/enums/SigningAlgorithmEnum';
import { SigningMessages } from '@/domain/enums/SigningMessages';
import { SignerId } from '@/domain/value-objects/SignerId';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';

/**
 * Builds the sign document response DTO for successful document signing operations
 * @param responseEnvelope - Envelope after completion check (optional)
 * @param originalEnvelope - Envelope before completion check (fallback)
 * @param signature - Signature metadata with timestamp and hash
 * @param signerId - Signer identifier
 * @param envelopeId - Envelope identifier
 * @returns Response DTO matching the current public contract
 * @throws Error when required parameters are invalid
 */
export function buildSigningResponse(
  responseEnvelope: any,
  originalEnvelope: any,
  signature: { id: string; sha256: string; timestamp: string },
  signerId: SignerId,
  envelopeId: EnvelopeId
) {
  return {
    message: SigningMessages.DOCUMENT_SIGNED_SUCCESS,
    envelope: {
      id: responseEnvelope?.getId().getValue() || originalEnvelope.getId().getValue(),
      status: responseEnvelope?.getStatus().getValue() || originalEnvelope.getStatus().getValue(),
      progress: responseEnvelope?.calculateProgress() || originalEnvelope.calculateProgress()
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
