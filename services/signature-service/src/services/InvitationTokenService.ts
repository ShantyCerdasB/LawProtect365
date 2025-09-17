/**
 * @fileoverview InvitationTokenService - Service for invitation token business logic
 * @summary Manages invitation token operations and coordinates with other services
 * @description This service handles all invitation token-related business logic, including
 * generation, validation, expiration management, and coordination with signers and events.
 */

import { InvitationToken } from '../domain/entities/InvitationToken';
import { InvitationTokenId } from '../domain/value-objects/InvitationTokenId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { Signer } from '../domain/entities/Signer';
import { InvitationTokenRepository } from '../repositories/InvitationTokenRepository';
import { SignerEventService } from './events/SignerEventService';
import { AuditService } from './AuditService';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { mapAwsError, randomToken } from '@lawprotect/shared-ts';
import { invitationTokenInvalid, invitationTokenExpired } from '../signature-errors';

/**
 * InvitationTokenService
 * 
 * Service for managing invitation token operations and coordinating with other services.
 * Handles token generation, validation, expiration, and event publishing.
 */
export class InvitationTokenService {
  constructor(
    private readonly invitationTokenRepository: InvitationTokenRepository,
    private readonly signerEventService: SignerEventService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Generates invitation tokens for multiple signers WITHOUT publishing events
   * Used during envelope creation - events will be published later when envelope is sent
   * 
   * @param signers - Array of signers to generate tokens for
   * @param envelopeId - The envelope ID
   * @param securityContext - Security context from middleware
   * @returns Array of created invitation tokens
   */
  async generateInvitationTokensForSigners(
    signers: Signer[],
    envelopeId: EnvelopeId,
    securityContext: {
      userId: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<InvitationToken[]> {
    try {
      const tokens: InvitationToken[] = [];
      
      for (const signer of signers) {
        // Generate secure token
        const token = this.generateSecureToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

        // Create invitation token entity
        const invitationToken = await this.invitationTokenRepository.create({
          id: new InvitationTokenId(token),
          token,
          signerId: signer.getId(),
          envelopeId,
          expiresAt,
          createdAt: new Date(),
          metadata: {
            ipAddress: securityContext.ipAddress,
            userAgent: securityContext.userAgent,
            email: signer.getEmail().getValue(),
            fullName: signer.getFullName()
          }
        });

        // Create audit event
        await this.auditService.createEvent({
          type: AuditEventType.SIGNER_INVITED,
          envelopeId: envelopeId.getValue(),
          signerId: signer.getId().getValue(),
          userId: securityContext.userId,
          description: `Invitation token generated for signer ${signer.getEmail().getValue()}`,
          metadata: {
            token: token,
            expiresAt: expiresAt.toISOString(),
            signerEmail: signer.getEmail().getValue(),
            signerName: signer.getFullName()
          }
        });

      // NOTE: Do NOT publish signer.invited event here
      // Events will be published by SendEnvelopeHandler when envelope is sent

        tokens.push(invitationToken);
      }

      return tokens;
    } catch (error) {
      throw mapAwsError(error, 'InvitationTokenService.generateInvitationTokensForSigners');
    }
  }

  /**
   * Validates an invitation token
   * 
   * @param token - The token to validate
   * @returns The invitation token if valid
   * @throws UnauthorizedError if token is invalid or expired
   */
  async validateInvitationToken(token: string): Promise<InvitationToken> {
    try {
      const invitationToken = await this.invitationTokenRepository.getByToken(token);
      
      if (!invitationToken) {
        throw invitationTokenInvalid({ token });
      }

      // Check if token is expired
      if (invitationToken.getExpiresAt() < new Date()) {
        throw invitationTokenExpired({ 
          token, 
          expiresAt: invitationToken.getExpiresAt().toISOString() 
        });
      }

      return invitationToken;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as any).code;
        if (errorCode === 'INVITATION_TOKEN_INVALID' || errorCode === 'INVITATION_TOKEN_EXPIRED') {
          throw error;
        }
      }
      throw mapAwsError(error, 'InvitationTokenService.validateInvitationToken');
    }
  }

  /**
   * Marks an invitation token as used
   * 
   * @param token - The token to mark as used
   * @param userId - The user who used the token
   * @returns The updated invitation token
   */
  async markTokenAsUsed(
    token: string, 
    userId: string
  ): Promise<InvitationToken> {
    try {
      const invitationToken = await this.invitationTokenRepository.update(token, {
        usedAt: new Date(),
        metadata: {
          ipAddress: undefined,
          userAgent: undefined,
          email: undefined,
          fullName: undefined
        }
      });

      // Create audit event
      await this.auditService.createEvent({
        type: AuditEventType.SIGNER_INVITED,
        envelopeId: invitationToken.getEnvelopeId().getValue(),
        signerId: invitationToken.getSignerId().getValue(),
        userId,
        description: `Invitation token used by signer`,
        metadata: {
          token: token,
          usedAt: new Date().toISOString()
        }
      });

      return invitationToken;
    } catch (error) {
      throw mapAwsError(error, 'InvitationTokenService.markTokenAsUsed');
    }
  }

  /**
   * Gets invitation tokens by envelope ID
   * 
   * @param envelopeId - The envelope ID
   * @returns Array of invitation tokens for the envelope
   */
  async getTokensByEnvelope(envelopeId: EnvelopeId): Promise<InvitationToken[]> {
    try {
      const result = await this.invitationTokenRepository.getByEnvelope(envelopeId.getValue());
      return result.items;
    } catch (error) {
      throw mapAwsError(error, 'InvitationTokenService.getTokensByEnvelope');
    }
  }

  /**
   * Gets invitation tokens by signer ID
   * 
   * @param signerId - The signer ID
   * @returns Array of invitation tokens for the signer
   */
  async getTokensBySigner(signerId: string): Promise<InvitationToken[]> {
    try {
      const result = await this.invitationTokenRepository.getBySigner(signerId);
      return result.items;
    } catch (error) {
      throw mapAwsError(error, 'InvitationTokenService.getTokensBySigner');
    }
  }

  /**
   * Publishes signer.invited events for all signers of an envelope
   * Used by SendEnvelopeHandler to trigger email notifications
   * 
   * @param envelopeId - The envelope ID
   * @param userId - The user who sent the envelope
   */
  async publishSignerInvitedEvents(
    envelopeId: EnvelopeId,
    userId: string
  ): Promise<void> {
    try {
      // Get all invitation tokens for this envelope
      const result = await this.invitationTokenRepository.getByEnvelope(envelopeId.getValue());
      
      for (const token of result.items) {
        // Get signer information from token metadata
        const signerEmail = token.getMetadata().email;
        const signerName = token.getMetadata().fullName;
        
        if (signerEmail && signerName) {
          // Create a temporary signer object for event publishing
          const tempSigner = {
            getId: () => ({ getValue: () => token.getSignerId().getValue() }),
            getEnvelopeId: () => envelopeId.getValue(),
            getEmail: () => ({ getValue: () => signerEmail }),
            getFullName: () => signerName
          } as any;
          
          // Publish signer invited event
          await this.signerEventService.publishSignerInvited(
            tempSigner,
            token.getToken(),
            userId
          );
        }
      }
    } catch (error) {
      throw mapAwsError(error, 'InvitationTokenService.publishSignerInvitedEvents');
    }
  }

  /**
   * Deletes an invitation token
   * 
   * @param token - The token to delete
   */
  async deleteToken(token: string): Promise<void> {
    try {
      await this.invitationTokenRepository.delete(token);

      // Create audit event
      await this.auditService.createEvent({
        type: AuditEventType.SIGNER_REMOVED,
        envelopeId: 'unknown',
        signerId: 'unknown',
        userId: 'system',
        description: `Invitation token deleted`,
        metadata: {
          token: token,
          deletedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      throw mapAwsError(error, 'InvitationTokenService.deleteToken');
    }
  }

  /**
   * Generates a secure random token using cryptographically secure random generation
   * 
   * @returns A secure random token string (base64url encoded)
   */
  private generateSecureToken(): string {
    return randomToken(32);
  }
}
