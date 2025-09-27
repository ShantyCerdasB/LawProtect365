// services/orchestrators/ShareDocumentViewUseCase.ts
/**
 * @fileoverview Use case for sharing read-only document view with an external viewer.
 * @description Validates access, creates a viewer participant, generates a viewer token,
 * dispatches notification, writes an audit event, and returns a transport-friendly DTO.
 */

import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { SignatureEnvelopeService } from '@/services/SignatureEnvelopeService';
import { EnvelopeSignerService } from '@/services/EnvelopeSignerService';
import { InvitationTokenService } from '@/services/InvitationTokenService';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { EnvelopeNotificationService } from '@/services/events/EnvelopeNotificationService';
import { EnvelopeAccessValidationRule } from '@/domain/rules/EnvelopeAccessValidationRule';
import { envelopeNotFound } from '@/signature-errors';
import { createNetworkSecurityContext, NetworkSecurityContext, rethrow } from '@lawprotect/shared-ts';
import { Email } from '@/domain';

type ShareDocumentViewInput = {
  envelopeId: EnvelopeId;
  email: Email;
  fullName: string;
  message?: string;
  expiresInDays?: number;
  userId: string;
  securityContext: NetworkSecurityContext;
};

export type ShareDocumentViewResult = {
  success: boolean;
  message: string;
  envelopeId: string;
  viewerEmail: string;
  viewerName: string;
  token: string;
  expiresAt: Date;
  expiresInDays: number;
};

export class ShareDocumentViewUseCase {
  constructor(
    private readonly signatureEnvelopeService: SignatureEnvelopeService,
    private readonly envelopeSignerService: EnvelopeSignerService,
    private readonly invitationTokenService: InvitationTokenService,
    private readonly signatureAuditEventService: AuditEventService,
    private readonly envelopeNotificationService: EnvelopeNotificationService
  ) {}

  async execute(input: ShareDocumentViewInput): Promise<ShareDocumentViewResult> {
    const {
      envelopeId,
      email,
      fullName,
      message,
      userId,
      securityContext,
    } = input;
    const expiresInDays = input.expiresInDays ?? 7;

    try {
      const envelope: SignatureEnvelope | null =
        await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      EnvelopeAccessValidationRule.validateEnvelopeModificationAccess(envelope, userId);

      const viewer = await this.envelopeSignerService.createViewerParticipant(
        envelopeId,
        email.getValue(),
        fullName,
        userId
      );

      const tokenResult = await this.invitationTokenService.generateViewerInvitationToken(
        viewer.getId(),
        email.getValue(),
        fullName,
        envelopeId,
        {
          userId,
          ipAddress: securityContext.ipAddress ?? '',
          userAgent: securityContext.userAgent ?? '',
          country: securityContext.country 
        },
        expiresInDays
      );

      await this.envelopeNotificationService.sendViewerInvitation(
        envelope,
        email.getValue(),
        fullName,
        tokenResult.token,
        tokenResult.expiresAt,
        message
      );

      await this.signatureAuditEventService.create({
        envelopeId: envelopeId.getValue(),
        signerId: viewer.getId().getValue(),
        eventType: 'DOCUMENT_VIEW_SHARED' as any,
        description: `Document view access shared with ${fullName} (${email})`,
        userId,
        userEmail: undefined,
        networkContext: createNetworkSecurityContext(
          securityContext.ipAddress,
          securityContext.userAgent,
          securityContext.country
        ),
        metadata: {
          envelopeId: envelopeId.getValue(),
          viewerEmail: email,
          viewerName: fullName,
          tokenId: tokenResult.entity.getId().getValue(),
          expiresAt: tokenResult.expiresAt.toISOString(),
          expiresInDays
        }
      });

      return {
        success: true,
        message: `Document view access successfully shared with ${fullName}`,
        envelopeId: envelopeId.getValue(),
        viewerEmail: email.getValue(),
        viewerName: fullName,
        token: tokenResult.token,
        expiresAt: tokenResult.expiresAt,
        expiresInDays
      };
    } catch (error) {
      rethrow(error);
    }
  }
}
