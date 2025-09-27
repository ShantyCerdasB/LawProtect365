/**
 * @fileoverview DownloadDocumentUseCase - Use case for downloading signed documents from envelopes
 * @summary Handles document download with access validation and URL generation
 * @description This use case manages the download of signed documents from signature envelopes,
 * including access validation (supports both owner and external access via invitation token),
 * URL generation with expiration, and delegation to the SignatureEnvelopeService. It ensures
 * proper authorization and maintains clear application boundaries for document access.
 */

import { SignatureEnvelopeService } from '@/services/SignatureEnvelopeService';
import { rethrow } from '@lawprotect/shared-ts';
import { DownloadDocumentInput, DownloadDocumentResult } from '@/domain/types/usecase/orchestrator/DownloadDocumentUseCase';

export class DownloadDocumentUseCase {
  constructor(
    private readonly signatureEnvelopeService: SignatureEnvelopeService
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
      return await this.signatureEnvelopeService.downloadDocument(
        envelopeId,
        userId,
        invitationToken,
        expiresIn,
        securityContext
      );
    } catch (error) {
      rethrow(error);
    }
  }
}
