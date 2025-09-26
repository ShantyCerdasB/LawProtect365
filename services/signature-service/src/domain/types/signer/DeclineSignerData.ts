/**
 * @fileoverview DeclineSignerData - Interface for declining signer
 * @summary Defines data structure for signer decline operations
 * @description This interface provides type-safe specifications for signer decline,
 * including reason and authentication information.
 */

import { SignerId } from '../../value-objects/SignerId';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';

export interface DeclineSignerData extends NetworkSecurityContext {
  signerId: SignerId;
  reason: string;
  userId?: string; // Optional for external users
  invitationToken?: string;
}
