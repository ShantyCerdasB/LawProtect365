/**
 * @fileoverview InvitationTokenMetadata - Interface for invitation token metadata
 * @summary Defines metadata structure for invitation tokens
 * @description This interface provides type-safe metadata specifications for invitation tokens,
 * including IP address, user agent, country, and other contextual information.
 */

import { NetworkSecurityContext } from '@lawprotect/shared-ts';

export interface InvitationTokenMetadata extends NetworkSecurityContext {
  email?: string;
  fullName?: string;
}
