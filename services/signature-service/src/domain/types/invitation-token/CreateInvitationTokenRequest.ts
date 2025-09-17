/**
 * @fileoverview CreateInvitationTokenRequest - Domain request type for creating invitation tokens
 * @summary Domain request interface for invitation token creation
 * @description Defines the structure for creating invitation tokens in the domain layer
 */

import { InvitationTokenId } from '../../value-objects/InvitationTokenId';
import { SignerId } from '../../value-objects/SignerId';
import { EnvelopeId } from '../../value-objects/EnvelopeId';

/**
 * Domain request interface for creating invitation tokens
 */
export interface CreateInvitationTokenDomainRequest {
  readonly id: InvitationTokenId;
  readonly token: string;
  readonly signerId: SignerId;
  readonly envelopeId: EnvelopeId;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly metadata?: {
    readonly ipAddress?: string;
    readonly userAgent?: string;
    readonly email?: string;
    readonly fullName?: string;
  };
}

