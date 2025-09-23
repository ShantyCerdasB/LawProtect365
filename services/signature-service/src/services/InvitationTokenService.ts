/**
 * @fileoverview InvitationTokenService - Business logic service for invitation token operations
 * @summary Provides business logic for invitation token management using new architecture
 * @description This service handles all business logic for invitation token operations
 * including generation, validation, expiration management, and coordination with other services
 * using the new Prisma-based architecture with proper separation of concerns.
 */

import { InvitationToken } from '../domain/entities/InvitationToken';
import { InvitationTokenId } from '../domain/value-objects/InvitationTokenId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { SignerId } from '../domain/value-objects/SignerId';
import { EnvelopeSigner } from '../domain/entities/EnvelopeSigner';
import { InvitationTokenRepository } from '../repositories/InvitationTokenRepository';
import { EnvelopeSignerRepository } from '../repositories/EnvelopeSignerRepository';
import { SignatureAuditEventService } from './SignatureAuditEventService';
import { InvitationTokenValidationRule } from '../domain/rules/InvitationTokenValidationRule';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { InvitationTokenStatus } from '@prisma/client';
import { 
  invitationTokenInvalid,
  signerNotFound
} from '../signature-errors';
import { randomToken, sha256Hex } from '@lawprotect/shared-ts';

/**
 * Result of invitation token generation containing both the original token and entity
 */
export interface InvitationTokenResult {
  token: string;           // Original token for frontend use
  entity: InvitationToken; // Complete entity for audit and tracking
  signerId: string;
  email?: string;
  expiresAt: Date;
}

/**
 * InvitationTokenService implementation
 * 
 * Provides business logic for invitation token operations including generation, validation,
 * expiration management, and coordination with other services. Uses the new Prisma-based
 * architecture with proper separation of concerns between entities, repositories, and services.
 */
export class InvitationTokenService {
  private static readonly DEFAULT_EXPIRATION_DAYS = 7;

  constructor(
    private readonly invitationTokenRepository: InvitationTokenRepository,
    private readonly envelopeSignerRepository: EnvelopeSignerRepository,
    private readonly signatureAuditEventService: SignatureAuditEventService
  ) {}

