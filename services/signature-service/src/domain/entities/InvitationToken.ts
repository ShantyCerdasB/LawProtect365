/**
 * @fileoverview InvitationToken entity - Represents an invitation token for signers
 * @summary Domain entity for invitation tokens
 * @description The InvitationToken entity represents a secure token used to invite
 * external signers to sign documents, with expiration and security features.
 */

import { InvitationTokenId } from '../value-objects/InvitationTokenId';
import { SignerId } from '../value-objects/SignerId';
import { EnvelopeId } from '../value-objects/EnvelopeId';

/**
 * InvitationToken entity
 * 
 * Represents a secure token used to invite external signers to sign documents,
 * with expiration and security features for secure access control.
 */
export class InvitationToken {
  constructor(
    private readonly id: InvitationTokenId,
    private readonly token: string,
    private readonly signerId: SignerId,
    private readonly envelopeId: EnvelopeId,
    private readonly expiresAt: Date,
    private readonly createdAt: Date,
    private readonly usedAt?: Date,
    private readonly metadata: {
      ipAddress?: string;
      userAgent?: string;
      email?: string;
      fullName?: string;
      country?: string;
    } = {}
  ) {}

  /**
   * Gets the invitation token unique identifier
   */
  getId(): InvitationTokenId {
    return this.id;
  }

  /**
   * Gets the invitation token string
   */
  getToken(): string {
    return this.token;
  }

  /**
   * Gets the signer ID this token is for
   */
  getSignerId(): SignerId {
    return this.signerId;
  }

  /**
   * Gets the envelope ID this token is for
   */
  getEnvelopeId(): EnvelopeId {
    return this.envelopeId;
  }

  /**
   * Gets the token expiration date
   */
  getExpiresAt(): Date {
    return this.expiresAt;
  }

  /**
   * Gets the token creation date
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Gets the token usage date
   */
  getUsedAt(): Date | undefined {
    return this.usedAt;
  }

  /**
   * Gets the token metadata
   */
  getMetadata(): {
    ipAddress?: string;
    userAgent?: string;
    email?: string;
    fullName?: string;
    country?: string;
  } {
    return this.metadata;
  }

  /**
   * Checks if the token is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Checks if the token has been used
   */
  isUsed(): boolean {
    return this.usedAt !== undefined;
  }

  /**
   * Checks if the token is valid (not expired and not used)
   */
  isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }

  /**
   * Marks the token as used
   */
  markAsUsed(usedAt: Date = new Date()): InvitationToken {
    return new InvitationToken(
      this.id,
      this.token,
      this.signerId,
      this.envelopeId,
      this.expiresAt,
      this.createdAt,
      usedAt,
      this.metadata
    );
  }
}

