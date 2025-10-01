/**
 * @fileoverview EnvelopeAccessValidationRule - Business rules for envelope access validation
 * @summary Validates user access to envelopes including external users with invitation tokens
 * @description This domain rule encapsulates business logic for validating user access to envelopes,
 * including owner access, external user access via invitation tokens, and proper error handling.
 */

import { SignatureEnvelope } from '../entities/SignatureEnvelope';
import { InvitationToken } from '../entities/InvitationToken';
import { 
  envelopeAccessDenied,
  envelopeNotFound
} from '../../signature-errors';

/**
 * Domain rule for envelope access validation
 */
export class EnvelopeAccessValidationRule {
  
  /**
   * Validates if a user has access to an envelope
   * @param envelope - The envelope to validate access for
   * @param userId - The user ID requesting access
   * @param invitationToken - Optional invitation token for external users
   * @returns The envelope if access is valid
   * @throws EnvelopeAccessDenied if user doesn't have access
   * @throws EnvelopeNotFound if envelope doesn't exist
   */
  static validateEnvelopeAccess(
    envelope: SignatureEnvelope | null,
    userId: string,
    invitationToken?: InvitationToken
  ): SignatureEnvelope {
    if (!envelope) {
      throw envelopeNotFound('Envelope not found');
    }

    if (envelope.getCreatedBy() === userId) {
      return envelope;
    }

    if (invitationToken) {
      this.validateExternalUserAccess(envelope, userId, invitationToken);
      return envelope;
    }

    throw envelopeAccessDenied(
      `User ${userId} does not have access to envelope ${envelope.getId().getValue()}. ` +
      'Either be the envelope owner or provide a valid invitation token.'
    );
  }

  /**
   * Validates external user access using invitation token
   * @param envelope - The envelope to validate access for
   * @param invitationToken - The invitation token
   * @throws EnvelopeAccessDenied if access is invalid
   */
  private static validateExternalUserAccess(
    envelope: SignatureEnvelope,
    _userId: string,
    invitationToken: InvitationToken
  ): void {
    if (invitationToken.getEnvelopeId().getValue() !== envelope.getId().getValue()) {
      throw envelopeAccessDenied(
        `Invitation token is not valid for envelope ${envelope.getId().getValue()}`
      );
    }

    if (invitationToken.isExpired()) {
      throw envelopeAccessDenied(
        `Invitation token for envelope ${envelope.getId().getValue()} has expired`
      );
    }

    if (invitationToken.isRevoked()) {
      throw envelopeAccessDenied(
        `Invitation token for envelope ${envelope.getId().getValue()} has been revoked`
      );
    }
  }

  /**
   * Validates if a user can modify an envelope
   * @param envelope - The envelope to validate
   * @param userId - The user ID requesting modification
   * @returns The envelope if modification is allowed
   * @throws EnvelopeAccessDenied if user cannot modify
   * @throws EnvelopeNotFound if envelope doesn't exist
   */
  static validateEnvelopeModificationAccess(
    envelope: SignatureEnvelope | null,
    userId: string
  ): SignatureEnvelope {
    if (!envelope) {
      throw envelopeNotFound('Envelope not found');
    }

    if (envelope.getCreatedBy() !== userId) {
      throw envelopeAccessDenied(
        `Only the envelope owner can modify envelope ${envelope.getId().getValue()}. ` +
        `User ${userId} is not the owner.`
      );
    }

    if (!envelope.canBeModified()) {
      throw envelopeAccessDenied(
        `Envelope ${envelope.getId().getValue()} cannot be modified in current state: ${envelope.getStatus().getValue()}`
      );
    }

    return envelope;
  }

  /**
   * Validates if a user can delete an envelope
   * @param envelope - The envelope to validate
   * @param userId - The user ID requesting deletion
   * @returns The envelope if deletion is allowed
   * @throws EnvelopeAccessDenied if user cannot delete
   * @throws EnvelopeNotFound if envelope doesn't exist
   */
  static validateEnvelopeDeletionAccess(
    envelope: SignatureEnvelope | null,
    userId: string
  ): SignatureEnvelope {
    if (!envelope) {
      throw envelopeNotFound('Envelope not found');
    }

    if (envelope.getCreatedBy() !== userId) {
      throw envelopeAccessDenied(
        `Only the envelope owner can delete envelope ${envelope.getId().getValue()}. ` +
        `User ${userId} is not the owner.`
      );
    }

    if (!envelope.canBeModified()) {
      throw envelopeAccessDenied(
        `Envelope ${envelope.getId().getValue()} cannot be deleted in current state: ${envelope.getStatus().getValue()}`
      );
    }

    return envelope;
  }
}