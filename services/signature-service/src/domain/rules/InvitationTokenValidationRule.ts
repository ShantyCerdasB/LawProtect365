/**
 * @fileoverview InvitationTokenValidationRule - Domain rule for invitation token validations
 * @summary Encapsulates business validations for invitation token operations
 * @description This domain rule contains all business validations related to invitation tokens,
 * including token validation, access control, and security checks for external signer access.
 */

import { InvitationToken } from '../entities/InvitationToken';
import { EnvelopeSigner } from '../entities/EnvelopeSigner';
import { 
  invitationTokenInvalid,
  invitationTokenExpired,
  invitationTokenAlreadyUsed,
  invitationTokenRevoked,
  signerNotFound
} from '../../signature-errors';

/**
 * Domain rule for invitation token validations
 * 
 * Contains all business validations related to invitation tokens, including
 * token validation, access control, and security checks for external signer access.
 */
export class InvitationTokenValidationRule {
  /**
   * Validates that an invitation token is valid for use
   * @param token - The invitation token to validate
   * @throws invitationTokenInvalid if token is invalid
   * @throws invitationTokenExpired if token is expired
   * @throws invitationTokenAlreadyUsed if token has already been used
   * @throws invitationTokenRevoked if token has been revoked
   */
  static validateToken(token: InvitationToken): void {
    if (!token) {
      throw invitationTokenInvalid('Token is required');
    }

    // Check if token is expired
    if (token.isExpired()) {
      throw invitationTokenExpired({
        tokenId: token.getId().getValue(),
        expiresAt: token.getExpiresAt()?.toISOString()
      });
    }

    // Check if token has already been used
    if (token.isUsed()) {
      throw invitationTokenAlreadyUsed({
        tokenId: token.getId().getValue(),
        usedAt: token.getUsedAt()?.toISOString()
      });
    }

    // Check if token has been revoked
    if (token.isRevoked()) {
      throw invitationTokenRevoked({
        tokenId: token.getId().getValue(),
        revokedAt: token.getRevokedAt()?.toISOString(),
        revokedReason: token.getRevokedReason()
      });
    }
  }

  /**
   * Validates that a signer has access to use an invitation token
   * @param token - The invitation token
   * @param signer - The signer attempting to use the token
   * @throws signerNotFound if signer was not invited by the token creator
   * @throws signerNotFound if signer is not external
   */
  static validateSignerAccess(token: InvitationToken, signer: EnvelopeSigner): void {
    if (!signer) {
      throw signerNotFound('Signer is required for token validation');
    }

    // Validate that the signer was invited by the owner who created the token
    if (signer.getInvitedByUserId() !== token.getCreatedBy()) {
      throw signerNotFound(
        `Signer ${signer.getId().getValue()} was not invited by the token creator ${token.getCreatedBy()}`
      );
    }

    // Validate that the signer is external
    if (!signer.getIsExternal()) {
      throw signerNotFound(
        `Signer ${signer.getId().getValue()} is not external and cannot use invitation tokens`
      );
    }

    // Validate that the token belongs to this signer
    if (!token.getSignerId().equals(signer.getId())) {
      throw signerNotFound(
        `Token ${token.getId().getValue()} does not belong to signer ${signer.getId().getValue()}`
      );
    }
  }

  /**
   * Validates that a user can create invitation tokens for a signer
   * @param signer - The signer to create token for
   * @param creatorUserId - The user creating the token
   * @throws signerNotFound if user is not authorized to create tokens for this signer
   */
  static validateTokenCreation(signer: EnvelopeSigner, creatorUserId: string): void {
    if (!signer) {
      throw signerNotFound('Signer is required for token creation validation');
    }

    // Validate that the signer was invited by the creator
    if (signer.getInvitedByUserId() !== creatorUserId) {
      throw signerNotFound(
        `User ${creatorUserId} is not authorized to create tokens for signer ${signer.getId().getValue()}`
      );
    }

    // Validate that the signer is external
    if (!signer.getIsExternal()) {
      throw signerNotFound(
        `Cannot create invitation tokens for non-external signer ${signer.getId().getValue()}`
      );
    }
  }

  /**
   * Validates token expiration settings
   * @param expiresAt - The expiration date
   * @throws invitationTokenInvalid if expiration is invalid
   */
  static validateExpiration(expiresAt: Date): void {
    if (!expiresAt) {
      throw invitationTokenInvalid('Token expiration date is required');
    }

    const now = new Date();
    if (expiresAt <= now) {
      throw invitationTokenInvalid('Token expiration date must be in the future');
    }

    // Check if expiration is too far in the future (e.g., more than 1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (expiresAt > oneYearFromNow) {
      throw invitationTokenInvalid('Token expiration date cannot be more than 1 year in the future');
    }
  }
}
