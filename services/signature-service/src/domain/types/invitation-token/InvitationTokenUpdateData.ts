/**
 * @fileoverview InvitationTokenUpdateData - Interface for invitation token update operations
 * @summary Defines data structure for updating invitation token properties
 * @description This interface provides type-safe update specifications for invitation tokens,
 * including status changes, usage tracking, and metadata updates.
 */

import { InvitationTokenStatus } from '@prisma/client';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';

export interface InvitationTokenUpdateData extends NetworkSecurityContext {
  status?: InvitationTokenStatus;
  expiresAt?: Date;
  sentAt?: Date;
  lastSentAt?: Date;
  resendCount?: number;
  usedAt?: Date;
  usedBy?: string;
  revokedAt?: Date;
  revokedReason?: string;
}
