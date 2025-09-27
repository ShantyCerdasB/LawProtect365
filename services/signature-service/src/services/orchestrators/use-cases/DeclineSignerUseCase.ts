/**
 * @fileoverview DeclineSignerUseCase - Use case for declining signers in signature envelopes
 * @summary Handles signer decline operations with access validation and notifications
 * @description This use case manages the decline of signers in signature envelopes, including
 * access validation (supports both owner and external access via invitation token),
 * signer decline operations, envelope status updates, notification publishing, and
 * returning the updated envelope state. It ensures proper authorization and maintains
 * audit trails for decline operations.
 */

import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { SignatureEnvelopeService } from '@/services/SignatureEnvelopeService';
import { EnvelopeSignerService } from '@/services/EnvelopeSignerService';
import { EnvelopeNotificationService } from '@/services/events/EnvelopeNotificationService';
import { signerNotFound, envelopeNotFound } from '@/signature-errors';
import { rethrow } from '@lawprotect/shared-ts';
import { DeclineSignerInput, DeclineSignerResult } from '@/domain/types/usecase/orchestrator/DeclineSignerUseCase';

export class DeclineSignerUseCase {
  constructor(
    private readonly signatureEnvelopeService: SignatureEnvelopeService,
    private readonly envelopeSignerService: EnvelopeSignerService,
    private readonly envelopeNotificationService: EnvelopeNotificationService
  ) {}

  /**
   * Declines a signer in an envelope with proper validation and notifications
   * @param input - The decline request containing envelope ID, signer ID, reason, and security context
   * @returns Promise that resolves to the decline operation result with updated envelope state
   * @throws SignerNotFoundError when signer is not found in the envelope
   * @throws EnvelopeNotFoundError when envelope is not found after decline operation
   * @throws AccessDeniedError when user lacks permission to decline the signer
   * @example
   * const result = await useCase.execute({
   *   envelopeId: EnvelopeId.fromString('envelope-123'),
   *   signerId: SignerId.fromString('signer-456'),
   *   request: { reason: 'Not interested', invitationToken: 'token-789' },
   *   securityContext: { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', country: 'US' }
   * });
   */
  async execute(input: DeclineSignerInput): Promise<DeclineSignerResult> {
    const { envelopeId, signerId, request, securityContext } = input;

    try {
      // 1) Validate user access (owner or external via invitation token)
      const envelope: SignatureEnvelope = await this.signatureEnvelopeService.validateUserAccess(
        envelopeId,
        undefined,
        request.invitationToken
      );

      // 2) Resolve signer in the envelope
      const signer = envelope.getSigners().find(s => s.getId().getValue() === signerId.getValue());
      if (!signer) {
        throw signerNotFound(`Signer with ID ${signerId.getValue()} not found in envelope`);
      }

      // 3) Decline signer
      await this.envelopeSignerService.declineSigner({
        signerId,
        reason: request.reason,
        userId: undefined,
        invitationToken: request.invitationToken,
        ipAddress: securityContext.ipAddress,
        userAgent: securityContext.userAgent,
        country: securityContext.country
      });

      // Update envelope status after decline
      await this.signatureEnvelopeService.updateEnvelopeStatusAfterDecline(
        envelopeId,
        signerId,
        request.reason
      );

      // 4) Publish decline notification
      await this.envelopeNotificationService.publishSignerDeclined(
        envelope,
        signer,
        request.reason,
        securityContext
      );

      // 5) Load updated envelope for response
      const updated = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
      if (!updated) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found after decline`);
      }

      return {
        success: true,
        message: 'Signer declined successfully',
        envelope: {
          id: updated.getId().getValue(),
          status: updated.getStatus().getValue()
        },
        declineInfo: {
          signerId: signerId.getValue(),
          reason: request.reason,
          declinedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      rethrow(error);
    }
  }
}
