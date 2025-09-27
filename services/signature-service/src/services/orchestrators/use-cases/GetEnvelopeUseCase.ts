/**
 * @fileoverview GetEnvelopeUseCase - Use case for retrieving single envelopes with access validation
 * @summary Handles envelope retrieval with access validation and audit tracking
 * @description This use case manages the retrieval of individual signature envelopes,
 * including access validation (supports both owner and external access via invitation token),
 * invitation token tracking, signer data fetching, and access type determination. It ensures
 * proper authorization and maintains audit trails for envelope access operations.
 */

import { SignatureEnvelopeService } from '@/services/SignatureEnvelopeService';
import { InvitationTokenService } from '@/services/InvitationTokenService';
import { AccessType } from '@/domain/enums/AccessType';
import { rethrow } from '@lawprotect/shared-ts';
import { GetEnvelopeInput, GetEnvelopeResult } from '@/domain/types/usecase/orchestrator/GetEnvelopeUseCase';

export class GetEnvelopeUseCase {
  constructor(
    private readonly signatureEnvelopeService: SignatureEnvelopeService,
    private readonly invitationTokenService: InvitationTokenService
  ) {}

  /**
   * Retrieves an envelope with access validation and audit tracking
   * @param input - The envelope request containing envelope ID, user info, and security context
   * @returns Promise that resolves to the envelope with signers and access type
   * @throws NotFoundError when envelope is not found
   * @throws AccessDeniedError when user lacks permission to access the envelope
   * @throws BadRequestError when invitation token is invalid
   * @example
   * const result = await useCase.execute({
   *   envelopeId: EnvelopeId.fromString('envelope-123'),
   *   userId: 'user-456',
   *   invitationToken: 'token-789',
   *   securityContext: { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', country: 'US' }
   * });
   */
  async execute(input: GetEnvelopeInput): Promise<GetEnvelopeResult> {
    const { envelopeId, userId, invitationToken, securityContext } = input;

    try {
      // 1) Validate access (owner or external)
      const envelope = await this.signatureEnvelopeService.validateUserAccess(
        envelopeId,
        userId,
        invitationToken
      );

      // 2) Best-effort: mark invitation token as viewed for external access
      if (invitationToken && securityContext) {
        await this.invitationTokenService
          .markTokenAsViewed(invitationToken, {
            ipAddress: securityContext.ipAddress,
            userAgent: securityContext.userAgent,
            country: securityContext.country
          })
          .catch(() => undefined); 
      }

      // 3) Access type
      const accessType = invitationToken ? AccessType.EXTERNAL : AccessType.OWNER;

      // 4) Always fetch full signer roster
      const envelopeWithSigners = await this.signatureEnvelopeService.getEnvelopeWithSigners(
        envelopeId,
        securityContext
          ? {
              ipAddress: securityContext.ipAddress ?? '',
              userAgent: securityContext.userAgent ?? '',
              country: securityContext.country
            }
          : undefined,
        invitationToken
      );

      const signers = envelopeWithSigners?.getSigners() ?? [];

      return { envelope, signers, accessType };
    } catch (error) {
      rethrow(error);
    }
  }
}
