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
import { AuditEventService } from './audit/AuditEventService';
import { InvitationTokenValidationRule } from '../domain/rules/InvitationTokenValidationRule';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';
import { 
  invitationTokenInvalid
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
    private readonly signatureAuditEventService: AuditEventService
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

        // Mark token as sent
        createdToken.markAsSent(
          securityContext.ipAddress,
          securityContext.userAgent,
          securityContext.country
        );

        // Update token in repository with sent information
        const sentToken = await this.invitationTokenRepository.update(
          createdToken.getId(),
          createdToken
        );

        // Create audit event
        await this.signatureAuditEventService.createSignerEvent({
          envelopeId: envelopeId.getValue(),
          signerId: signer.getId().getValue(),
          eventType: AuditEventType.INVITATION_ISSUED,
          description: `Invitation issued to ${signer.getEmail()?.getValue() || 'external signer'}`,
          userId: securityContext.userId,
          userEmail: signer.getEmail()?.getValue(),
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          country: securityContext.country,
          metadata: {
            tokenId: createdToken.getId().getValue(),
            signerEmail: signer.getEmail()?.getValue(),
            signerName: signer.getFullName(),
            expiresAt: expiresAt.toISOString()
          }
        });

        // Add result with both original token and entity
        results.push({
          token,                    // ✅ Original token for frontend use
          entity: sentToken,        // Complete entity for audit and tracking
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
   * Generates invitation token for a viewer (read-only access)
   * @param signerId - The real signerId from the created viewer participant
   * @param email - Email address of the viewer
   * @param fullName - Full name of the viewer
   * @param envelopeId - The envelope ID
   * @param securityContext - Security context from middleware
   * @param expiresInDays - Optional expiration time in days (default: 7)
   * @returns Invitation token result for viewer
   */
  async generateViewerInvitationToken(
    signerId: SignerId,
    email: string,
    fullName: string,
    envelopeId: EnvelopeId,
    securityContext: {
      userId: string;
      ipAddress: string;
      userAgent: string;
      country?: string;
    },
    expiresInDays: number = 7
  ): Promise<InvitationTokenResult> {
    try {
      // Generate secure token
      const token = this.generateSecureToken();
      const tokenHash = this.hashToken(token);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // Validate expiration
      InvitationTokenValidationRule.validateExpiration(expiresAt);

      // Create invitation token entity for viewer using the real signerId
      const invitationToken = InvitationToken.create({
        envelopeId,
        signerId: signerId, // Use the real signerId from the created viewer
        tokenHash,
        expiresAt,
        createdBy: securityContext.userId,
        ipAddress: securityContext.ipAddress,
        userAgent: securityContext.userAgent,
        country: securityContext.country
      });

      // Save to repository
      const createdToken = await this.invitationTokenRepository.create(invitationToken);

      // Mark token as sent
      createdToken.markAsSent(
        securityContext.ipAddress,
        securityContext.userAgent,
        securityContext.country
      );

      // Update token in repository with sent information
      const sentToken = await this.invitationTokenRepository.update(
        createdToken.getId(),
        createdToken
      );

      // Create audit event for viewer invitation
      await this.signatureAuditEventService.createSignerEvent({
        envelopeId: envelopeId.getValue(),
        signerId: signerId.getValue(),
        eventType: AuditEventType.INVITATION_ISSUED,
        description: `View invitation issued to ${email} (${fullName})`,
        userId: securityContext.userId,
        userEmail: email,
        ipAddress: securityContext.ipAddress,
        userAgent: securityContext.userAgent,
        country: securityContext.country,
        metadata: {
          tokenId: createdToken.getId().getValue(),
          viewerEmail: email,
          viewerName: fullName,
          expiresAt: expiresAt.toISOString(),
          participantRole: 'VIEWER'
        }
      });

      return {
        token,                    // Original token for frontend use
        entity: sentToken,        // Complete entity for audit and tracking
        signerId: signerId.getValue(), // Use the real signerId
        email: email,
        expiresAt: expiresAt
      };
    } catch (error) {
      throw invitationTokenInvalid(
        `Failed to generate viewer invitation token: ${error instanceof Error ? error.message : error}`
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
   * Marks an invitation token as viewed (for GET /envelopes)
   * @param token - The token to mark as viewed
   * @param securityContext - Security context with IP, user agent, country
   * @returns The updated invitation token
   */
  async markTokenAsViewed(token: string, securityContext: NetworkSecurityContext): Promise<InvitationToken> {
    try {
      const invitationToken = await this.validateInvitationToken(token);
      
      // Mark token as viewed using entity method
      invitationToken.markAsViewed(securityContext);

      // Update in repository
      const updatedToken = await this.invitationTokenRepository.update(
        invitationToken.getId(),
        invitationToken
      );

      // Get signer information for audit event
      const signer = await this.envelopeSignerRepository.findById(invitationToken.getSignerId());
      const signerName = signer?.getFullName() || signer?.getEmail()?.getValue() || 'Unknown';

      // Create audit event
      await this.signatureAuditEventService.createSignerEvent({
        envelopeId: invitationToken.getEnvelopeId().getValue(),
        signerId: invitationToken.getSignerId().getValue(),
        eventType: AuditEventType.INVITATION_TOKEN_USED,
        description: `Invitation token viewed by external signer`,
        userId: `external-user:${signerName}`,
        userEmail: signer?.getEmail()?.getValue(),
        ipAddress: securityContext.ipAddress,
        userAgent: securityContext.userAgent,
        country: securityContext.country,
        metadata: {
          viewCount: updatedToken.getViewCount(),
          lastViewedAt: updatedToken.getLastViewedAt()?.toISOString()
        }
      });

      return updatedToken;
    } catch (error) {
      throw invitationTokenInvalid(
        `Failed to mark token as viewed: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Marks an invitation token as signed (for POST /envelopes/sign)
   * @param token - The token to mark as signed
   * @param signerId - The signer who signed the document
   * @param securityContext - Security context with IP, user agent, country
   * @returns The updated invitation token
   */
  async markTokenAsSigned(token: string, signerId: string, securityContext: NetworkSecurityContext): Promise<InvitationToken> {
    try {
      const invitationToken = await this.validateInvitationToken(token);
      
      // Mark token as signed using entity method
      invitationToken.markAsSigned(signerId, securityContext);

      // Update in repository
      const updatedToken = await this.invitationTokenRepository.update(
        invitationToken.getId(),
        invitationToken
      );

      // Get signer information for audit event
      const signer = await this.envelopeSignerRepository.findById(invitationToken.getSignerId());
      const signerName = signer?.getFullName() || signer?.getEmail()?.getValue() || 'Unknown';

      // Create audit event
      await this.signatureAuditEventService.createSignerEvent({
        envelopeId: invitationToken.getEnvelopeId().getValue(),
        signerId: invitationToken.getSignerId().getValue(),
        eventType: AuditEventType.INVITATION_TOKEN_USED,
        description: `Invitation token used for signing by ${signerName}`,
        userId: `external-user:${signerName}`,
        userEmail: signer?.getEmail()?.getValue(),
        ipAddress: securityContext.ipAddress,
        userAgent: securityContext.userAgent,
        country: securityContext.country,
        metadata: {
          signedAt: updatedToken.getSignedAt()?.toISOString(),
          signedBy: updatedToken.getSignedBy()
        }
      });

      return updatedToken;
    } catch (error) {
      throw invitationTokenInvalid(
        `Failed to mark token as signed: ${error instanceof Error ? error.message : error}`
      );
    }
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
   * Updates token sent information (lastSentAt and resendCount)
   * @param tokenId - The invitation token ID
   * @returns Updated InvitationToken entity
   */
  async updateTokenSent(tokenId: InvitationTokenId): Promise<InvitationToken> {
    try {
      const token = await this.invitationTokenRepository.findById(tokenId);
      if (!token) {
        throw invitationTokenInvalid(`Invitation token with ID ${tokenId.getValue()} not found`);
      }

      // Update token sent information
      token.markAsSent();
      
      // Save updated token
      return await this.invitationTokenRepository.update(tokenId, token);
    } catch (error) {
      throw invitationTokenInvalid(
        `Failed to update token sent information: ${error instanceof Error ? error.message : error}`
      );
    }
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