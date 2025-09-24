/**
 * @fileoverview DeclineSignerData - Interface for declining signer
 * @summary Defines data structure for signer decline operations
 * @description This interface provides type-safe specifications for signer decline,
 * including reason and authentication information.
 */

import { SignerId } from '../../value-objects/SignerId';

export interface DeclineSignerData {
  signerId: SignerId;
  reason: string;
  userId?: string; // Optional for external users
  invitationToken?: string;
  // Security context for audit tracking
  ipAddress?: string;
  userAgent?: string;
  country?: string;
}
