/**
 * @fileoverview DownloadDocumentUseCase - Use case for downloading signed documents from envelopes
 * @summary Handles document download with access validation and URL generation
 * @description This use case manages the download of signed documents from signature envelopes,
 * including access validation (supports both owner and external access via invitation token),
 * URL generation with expiration, and delegation to the SignatureEnvelopeService. It ensures
 * proper authorization and maintains clear application boundaries for document access.
 */

import { EnvelopeDownloadService } from '@/services/envelopeDownload/EnvelopeDownloadService';
import { EnvelopeAccessService } from '@/services/envelopeAccess/EnvelopeAccessService';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { rethrow } from '@lawprotect/shared-ts';
import { DownloadDocumentInput, DownloadDocumentResult } from '@/domain/types/usecase/orchestrator/DownloadDocumentUseCase';
import { createDocumentDownloadedAudit } from '../utils/audit/envelopeAuditHelpers';

export class DownloadDocumentUseCase {
  constructor(
    private readonly envelopeDownloadService: EnvelopeDownloadService,
    private readonly envelopeAccessService: EnvelopeAccessService,
    private readonly auditEventService: AuditEventService
  ) {}

  /**
   * Downloads the latest signed document of an envelope with access validation
   * @param input - The download request containing envelope ID, user info, and security context
   * @returns Promise that resolves to download URL and expiration time
   * @throws NotFoundError when envelope is not found
   * @throws AccessDeniedError when user lacks permission to download the document
   * @throws BadRequestError when document is not available for download
   * @example
   * const result = await useCase.execute({
   *   envelopeId: EnvelopeId.fromString('envelope-123'),
   *   userId: 'user-456',
   *   expiresIn: 3600,
   *   securityContext: { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', country: 'US' }
   * });
   */
  async execute(input: DownloadDocumentInput): Promise<DownloadDocumentResult> {
    const { envelopeId, userId, invitationToken, expiresIn, securityContext } = input;

    try {
      // 1. Access validation
      if (userId) {
        await this.envelopeAccessService.validateEnvelopeAccess(envelopeId, userId);
      } else if (invitationToken) {
        await this.envelopeAccessService.validateExternalUserAccess(envelopeId, invitationToken);
      } else {
        throw new Error('Either userId or invitationToken must be provided');
      }

      // 2. Download logic
      const result = await this.envelopeDownloadService.downloadDocument(
        envelopeId,
        expiresIn
      );

      // 3. Audit recording
      await this.auditEventService.create(
        createDocumentDownloadedAudit(
          envelopeId.getValue(),
          userId || 'external-user',
          undefined, // userEmail not available in input
          securityContext ? {
            ipAddress: securityContext.ipAddress || '',
            userAgent: securityContext.userAgent || '',
            country: securityContext.country
          } : undefined
        )
      );

      return result;
    } catch (error) {
      rethrow(error);
    }
  }
}
