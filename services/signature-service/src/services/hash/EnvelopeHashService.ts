/**
 * @fileoverview EnvelopeHashService - Service for envelope hash operations
 * @summary Handles all hash-related operations for signature envelopes
 * @description Manages document hashes, signed document updates, and flattened key operations
 * for signature envelopes. Provides centralized hash management with audit logging.
 */

import { SignatureEnvelope,Hashes, AuditEventType ,EnvelopeId} from '@/domain';
import { createNetworkSecurityContext } from '@lawprotect/shared-ts';
import { envelopeUpdateFailed } from '@/signature-errors';
import type { SignatureEnvelopeRepository } from '@/repositories/SignatureEnvelopeRepository';
import type { AuditEventService } from '@/services/audit/AuditEventService';

export class EnvelopeHashService {
  constructor(
    private readonly signatureEnvelopeRepository: SignatureEnvelopeRepository,
    private readonly auditEventService: AuditEventService
  ) {}

  /**
   * Updates document hashes for an envelope
   * @param envelopeId - The unique identifier of the envelope
   * @param hashes - The hash values to update
   * @param userId - Optional user ID for audit logging
   * @returns Promise that resolves to the updated envelope
   * @throws EnvelopeUpdateFailedError when hash update fails
   */
  async updateHashes(envelopeId: EnvelopeId, hashes: Hashes, userId?: string): Promise<SignatureEnvelope> {
    try {
      const updatedEnvelope = await this.signatureEnvelopeRepository.updateHashes(envelopeId, hashes);

      if (userId) {
        await this.auditEventService.create({
          envelopeId: envelopeId.getValue(),
          signerId: undefined,
          eventType: AuditEventType.ENVELOPE_UPDATED,
          description: `Document hashes updated for envelope "${updatedEnvelope.getTitle()}"`,
          userId: userId,
          userEmail: undefined,
          networkContext: createNetworkSecurityContext(),
          metadata: {
            envelopeId: envelopeId.getValue(),
            hashes: hashes
          }
        });
      }

      return updatedEnvelope;
    } catch (error) {
      throw envelopeUpdateFailed(
        `Failed to update hashes for envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Updates the signed document information for an envelope
   * @param envelopeId - The unique identifier of the envelope
   * @param signedKey - The S3 key of the signed document
   * @param signedSha256 - The SHA256 hash of the signed document
   * @param signerId - The unique identifier of the signer
   * @param userId - The user ID for audit logging
   * @returns Promise that resolves to the updated envelope
   * @throws EnvelopeUpdateFailedError when signed document update fails
   */
  async updateSignedDocument(envelopeId: EnvelopeId, signedKey: string, signedSha256: string, signerId: string, userId: string): Promise<SignatureEnvelope> {
    try {
      const updatedEnvelope = await this.signatureEnvelopeRepository.updateSignedDocument(envelopeId, signedKey, signedSha256);

      await this.auditEventService.createSignerEvent({
        envelopeId: envelopeId.getValue(),
        signerId: signerId,
        eventType: AuditEventType.ENVELOPE_UPDATED,
        description: `Signed document updated for envelope "${updatedEnvelope.getTitle()}"`,
        userId: userId,
        metadata: {
          envelopeId: envelopeId.getValue(),
          signedKey: signedKey,
          signedSha256: signedSha256
        }
      });

      return updatedEnvelope;
    } catch (error) {
      throw envelopeUpdateFailed(
        `Failed to update signed document for envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Updates the flattened key for an envelope
   * @param envelopeId - The unique identifier of the envelope
   * @param flattenedKey - The flattened document key
   * @param userId - Optional user ID for audit logging
   * @returns Promise that resolves to the updated envelope
   * @throws EnvelopeUpdateFailedError when flattened key update fails
   */
  async updateFlattenedKey(
    envelopeId: EnvelopeId,
    flattenedKey: string,
    userId?: string
  ): Promise<SignatureEnvelope> {
    try {
      const updatedEnvelope = await this.signatureEnvelopeRepository.updateFlattenedKey(
        envelopeId,
        flattenedKey
      );

      if (userId) {
        await this.auditEventService.create({
          envelopeId: envelopeId.getValue(),
          signerId: undefined,
          eventType: AuditEventType.ENVELOPE_UPDATED,
          description: `Flattened key updated for envelope "${updatedEnvelope.getTitle()}"`,
          userId: userId,
          userEmail: undefined,
          networkContext: createNetworkSecurityContext(),
          metadata: {
            envelopeId: envelopeId.getValue(),
            flattenedKey: flattenedKey
          }
        });
      }

      return updatedEnvelope;
    } catch (error) {
      throw envelopeUpdateFailed(
        `Failed to update flattened key for envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }
}
