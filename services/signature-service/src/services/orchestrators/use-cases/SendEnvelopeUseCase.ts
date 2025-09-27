/**
 * @fileoverview Use case for sending an envelope to external signers.
 * @description Transitions the envelope to "sent", resolves target signers,
 * generates invitation tokens, dispatches notifications, and writes an audit event.
 */

import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { EnvelopeSigner } from '@/domain/entities/EnvelopeSigner';
import { SignatureEnvelopeService } from '@/services/SignatureEnvelopeService';
import { InvitationTokenService } from '@/services/InvitationTokenService';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { EnvelopeNotificationService } from '@/services/events/EnvelopeNotificationService';
import { createNetworkSecurityContext, NetworkSecurityContext, rethrow } from '@lawprotect/shared-ts';
import { selectTargetSigners } from '@/services/orchestrators/utils/signerSelection';

export type SendEnvelopeInput = {
  envelopeId: EnvelopeId;
  userId: string;
  securityContext: NetworkSecurityContext;
  options?: {
    message?: string;
    sendToAll?: boolean;
    signers?: Array<{ signerId: string; message?: string }>;
  };
};

export type SendEnvelopeTokenResult = {
  signerId: string;
  email?: string;
  token: string;
  expiresAt: Date;
};

export type SendEnvelopeResult = {
  success: boolean;
  message: string;
  envelopeId: string;
  status: string;
  tokensGenerated: number;
  signersNotified: number;
  tokens: SendEnvelopeTokenResult[];
};

export class SendEnvelopeUseCase {
  constructor(
    private readonly signatureEnvelopeService: SignatureEnvelopeService,
    private readonly invitationTokenService: InvitationTokenService,
    private readonly signatureAuditEventService: AuditEventService,
    private readonly envelopeNotificationService: EnvelopeNotificationService
  ) {}

  async execute(input: SendEnvelopeInput): Promise<SendEnvelopeResult> {
    const { envelopeId, userId, securityContext, options } = input;

    try {
      const envelope = await this.signatureEnvelopeService.sendEnvelope(envelopeId, userId);

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
