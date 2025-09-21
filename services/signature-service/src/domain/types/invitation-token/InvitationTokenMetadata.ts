/**
 * @fileoverview InvitationTokenMetadata - Interface for invitation token metadata
 * @summary Defines metadata structure for invitation tokens
 * @description This interface provides type-safe metadata specifications for invitation tokens,
 * including IP address, user agent, country, and other contextual information.
 */

export interface InvitationTokenMetadata {
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  email?: string;
  fullName?: string;
}
