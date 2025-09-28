/**
 * @fileoverview EnvelopeAccessService - Service for envelope access validation
 * @summary Handles all access validation operations for signature envelopes
 * @description Manages access validation for both authenticated and external users,
 * including invitation token validation and envelope access control.
 */

import { SignatureEnvelope } from '../../domain/entities/SignatureEnvelope';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';
import { envelopeNotFound, envelopeAccessDenied } from '../../signature-errors';

import type { SignatureEnvelopeRepository } from '../../repositories/SignatureEnvelopeRepository';
import type { InvitationTokenService } from '../InvitationTokenService';

export class EnvelopeAccessService {
  constructor(
    private readonly signatureEnvelopeRepository: SignatureEnvelopeRepository,
    private readonly invitationTokenService: InvitationTokenService
  ) {}

  /**
   * Validates user access to envelope (for authenticated users only)
   * @param envelopeId - The envelope ID
   * @param userId - The user ID
   * @returns The envelope if access is valid
   * @throws EnvelopeAccessDenied if user doesn't have access
   */
  async validateEnvelopeAccess(envelopeId: EnvelopeId, userId: string): Promise<SignatureEnvelope> {
    try {
      const envelope = await this.signatureEnvelopeRepository.findById(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      if (envelope.getCreatedBy() !== userId) {
        throw envelopeAccessDenied(`User ${userId} does not have access to envelope ${envelopeId.getValue()}`);
      }

      return envelope;
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('access') || 
        error.message.includes('not found') ||
        error.message.includes('Envelope with ID')
      )) {
        throw error;
      }
      throw envelopeAccessDenied(
        `Failed to validate access to envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Validates external user access to envelope using invitation token
   * @param envelopeId - The envelope ID
   * @param invitationToken - The invitation token
   * @returns The envelope if access is valid
   * @throws EnvelopeAccessDenied if user doesn't have access
   */
  async validateExternalUserAccess(envelopeId: EnvelopeId, invitationToken: string): Promise<SignatureEnvelope> {
    try {
      const token = await this.invitationTokenService.validateInvitationToken(invitationToken);
      
      if (token.getEnvelopeId().getValue() !== envelopeId.getValue()) {
        throw envelopeAccessDenied(`Invitation token is not valid for envelope ${envelopeId.getValue()}`);
      }

      const envelope = await this.signatureEnvelopeRepository.findById(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      return envelope;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as any).code;
        if (errorCode === 'INVITATION_TOKEN_INVALID' || 
            errorCode === 'INVITATION_TOKEN_EXPIRED' ||
            errorCode === 'INVITATION_TOKEN_ALREADY_USED' ||
            errorCode === 'INVITATION_TOKEN_REVOKED') {
          throw error;
        }
      }
      
      throw envelopeAccessDenied(
        `Failed to validate external user access to envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Validates user access to envelope (supports both authenticated and external users)
   * @param envelopeId - The envelope ID
   * @param userId - The user ID (for authenticated users)
   * @param invitationToken - The invitation token (for external users)
   * @returns The envelope if access is valid
   * @throws EnvelopeAccessDenied if user doesn't have access
   */
  async validateUserAccess(envelopeId: EnvelopeId, userId?: string, invitationToken?: string): Promise<SignatureEnvelope> {
    if (invitationToken) {
      return this.validateExternalUserAccess(envelopeId, invitationToken);
    } else if (userId) {
      return this.validateEnvelopeAccess(envelopeId, userId);
    } else {
      throw envelopeAccessDenied('Either userId or invitationToken must be provided for access validation');
    }
  }
}
