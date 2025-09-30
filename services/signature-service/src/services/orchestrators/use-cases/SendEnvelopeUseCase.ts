/**
 * @fileoverview SendEnvelopeUseCase - Use case for sending envelopes to external signers
 * @summary Handles envelope sending with token generation and notifications
 * @description This use case manages the sending of signature envelopes to external signers,
 * including envelope status transition, signer selection, invitation token generation,
 * notification dispatch, and audit event creation. It ensures proper workflow orchestration
 * and maintains comprehensive tracking for envelope distribution operations.
 */

import { EnvelopeStateService } from '@/services/envelopeStates/EnvelopeStateService';
import { InvitationTokenService } from '@/services/invitationTokenService';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { EnvelopeNotificationService } from '@/services/notification/EnvelopeNotificationService';
import { createNetworkSecurityContext, rethrow } from '@lawprotect/shared-ts';
import { selectTargetSigners } from '@/services/orchestrators/utils/signerSelection';
import { SendEnvelopeInput, SendEnvelopeResult } from '@/domain/types/usecase/orchestrator/SendEnvelopeUseCase';
import { EnvelopeSigner } from '@/domain';

export class SendEnvelopeUseCase {
  constructor(
    private readonly envelopeStateService: EnvelopeStateService,
    private readonly invitationTokenService: InvitationTokenService,
    private readonly signatureAuditEventService: AuditEventService,
    private readonly envelopeNotificationService: EnvelopeNotificationService
  ) {}

  /**
   * Sends an envelope to external signers with token generation and notifications
   * @param input - The send request containing envelope ID, user info, and options
   * @returns Promise that resolves to the send operation result with token information
   * @throws NotFoundError when envelope is not found
   * @throws BadRequestError when envelope cannot be sent
   * @throws AccessDeniedError when user lacks permission to send the envelope
   * @example
   * const result = await useCase.execute({
   *   envelopeId: EnvelopeId.fromString('envelope-123'),
   *   userId: 'user-456',
   *   securityContext: { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', country: 'US' },
   *   options: { message: 'Please sign this document', sendToAll: true }
   * });
   */
  async execute(input: SendEnvelopeInput): Promise<SendEnvelopeResult> {
    const { envelopeId, userId, securityContext, options } = input;

    try {
      const envelope = await this.envelopeStateService.sendEnvelope(envelopeId, userId);

      const externalSigners = envelope.getExternalSigners();
      const targetSigners: EnvelopeSigner[] = selectTargetSigners(externalSigners, options);

      const tokenResults = await this.invitationTokenService.generateInvitationTokensForSigners(
        targetSigners,
        envelopeId,
        {
          userId,
          ipAddress: securityContext.ipAddress ?? '',
          userAgent: securityContext.userAgent ?? '',
          country: securityContext.country
        }
      );

      const tokensMap = new Map<string, string | undefined>(
        tokenResults.map(t => [t.signerId, t.token])
      );

      await this.envelopeNotificationService.sendSignerInvitations(
        envelope,
        targetSigners,
        tokensMap,
        options?.message
      );

      await this.signatureAuditEventService.create({
        envelopeId: envelopeId.getValue(),
        signerId: undefined,
        eventType: 'ENVELOPE_SENT' as any,
        description: `Envelope sent to ${targetSigners.length} external signers`,
        userId,
        userEmail: undefined,
        networkContext: createNetworkSecurityContext(
          securityContext.ipAddress,
          securityContext.userAgent,
          securityContext.country
        ),
        metadata: {
          envelopeId: envelopeId.getValue(),
          externalSignersCount: targetSigners.length,
          tokensGenerated: tokenResults.length,
          sendToAll: options?.sendToAll || false
        }
      });

      return {
        success: true,
        message: 'Envelope sent successfully',
        envelopeId: envelopeId.getValue(),
        status: envelope.getStatus().getValue(),
        tokensGenerated: tokenResults.length,
        signersNotified: targetSigners.length,
        tokens: tokenResults.map(t => ({
          signerId: t.signerId,
          email: t.email,
          token: t.token,
          expiresAt: t.expiresAt
        }))
      };
    } catch (error) {
      rethrow(error);
    }
  }
}
