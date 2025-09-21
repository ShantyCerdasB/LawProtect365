/**
 * @fileoverview InvitationTokenSpec - Interface for invitation token query specifications
 * @summary Defines query criteria for invitation token searches
 * @description This interface provides type-safe query specifications for filtering
 * invitation tokens by various criteria including envelope, signer, status, and usage.
 */

import { InvitationTokenStatus } from '@prisma/client';

export interface InvitationTokenSpec {
  envelopeId?: string;
  signerId?: string;
  status?: InvitationTokenStatus;
  tokenHash?: string;
  createdBy?: string;
  usedBy?: string;
  isExpired?: boolean;
  isActive?: boolean;
  isUsed?: boolean;
  isRevoked?: boolean;
  canBeResent?: boolean;
  expiresBefore?: Date;
  expiresAfter?: Date;
  usedBefore?: Date;
  usedAfter?: Date;
  createdBefore?: Date;
  createdAfter?: Date;
}
