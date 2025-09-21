/**
 * @fileoverview Consent entity - Represents consent given by a signer for electronic signing
 * @summary Manages consent information and audit trail for legal compliance
 * @description The Consent entity encapsulates all consent-related information including
 * timestamps, IP addresses, user agents, and links to signatures for ESIGN Act/UETA compliance.
 */

import { ConsentId } from '../value-objects/ConsentId';
import { EnvelopeId } from '../value-objects/EnvelopeId';
import { SignerId } from '../value-objects/SignerId';
import { 
  consentNotGiven, 
  consentTimestampRequired, 
  consentTextRequired, 
  consentIpRequired, 
  consentUserAgentRequired 
} from '../../signature-errors';

/**
 * Consent entity representing consent given by a signer for electronic signing
 * 
 * A consent record captures all the necessary information for legal compliance
 * including when consent was given, from where, and links to the resulting signature.
 */
export class Consent {
  constructor(
    private readonly id: ConsentId,
    private readonly envelopeId: EnvelopeId,
    private readonly signerId: SignerId,
    private readonly signatureId: SignerId | undefined,
    private readonly consentGiven: boolean,
    private readonly consentTimestamp: Date,
    private readonly consentText: string,
    private readonly ipAddress: string,
    private readonly userAgent: string,
    private readonly createdAt: Date,
    private readonly updatedAt: Date
  ) {}

  /**
   * Gets the consent unique identifier
   */
  getId(): ConsentId {
    return this.id;
  }

  /**
   * Gets the envelope ID this consent belongs to
   */
  getEnvelopeId(): EnvelopeId {
    return this.envelopeId;
  }

  /**
   * Gets the signer ID who gave consent
   */
  getSignerId(): SignerId {
    return this.signerId;
  }

  /**
   * Gets the signature ID linked to this consent
   */
  getSignatureId(): SignerId | undefined {
    return this.signatureId;
  }

  /**
   * Gets whether consent was given
   */
  getConsentGiven(): boolean {
    return this.consentGiven;
  }

  /**
   * Gets the timestamp when consent was given
   */
  getConsentTimestamp(): Date {
    return this.consentTimestamp;
  }

  /**
   * Gets the consent text that was shown to the signer
   */
  getConsentText(): string {
    return this.consentText;
  }

  /**
   * Gets the IP address of the signer when consent was given
   */
  getIpAddress(): string {
    return this.ipAddress;
  }

  /**
   * Gets the user agent of the signer's browser
   */
  getUserAgent(): string {
    return this.userAgent;
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
   * Creates a new consent instance
   * @param params - Consent creation parameters
   * @returns New consent instance
   */
  static create(params: {
    id: ConsentId;
    envelopeId: EnvelopeId;
    signerId: SignerId;
    signatureId: SignerId | undefined;
    consentGiven: boolean;
    consentTimestamp: Date;
    consentText: string;
    ipAddress: string;
    userAgent: string;
  }): Consent {
    const now = new Date();
    return new Consent(
      params.id,
      params.envelopeId,
      params.signerId,
      params.signatureId,
      params.consentGiven,
      params.consentTimestamp,
      params.consentText,
      params.ipAddress,
      params.userAgent,
      now,
      now
    );
  }

  /**
   * Updates the signature ID link
   * @param signatureId - New signature ID to link
   * @returns New consent instance with updated signature ID
   */
  linkWithSignature(signatureId: SignerId): Consent {
    return new Consent(
      this.id,
      this.envelopeId,
      this.signerId,
      signatureId,
      this.consentGiven,
      this.consentTimestamp,
      this.consentText,
      this.ipAddress,
      this.userAgent,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Validates that the consent is valid for legal compliance
   */
  validateForCompliance(): void {
    if (!this.consentGiven) {
      throw consentNotGiven('Consent must be given for legal compliance');
    }

    if (!this.consentTimestamp) {
      throw consentTimestampRequired('Consent timestamp is required for legal compliance');
    }

    if (!this.consentText || this.consentText.trim().length === 0) {
      throw consentTextRequired('Consent text is required for legal compliance');
    }

    if (!this.ipAddress || this.ipAddress.trim().length === 0) {
      throw consentIpRequired('IP address is required for legal compliance');
    }

    if (!this.userAgent || this.userAgent.trim().length === 0) {
      throw consentUserAgentRequired('User agent is required for legal compliance');
    }
  }

  /**
   * Converts consent to plain object for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id.getValue(),
      envelopeId: this.envelopeId.getValue(),
      signerId: this.signerId.getValue(),
      signatureId: this.signatureId?.getValue(),
      consentGiven: this.consentGiven,
      consentTimestamp: this.consentTimestamp.toISOString(),
      consentText: this.consentText,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * Creates a Consent from persistence data
   * @param data - Prisma Consent data
   * @returns Consent instance
   */
  static fromPersistence(data: any): Consent {
    return new Consent(
      ConsentId.fromString(data.id),
      EnvelopeId.fromString(data.envelopeId),
      SignerId.fromString(data.signerId),
      data.signatureId ? SignerId.fromString(data.signatureId) : undefined,
      data.consentGiven,
      data.consentTimestamp,
      data.consentText,
      data.ipAddress,
      data.userAgent,
      data.createdAt,
      data.updatedAt
    );
  }
}
