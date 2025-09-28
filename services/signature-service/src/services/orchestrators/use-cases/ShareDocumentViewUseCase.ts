/**
 * @fileoverview ShareDocumentViewUseCase - Use case for sharing read-only document view with external viewers
 * @summary Handles document view sharing with viewer participant creation and token generation
 * @description This use case manages the sharing of read-only document views with external viewers,
 * including access validation, viewer participant creation, invitation token generation,
 * notification dispatch, and comprehensive audit tracking. It ensures proper workflow
 * orchestration and maintains security for document view sharing operations.
 */

import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { EnvelopeCrudService } from '@/services/envelopeCrud/EnvelopeCrudService';
import { EnvelopeSignerService } from '@/services/EnvelopeSignerService';
import { InvitationTokenService } from '@/services/InvitationTokenService';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { EnvelopeNotificationService } from '@/services/notification/EnvelopeNotificationService';
import { EnvelopeAccessValidationRule } from '@/domain/rules/EnvelopeAccessValidationRule';
import { envelopeNotFound } from '@/signature-errors';
import { createNetworkSecurityContext, rethrow } from '@lawprotect/shared-ts';
import { ShareDocumentViewInput, ShareDocumentViewResult } from '@/domain/types/usecase/orchestrator/ShareDocumentViewUseCase';

export class ShareDocumentViewUseCase {
  constructor(
    private readonly envelopeCrudService: EnvelopeCrudService,
    private readonly envelopeSignerService: EnvelopeSignerService,
    private readonly invitationTokenService: InvitationTokenService,
    private readonly signatureAuditEventService: AuditEventService,
    private readonly envelopeNotificationService: EnvelopeNotificationService
  ) {}

  /**
   * Shares read-only document view with external viewer with token generation and notifications
   * @param input - The share request containing envelope ID, viewer info, and security context
   * @returns Promise that resolves to the share operation result with token information
   * @throws NotFoundError when envelope is not found
   * @throws AccessDeniedError when user lacks permission to share the document
   * @throws BadRequestError when viewer participant creation fails

   */
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
        await this.envelopeCrudService.getEnvelopeWithSigners(envelopeId);
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
        eventType: 'LINK_SHARED' as any,
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
