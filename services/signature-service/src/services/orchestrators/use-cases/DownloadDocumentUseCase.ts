/**
 * @fileoverview Use case for downloading the latest signed document of an envelope.
 * @description Delegates to the SignatureEnvelopeService while keeping a clear application boundary.
 */

import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SignatureEnvelopeService } from '@/services/SignatureEnvelopeService';
import { NetworkSecurityContext, rethrow } from '@lawprotect/shared-ts';

export type DownloadDocumentInput = {
  envelopeId: EnvelopeId;
  userId?: string;
  invitationToken?: string;
  expiresIn?: number;
  securityContext?: NetworkSecurityContext;
};

export type DownloadDocumentResult = { downloadUrl: string; expiresIn: number };

export class DownloadDocumentUseCase {
  constructor(
    private readonly signatureEnvelopeService: SignatureEnvelopeService
  ) {}

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
