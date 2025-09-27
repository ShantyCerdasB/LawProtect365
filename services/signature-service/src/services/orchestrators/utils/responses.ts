import { getDefaultSigningAlgorithm } from '@/domain/enums/SigningAlgorithmEnum';
import { SignerId } from '@/domain/value-objects/SignerId';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';

/**
 * Builds the sign document response DTO.
 * @param responseEnvelope Envelope after completion check.
 * @param originalEnvelope Envelope before completion check.
 * @param signature Signature metadata with timestamp and hash.
 * @param signerId Signer identifier.
 * @param envelopeId Envelope identifier.
 * @returns Response DTO matching the current public contract.
 */
export function buildSigningResponse(
  responseEnvelope: any,
  originalEnvelope: any,
  signature: { id: string; sha256: string; timestamp: string },
  signerId: SignerId,
  envelopeId: EnvelopeId
) {
  return {
    message: 'Document signed successfully',
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
