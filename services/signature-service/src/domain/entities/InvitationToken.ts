/**
 * @fileoverview InvitationToken entity - Represents an invitation token for external signers
 * @summary Manages invitation token lifecycle, security, and usage tracking
 * @description The InvitationToken entity encapsulates all business logic related to invitation tokens,
 * including token generation, validation, usage tracking, and security for external signer access.
 */

import { InvitationTokenId } from '../value-objects/InvitationTokenId';
import { EnvelopeId } from '../value-objects/EnvelopeId';
import { SignerId } from '../value-objects/SignerId';
import { InvitationTokenStatus } from '@prisma/client';
import { 
  invitationTokenExpired,
  invitationTokenAlreadyUsed,
  invitationTokenRevoked
} from '../../signature-errors';

/**
 * InvitationToken entity representing an invitation token for external signer access
 * 
 * An invitation token provides secure access for external signers to sign documents.
 * The entity manages token lifecycle, security, and usage tracking for audit purposes.
 */
export class InvitationToken {
  constructor(
    private readonly id: InvitationTokenId,
    private readonly envelopeId: EnvelopeId,
    private readonly signerId: SignerId,
    private readonly tokenHash: string,
    private status: InvitationTokenStatus,
    private expiresAt: Date | undefined,
    private sentAt: Date | undefined,
    private lastSentAt: Date | undefined,
    private resendCount: number,
    private usedAt: Date | undefined,
    private usedBy: string | undefined,
    private viewCount: number,
    private lastViewedAt: Date | undefined,
    private signedAt: Date | undefined,
    private signedBy: string | undefined,
    private revokedAt: Date | undefined,
    private revokedReason: string | undefined,
    private createdBy: string | undefined,
    private ipAddress: string | undefined,
    private userAgent: string | undefined,
    private country: string | undefined,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  /**
   * Gets the token unique identifier
   */
  getId(): InvitationTokenId {
    return this.id;
  }

  /**
   * Gets the envelope ID this token belongs to
   */
  getEnvelopeId(): EnvelopeId {
    return this.envelopeId;
  }

  /**
   * Gets the signer ID this token is for
   */
  getSignerId(): SignerId {
    return this.signerId;
  }

  /**
   * Gets the hashed token value
   */
  getTokenHash(): string {
    return this.tokenHash;
  }

  /**
   * Gets the token (same as hash for this implementation)
   */
  getToken(): string {
    return this.tokenHash;
  }

  /**
   * Gets the current token status
   */
  getStatus(): InvitationTokenStatus {
    return this.status;
  }

  /**
   * Gets the expiration timestamp
   */
  getExpiresAt(): Date | undefined {
    return this.expiresAt;
  }

  /**
   * Gets the sent timestamp
   */
  getSentAt(): Date | undefined {
    return this.sentAt;
  }

  /**
   * Gets the last sent timestamp
   */
  getLastSentAt(): Date | undefined {
    return this.lastSentAt;
  }

  /**
   * Gets the resend count
   */
  getResendCount(): number {
    return this.resendCount;
  }

  /**
   * Gets the used timestamp
   */
  getUsedAt(): Date | undefined {
    return this.usedAt;
  }

  /**
   * Gets the user who used the token
   */
  getUsedBy(): string | undefined {
    return this.usedBy;
  }

  /**
   * Gets the view count
   */
  getViewCount(): number {
    return this.viewCount;
  }

  /**
   * Gets the last viewed timestamp
   */
  getLastViewedAt(): Date | undefined {
    return this.lastViewedAt;
  }

  /**
   * Gets the signed timestamp
   */
  getSignedAt(): Date | undefined {
    return this.signedAt;
  }

  /**
   * Gets the user who signed the document
   */
  getSignedBy(): string | undefined {
    return this.signedBy;
  }

  /**
   * Gets the revoked timestamp
   */
  getRevokedAt(): Date | undefined {
    return this.revokedAt;
  }

  /**
   * Gets the revoked reason
   */
  getRevokedReason(): string | undefined {
    return this.revokedReason;
  }

  /**
   * Gets the creator user ID
   */
  getCreatedBy(): string | undefined {
    return this.createdBy;
  }

  /**
   * Gets the IP address
   */
  getIpAddress(): string | undefined {
    return this.ipAddress;
  }

  /**
   * Gets the user agent
   */
  getUserAgent(): string | undefined {
    return this.userAgent;
  }

  /**
   * Gets the country
   */
  getCountry(): string | undefined {
    return this.country;
  }

  /**
   * Gets metadata object with all relevant fields
   */
  getMetadata(): {
    ipAddress?: string;
    userAgent?: string;
    country?: string;
  } {
    return {
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      country: this.country
    };
  }

  /**
   * Gets the creation timestamp
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Gets the last update timestamp
   */
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Marks the token as sent
   * @param ipAddress - IP address of the sender
   * @param userAgent - User agent of the sender
   * @param country - Country of the sender
   */
  markAsSent(ipAddress?: string, userAgent?: string, country?: string): void {
    this.sentAt = new Date();
    this.lastSentAt = new Date();
    this.resendCount += 1;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
    this.country = country;
    this.updatedAt = new Date();
  }

  /**
   * Marks the token as viewed (for GET /envelopes)
   * @param securityContext - Security context with IP, user agent, country
   * @throws invitationTokenExpired when token has expired
   * @throws invitationTokenRevoked when token has been revoked
   */
  markAsViewed(securityContext: {
    ipAddress?: string;
    userAgent?: string;
    country?: string;
  }): void {
    if (this.isExpired()) {
      throw invitationTokenExpired('Invitation token has expired');
    }
    if (this.status === InvitationTokenStatus.REVOKED) {
      throw invitationTokenRevoked('Invitation token has been revoked');
    }

    // Update status to VIEWED if it's ACTIVE
    if (this.status === InvitationTokenStatus.ACTIVE) {
      this.status = InvitationTokenStatus.VIEWED;
    }

    // Update view tracking
    this.viewCount++;
    this.lastViewedAt = new Date();
    this.usedAt = new Date();
    this.usedBy = this.signerId.getValue();

    // Update security context
    if (securityContext.ipAddress) {
      this.ipAddress = securityContext.ipAddress;
    }
    if (securityContext.userAgent) {
      this.userAgent = securityContext.userAgent;
    }
    if (securityContext.country) {
      this.country = securityContext.country;
    }

    this.updatedAt = new Date();
  }

  /**
   * Marks the token as signed (for POST /envelopes/sign)
   * @param signerId - ID of the signer who signed
   * @param securityContext - Security context with IP, user agent, country
   * @throws invitationTokenExpired when token has expired
   * @throws invitationTokenAlreadyUsed when token has already been signed
   * @throws invitationTokenRevoked when token has been revoked
   */
  markAsSigned(signerId: string, securityContext: {
    ipAddress?: string;
    userAgent?: string;
    country?: string;
  }): void {
    if (this.isExpired()) {
      throw invitationTokenExpired('Invitation token has expired');
    }
    if (this.status === InvitationTokenStatus.SIGNED) {
      throw invitationTokenAlreadyUsed('Invitation token has already been used for signing');
    }
    if (this.status === InvitationTokenStatus.REVOKED) {
      throw invitationTokenRevoked('Invitation token has been revoked');
    }

    // Update status to SIGNED
    this.status = InvitationTokenStatus.SIGNED;
    this.signedAt = new Date();
    this.signedBy = signerId;
    this.usedAt = new Date();
    this.usedBy = signerId;

    // Update security context
    if (securityContext.ipAddress) {
      this.ipAddress = securityContext.ipAddress;
    }
    if (securityContext.userAgent) {
      this.userAgent = securityContext.userAgent;
    }
    if (securityContext.country) {
      this.country = securityContext.country;
    }

    this.updatedAt = new Date();
  }

  /**
   * Revokes the token
   * @param reason - Reason for revocation
   * @param revokedBy - User who revoked the token
   */
  revoke(reason: string, revokedBy: string): void {
    this.status = InvitationTokenStatus.REVOKED;
    this.revokedAt = new Date();
    this.revokedReason = reason;
    // Note: revokedBy is tracked for audit purposes but not stored in this entity
    // It should be recorded in the audit trail
    void revokedBy; // Suppress unused parameter warning
    this.updatedAt = new Date();
  }

  /**
   * Checks if the token is active
   */
  isActive(): boolean {
    return this.status === InvitationTokenStatus.ACTIVE && !this.isExpired();
  }

  /**
   * Checks if the token has been used
   */
  isUsed(): boolean {
    return this.status === InvitationTokenStatus.SIGNED;
  }

  /**
   * Checks if the token has been revoked
   */
  isRevoked(): boolean {
    return this.status === InvitationTokenStatus.REVOKED;
  }

  /**
   * Checks if the token has expired
   * Returns true if either the status is EXPIRED or the expiration date has passed
   */
  isExpired(): boolean {
    // Check if status is explicitly EXPIRED
    if (this.status === InvitationTokenStatus.EXPIRED) {
      return true;
    }
    
    // Check if expiration date has passed
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }

  /**
   * Checks if the token can be resent
   * @param maxResends - Maximum number of resends allowed
   * @returns true if token can be resent
   */
  canBeResent(maxResends: number = 3): boolean {
    return this.resendCount < maxResends && this.isActive();
  }

  /**
   * Gets the token age in milliseconds
   */
  getAge(): number {
    return Date.now() - this.createdAt.getTime();
  }

  /**
   * Checks if the token is recent (within specified time)
   */
  isRecent(maxAgeMs: number): boolean {
    return this.getAge() <= maxAgeMs;
  }

  /**
   * Checks if this token equals another token
   * @param other - Other token to compare
   * @returns true if tokens are equal
   */
  equals(other: InvitationToken): boolean {
    return this.id.equals(other.id);
  }

  /**
   * Creates a new InvitationToken for external signer access
   * @param params - Parameters for creating the invitation token
   * @returns InvitationToken instance
   */
  static create(params: {
    envelopeId: EnvelopeId;
    signerId: SignerId;
    tokenHash: string;
    expiresAt: Date;
    createdBy: string;
    ipAddress?: string;
    userAgent?: string;
    country?: string;
  }): InvitationToken {
    const now = new Date();
    return new InvitationToken(
      InvitationTokenId.generate(),
      params.envelopeId,
      params.signerId,
      params.tokenHash,
      InvitationTokenStatus.ACTIVE,
      params.expiresAt,
      undefined, // sentAt
      undefined, // lastSentAt
      0, // resendCount
      undefined, // usedAt
      undefined, // usedBy
      0, // viewCount
      undefined, // lastViewedAt
      undefined, // signedAt
      undefined, // signedBy
      undefined, // revokedAt
      undefined, // revokedReason
      params.createdBy,
      params.ipAddress,
      params.userAgent,
      params.country,
      now, // createdAt
      now  // updatedAt
    );
  }

  /**
   * Creates an InvitationToken from persistence data
   * @param data - Prisma InvitationToken data
   * @returns InvitationToken instance
   */
  static fromPersistence(data: any): InvitationToken {
    return new InvitationToken(
      InvitationTokenId.fromString(data.id),
      EnvelopeId.fromString(data.envelopeId),
      SignerId.fromString(data.signerId),
      data.tokenHash,
      data.status,
      data.expiresAt,
      data.sentAt,
      data.lastSentAt,
      data.resendCount,
      data.usedAt,
      data.usedBy,
      data.viewCount || 0,
      data.lastViewedAt,
      data.signedAt,
      data.signedBy,
      data.revokedAt,
      data.revokedReason,
      data.createdBy,
      data.ipAddress,
      data.userAgent,
      data.country,
      data.createdAt,
      data.updatedAt
    );
  }
}