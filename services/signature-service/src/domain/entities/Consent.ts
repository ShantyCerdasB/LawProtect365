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
 * Consent entity representing consent given by a signer for electronic signing.
 *
 * Captures information needed for legal compliance, including when consent was given,
 * network/user-agent context, and optional linkage to a signature. The consent text
 * is required and must be non-empty.
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
    private readonly country: string | undefined,
    private readonly createdAt: Date,
    private readonly updatedAt: Date
  ) {}

  /**
   * Gets the consent unique identifier
   * @returns The consent identifier value object
   */
  getId(): ConsentId {
    return this.id;
  }

  /**
   * Gets the envelope ID this consent belongs to
   * @returns The envelope identifier value object
   */
  getEnvelopeId(): EnvelopeId {
    return this.envelopeId;
  }

  /**
   * Gets the signer ID who gave consent
   * @returns The signer identifier value object
   */
  getSignerId(): SignerId {
    return this.signerId;
  }

  /**
   * Gets the signature ID linked to this consent
   * @returns The signature identifier value object or undefined
   */
  getSignatureId(): SignerId | undefined {
    return this.signatureId;
  }

  /**
   * Gets whether consent was given
   * @returns True if consent was given, false otherwise
   */
  getConsentGiven(): boolean {
    return this.consentGiven;
  }

  /**
   * Gets the timestamp when consent was given
   * @returns The consent timestamp as Date object
   */
  getConsentTimestamp(): Date {
    return this.consentTimestamp;
  }

  /**
   * Gets the consent text that was shown to the signer
   * @returns The consent text string
   */
  getConsentText(): string {
    return this.consentText;
  }

  /**
   * Gets the IP address of the signer when consent was given
   * @returns The IP address string
   */
  getIpAddress(): string {
    return this.ipAddress;
  }

  /**
   * Gets the user agent of the signer's browser
   * @returns The user agent string
   */
  getUserAgent(): string {
    return this.userAgent;
  }

  /**
   * Gets the country of the signer
   * @returns The country string or undefined
   */
  getCountry(): string | undefined {
    return this.country;
  }

  /**
   * Gets the creation timestamp
   * @returns The creation timestamp as Date object
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Gets the last update timestamp
   * @returns The last update timestamp as Date object
   */
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Creates a new consent instance with validation.
   * @param params Object containing required consent fields.
   * @param params.id ConsentId.
   * @param params.envelopeId EnvelopeId.
   * @param params.signerId SignerId.
   * @param params.signatureId Optional SignerId for the signature.
   * @param params.consentGiven Whether the user gave consent.
   * @param params.consentTimestamp When the consent was captured.
   * @param params.consentText Text shown to the user (must be non-empty).
   * @param params.ipAddress IP address at the time of consent.
   * @param params.userAgent User agent at the time of consent.
   * @param params.country Optional ISO country code.
   * @returns A new Consent instance.
   * @throws consentNotGiven If consentGiven is false.
   * @throws consentTimestampRequired If consentTimestamp is missing.
   * @throws consentTextRequired If consentText is empty.
   * @throws consentIpRequired If ipAddress is missing.
   * @throws consentUserAgentRequired If userAgent is missing.
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
    country?: string;
  }): Consent {
    // Validate invariants before construction
    if (!params.consentGiven) {
      throw consentNotGiven('Consent must be given for legal compliance');
    }
    
    if (!params.consentTimestamp) {
      throw consentTimestampRequired('Consent timestamp is required for legal compliance');
    }
    
    if (!params.consentText || params.consentText.trim().length === 0) {
      throw consentTextRequired('Consent text is required for legal compliance');
    }
    
    if (!params.ipAddress || params.ipAddress.trim().length === 0) {
      throw consentIpRequired('IP address is required for legal compliance');
    }
    
    if (!params.userAgent || params.userAgent.trim().length === 0) {
      throw consentUserAgentRequired('User agent is required for legal compliance');
    }

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
      params.country,
      now,
      now
    );
  }

  /**
   * Links this consent with a signature ID. Idempotent if already linked to the same ID.
   * @param signatureId SignatureId to link.
   * @returns The current instance if the same signature is already linked, otherwise a new instance with updated linkage.
   */
  linkWithSignature(signatureId: SignerId): Consent {
    // Idempotent: return this if already linked to same signature
    if (this.signatureId?.getValue() === signatureId.getValue()) {
      return this;
    }
    
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
      this.country,
      this.createdAt,
      new Date() // Update timestamp only when actually changing
    );
  }

  /**
   * Validates that the consent instance is consistent for compliance purposes.
   * @throws consentNotGiven If consent is not given.
   * @throws consentTimestampRequired If timestamp is missing.
   * @throws consentTextRequired If consent text is empty.
   * @throws consentIpRequired If IP address is missing.
   * @throws consentUserAgentRequired If user agent is missing.
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
   * Converts the consent instance into a plain serializable object.
   * @returns JSON-friendly representation of the consent.
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
      country: this.country,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * Creates a Consent instance from persistence data.
   * @param data Raw database row.
   * @returns Consent instance with mapped and typed fields.
   */
  static fromPersistence(data: any): Consent {
    return new Consent(
      ConsentId.fromString(data.id),
      EnvelopeId.fromString(data.envelopeId),
      SignerId.fromString(data.signerId),
      data.signatureId ? SignerId.fromString(data.signatureId) : undefined,
      Boolean(data.consentGiven), // Ensure boolean
      new Date(data.consentTimestamp), // Convert to Date
      data.consentText,
      data.ipAddress,
      data.userAgent,
      data.country,
      new Date(data.createdAt), // Convert to Date
      new Date(data.updatedAt)  // Convert to Date
    );
  }
}