  /**
   * Generates invitation tokens for multiple signers
   * @param signers - Array of envelope signers to generate tokens for
   * @param envelopeId - The envelope ID
   * @param securityContext - Security context from middleware
   * @param actorEmail - Email of the actor (optional, for owner-only scenarios)
   * @returns Array of invitation token results containing both original token and entity
   */
  async generateInvitationTokensForSigners(
    signers: EnvelopeSigner[],
    envelopeId: EnvelopeId,
    securityContext: {
      userId: string;
      ipAddress: string;
      userAgent: string;
      country?: string;
    },
    actorEmail?: string
  ): Promise<InvitationTokenResult[]> {
    try {
      const results: InvitationTokenResult[] = [];
      
      for (const signer of signers) {
        // Skip token generation for owner-only scenarios (actor signing themselves)
        if (actorEmail && signer.getEmail()?.getValue().toLowerCase() === actorEmail.toLowerCase()) {
          continue;
        }

        // Validate that user can create tokens for this signer
        InvitationTokenValidationRule.validateTokenCreation(signer, securityContext.userId);

        // Generate secure token
        const token = this.generateSecureToken();
        const tokenHash = this.hashToken(token);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + InvitationTokenService.DEFAULT_EXPIRATION_DAYS);

        // Validate expiration
        InvitationTokenValidationRule.validateExpiration(expiresAt);

        // Create invitation token entity
        const invitationToken = InvitationToken.create({
          envelopeId,
          signerId: signer.getId(),
          tokenHash,
          expiresAt,
          createdBy: securityContext.userId,
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          country: securityContext.country
        });

        // Save to repository
        const createdToken = await this.invitationTokenRepository.create(invitationToken);

        // Create audit event
        await this.signatureAuditEventService.createSignerAuditEvent(
          envelopeId.getValue(),
          signer.getId().getValue(),
          AuditEventType.INVITATION_ISSUED,
          `Invitation issued to ${signer.getEmail()?.getValue() || 'external signer'}`,
          securityContext.userId,
          signer.getEmail()?.getValue(),
          securityContext.ipAddress,
          securityContext.userAgent,
          {
            tokenId: createdToken.getId().getValue(),
            signerEmail: signer.getEmail()?.getValue(),
            signerName: signer.getFullName(),
            expiresAt: expiresAt.toISOString()
          }
        );

        // Add result with both original token and entity
        results.push({
          token,                    // ✅ Original token for frontend use
          entity: createdToken,     // Complete entity for audit and tracking
          signerId: signer.getId().getValue(),
          email: signer.getEmail()?.getValue(),
          expiresAt: expiresAt
        });
      }

      return results;
    } catch (error) {
      throw invitationTokenInvalid(
        `Failed to generate invitation tokens: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Validates an invitation token
   * @param token - The token to validate
   * @returns The invitation token if valid
   * @throws invitationTokenInvalid if token is invalid or expired
   */
  async validateInvitationToken(token: string): Promise<InvitationToken> {
    try {
      const invitationToken = await this.invitationTokenRepository.getByToken(token);
      
      if (!invitationToken) {
        throw invitationTokenInvalid('Token not found');
      }

      // Validate token using domain rule
      InvitationTokenValidationRule.validateToken(invitationToken);

      return invitationToken;
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
      throw invitationTokenInvalid(
        `Token validation failed: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Validates that a signer has access to use an invitation token
   * @param signerId - The signer ID
   * @param invitationToken - The invitation token
   * @returns void if valid, throws error if invalid
   */
  async validateSignerAccess(signerId: SignerId, invitationToken: InvitationToken): Promise<void> {
    try {
      // Get signer from repository
      const signer = await this.envelopeSignerRepository.findById(signerId);
      if (!signer) {
        throw signerNotFound(`Signer with ID ${signerId.getValue()} not found`);
      }

      // Validate signer access using domain rule
      InvitationTokenValidationRule.validateSignerAccess(invitationToken, signer);
    } catch (error) {
      throw signerNotFound(
        `Signer access validation failed: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Marks an invitation token as used
   * @param token - The token to mark as used
   * @param userId - The user who used the token
   * @returns The updated invitation token
   */
  async markTokenAsUsed(token: string, userId: string): Promise<InvitationToken> {
    try {
      const invitationToken = await this.validateInvitationToken(token);
      
      // Mark token as used using entity method
      invitationToken.markAsUsed(userId);

      // Update in repository
      const updatedToken = await this.invitationTokenRepository.update(
        invitationToken.getId(),
        invitationToken
      );

      // Create audit event
      await this.signatureAuditEventService.createSignerAuditEvent(
        invitationToken.getEnvelopeId().getValue(),
        invitationToken.getSignerId().getValue(),
        AuditEventType.INVITATION_TOKEN_USED,
        `Invitation token used by user ${userId}`,
        userId,
        undefined,
        invitationToken.getIpAddress(),
        invitationToken.getUserAgent(),
        {
          usedAt: invitationToken.getUsedAt()?.toISOString()
        }
      );

      return updatedToken;
    } catch (error) {
      throw invitationTokenInvalid(
        `Failed to mark token as used: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Revokes an invitation token
   * @param tokenId - The token ID to revoke
   * @param reason - Reason for revocation
   * @param userId - The user revoking the token
   * @returns The updated invitation token
   */
  async revokeToken(tokenId: InvitationTokenId, reason: string, userId: string): Promise<InvitationToken> {
    try {
      const invitationToken = await this.invitationTokenRepository.findById(tokenId);
      if (!invitationToken) {
        throw invitationTokenInvalid(`Token with ID ${tokenId.getValue()} not found`);
      }

      // Revoke token using entity method
      invitationToken.revoke(reason, userId);

      // Update in repository
      const updatedToken = await this.invitationTokenRepository.update(tokenId, invitationToken);

      // Create audit event
      await this.signatureAuditEventService.createSignerAuditEvent(
        invitationToken.getEnvelopeId().getValue(),
        invitationToken.getSignerId().getValue(),
        AuditEventType.INVITATION_TOKEN_USED,
        `Invitation token revoked: ${reason}`,
        userId,
        undefined,
        invitationToken.getIpAddress(),
        invitationToken.getUserAgent(),
        {
          revokedAt: invitationToken.getRevokedAt()?.toISOString(),
          revokedReason: reason
        }
      );

      return updatedToken;
    } catch (error) {
      throw invitationTokenInvalid(
        `Failed to revoke token: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets invitation tokens by envelope
   * @param envelopeId - The envelope ID
   * @returns Array of invitation tokens
   */
  async getTokensByEnvelope(envelopeId: EnvelopeId): Promise<InvitationToken[]> {
    return this.invitationTokenRepository.findByEnvelopeId(envelopeId);
  }

  /**
   * Gets invitation tokens by signer
   * @param signerId - The signer ID
   * @returns Array of invitation tokens
   */
  async getTokensBySigner(signerId: SignerId): Promise<InvitationToken[]> {
    return this.invitationTokenRepository.findBySignerId(signerId);
  }

  /**
   * Gets active invitation tokens by envelope
   * @param envelopeId - The envelope ID
   * @returns Array of active invitation tokens
   */
  async getActiveTokensByEnvelope(envelopeId: EnvelopeId): Promise<InvitationToken[]> {
    const allTokens = await this.invitationTokenRepository.findByEnvelopeId(envelopeId);
    return allTokens.filter(token => token.getStatus() === InvitationTokenStatus.ACTIVE);
  }

  /**
   * Counts invitation tokens by envelope
   * @param envelopeId - The envelope ID
   * @returns Number of invitation tokens
   */
  async countTokensByEnvelope(envelopeId: EnvelopeId): Promise<number> {
    return this.invitationTokenRepository.countByEnvelopeId(envelopeId);
  }


  /**
   * Generates a secure random token
   * @returns Secure random token string
   */
  private generateSecureToken(): string {
    return randomToken(32); // 32 bytes = 64 hex characters
  }

  /**
   * Hashes a token for secure storage using shared-ts crypto utility
   * @param token - Plain token string
   * @returns Hashed token string
   */
  private hashToken(token: string): string {
    return sha256Hex(token);
  }
}