/**
 * @fileoverview EnvelopeStateService - Manages envelope state transitions
 * @summary Service for handling envelope state changes (send, complete, decline)
 * @description This service encapsulates all envelope state management operations including sending envelopes, completing them, and handling decline scenarios with proper audit logging.
 */

import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SignerId } from '@/domain/value-objects/SignerId';
import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { SignatureEnvelopeRepository } from '@/repositories/SignatureEnvelopeRepository';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { AuditEventType } from '@/domain/enums/AuditEventType';
import { createNetworkSecurityContext } from '@lawprotect/shared-ts';
import { 
  envelopeNotFound, 
  envelopeAccessDenied, 
  invalidEnvelopeState, 
  envelopeUpdateFailed 
} from '@/signature-errors';

/**
 * Service for managing envelope state transitions
 * Handles sending, completing, and declining envelopes with proper validation and audit logging
 */
export class EnvelopeStateService {
  constructor(
    private readonly signatureEnvelopeRepository: SignatureEnvelopeRepository,
    private readonly auditEventService: AuditEventService
  ) {}

  /**
   * Sends an envelope by validating state and changing to READY_FOR_SIGNATURE
   * @param envelopeId - The envelope ID to send
   * @param userId - The user making the request
   * @returns Updated signature envelope
   */
  async sendEnvelope(envelopeId: EnvelopeId, userId: string): Promise<SignatureEnvelope> {
    try {
      // 1. Get envelope with signers
      const envelope = await this.signatureEnvelopeRepository.getWithSigners(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }
      
      // 2. Validate access (only the creator can send)
      if (envelope.getCreatedBy() !== userId) {
        throw envelopeAccessDenied('Only envelope owner can send envelope');
      }
      
      // 3. Validate state (not in final state)
      if (envelope.isInFinalState()) {
        throw invalidEnvelopeState('Cannot send envelope in final state');
      }
      
      // 4. Validate that has external signers
      if (!envelope.hasExternalSigners()) {
        throw invalidEnvelopeState('Envelope must have at least one external signer');
      }
      
      // 5. Validate that external signers have email and full name
      envelope.validateExternalSigners();
      
      // 6. Change status to READY_FOR_SIGNATURE (only if was in DRAFT)
      if (envelope.getStatus().isDraft()) {
        envelope.send(); // Changes to READY_FOR_SIGNATURE
        const updatedEnvelope = await this.signatureEnvelopeRepository.update(envelopeId, envelope);

        // Create audit event
        await this.auditEventService.create({
          envelopeId: envelopeId.getValue(),
          signerId: undefined,
          eventType: AuditEventType.ENVELOPE_SENT,
          description: `Envelope "${envelope.getTitle()}" sent for signature`,
          userId: userId,
          userEmail: undefined,
          networkContext: createNetworkSecurityContext(),
          metadata: {
            envelopeId: envelopeId.getValue(),
            title: envelope.getTitle(),
            sentAt: updatedEnvelope.getSentAt()?.toISOString(),
            signerCount: envelope.getSigners().length
          }
        });

        return updatedEnvelope;
      }

      return envelope;
    } catch (error) {
      throw envelopeUpdateFailed(
        `Failed to send envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Completes an envelope when all signers have signed
   * @param envelopeId - The envelope ID to complete
   * @param userId - The user making the request
   * @returns Updated signature envelope
   */
  async completeEnvelope(envelopeId: EnvelopeId, userId: string): Promise<SignatureEnvelope> {
    try {
      // Complete envelope using repository method (which uses entity method)
      const updatedEnvelope = await this.signatureEnvelopeRepository.completeEnvelope(envelopeId);

      // Create audit event
      await this.auditEventService.create({
        envelopeId: envelopeId.getValue(),
        signerId: undefined,
        eventType: AuditEventType.ENVELOPE_COMPLETED,
        description: `Envelope "${updatedEnvelope.getTitle()}" completed - all signers have signed`,
        userId: userId,
        userEmail: undefined,
        networkContext: createNetworkSecurityContext(),
        metadata: {
          envelopeId: envelopeId.getValue(),
          completedAt: updatedEnvelope.getCompletedAt()?.toISOString()
        }
      });

      return updatedEnvelope;
    } catch (error) {
      throw envelopeUpdateFailed(
        `Failed to complete envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Updates envelope status to DECLINED after a signer declines
   * @param envelopeId - The envelope ID
   * @param declinedBySignerId - ID of the signer who declined
   * @param declineReason - Reason for declining
   * @param userId - The user ID (required for audit)
   * @returns Updated envelope
   */
  async updateEnvelopeStatusAfterDecline(
    envelopeId: EnvelopeId,
    declinedBySignerId: SignerId,
    declineReason: string,
    userId: string
  ): Promise<SignatureEnvelope> {
    try {
      // Get envelope with signers
      const envelope = await this.getEnvelopeWithSigners(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      // Set decline-specific fields and update envelope status to DECLINED
      envelope.setDeclinedInfo(declinedBySignerId.getValue(), declineReason);

      // Update in repository
      const updatedEnvelope = await this.signatureEnvelopeRepository.update(envelopeId, envelope);

      // Create audit event (always create, no conditional)
      await this.auditEventService.create({
        envelopeId: envelopeId.getValue(),
        signerId: declinedBySignerId.getValue(),
        eventType: AuditEventType.ENVELOPE_DECLINED,
        description: `Envelope declined by signer ${declinedBySignerId.getValue()}`,
        userId: userId,
        userEmail: undefined,
        networkContext: createNetworkSecurityContext(),
        metadata: {
          envelopeId: envelopeId.getValue(),
          declinedBySignerId: declinedBySignerId.getValue(),
          declineReason: declineReason,
          declinedAt: updatedEnvelope.getDeclinedAt()?.toISOString()
        }
      });

      return updatedEnvelope;
    } catch (error) {
      throw envelopeUpdateFailed(
        `Failed to update envelope status after decline ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets an envelope with its signers for state operations
   * @param envelopeId - The envelope ID
   * @returns Envelope with signers or null if not found
   */
  private async getEnvelopeWithSigners(envelopeId: EnvelopeId): Promise<SignatureEnvelope | null> {
    try {
      return await this.signatureEnvelopeRepository.getWithSigners(envelopeId);
    } catch (error) {
      throw envelopeNotFound(
        `Failed to get envelope with signers ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }
}
