/**
 * @fileoverview Utility to build the public signing response DTO.
 * @description Produces the response shape consumed by the API after a document is signed.
 */

import { getDefaultSigningAlgorithm } from '@/domain/enums/SigningAlgorithmEnum';
import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SignerId } from '@/domain/value-objects/SignerId';
import { SignDocumentResult } from '@/domain/types/orchestrator';

export type SigningSummary = {
  id: string;
  sha256: string;
  timestamp: string;
};

/**
 * Builds the signing response DTO.
 * Falls back to the original envelope when the post-action envelope is undefined.
 *
 * @param responseEnvelope Envelope after completion check (optional).
 * @param originalEnvelope Envelope before completion check (fallback).
 * @param signature Signature metadata with timestamp and hash.
 * @param signerId Signer identifier.
 * @param envelopeId Envelope identifier.
 * @returns Response DTO matching the current public contract.
 */
export function buildSigningResponse(
  responseEnvelope: SignatureEnvelope | undefined | null,
  originalEnvelope: SignatureEnvelope,
  signature: SigningSummary,
  signerId: SignerId,
  envelopeId: EnvelopeId
): SignDocumentResult {
  return {
    message: 'Document signed successfully',
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
