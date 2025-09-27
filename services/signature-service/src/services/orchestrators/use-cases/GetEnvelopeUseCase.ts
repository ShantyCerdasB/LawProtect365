/**
 * @fileoverview Use case for retrieving a single envelope with access validation and audit tracking.
 * @description Validates access (owner or external via invitation token), marks the invitation token
 * as viewed (best-effort), fetches the envelope with full signer data, and returns the access type.
 */

import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { EnvelopeSigner } from '@/domain/entities/EnvelopeSigner';
import { AccessType } from '@/domain/enums/AccessType';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SignatureEnvelopeService } from '@/services/SignatureEnvelopeService';
import { InvitationTokenService } from '@/services/InvitationTokenService';
import { NetworkSecurityContext, rethrow } from '@lawprotect/shared-ts';

export type GetEnvelopeInput = {
  envelopeId: EnvelopeId;
  userId?: string;
  invitationToken?: string;
  securityContext?: NetworkSecurityContext;
};

export type GetEnvelopeResult = {
  envelope: SignatureEnvelope;
  signers: EnvelopeSigner[];
  accessType: AccessType;
};

export class GetEnvelopeUseCase {
  constructor(
    private readonly signatureEnvelopeService: SignatureEnvelopeService,
    private readonly invitationTokenService: InvitationTokenService
  ) {}

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
          .catch(() => undefined); // best-effort: ignore failures
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
