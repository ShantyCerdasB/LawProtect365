/**
 * @fileoverview UpdateInvitationTokenRequest - Domain request type for updating invitation tokens
 * @summary Domain request interface for invitation token updates
 * @description Defines the structure for updating invitation tokens in the domain layer
 */

/**
 * Domain request interface for updating invitation tokens
 */
export interface UpdateInvitationTokenDomainRequest {
  readonly usedAt?: Date;
  readonly metadata?: {
    readonly ipAddress?: string;
    readonly userAgent?: string;
    readonly email?: string;
    readonly fullName?: string;
  };
}

