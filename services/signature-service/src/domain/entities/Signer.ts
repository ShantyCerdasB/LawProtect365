/**
 * @fileoverview Signer entity - Represents an individual signer in a signing envelope
 * @summary Manages signer information, status, and signing workflow participation
 * @description The Signer entity encapsulates all business logic related to individual signers,
 * including status management, invitation handling, and consent tracking for legal compliance.
 */

import { SignerId } from '../value-objects/SignerId';
import { Email } from '../value-objects/Email';
import { SignerStatus } from '@lawprotect/shared-ts';
import { 
  invalidSignerState, 
  consentRequired,
  signerAlreadySigned,
  signerAlreadyDeclined
} from '../../signature-errors';

/**
 * Signer entity representing an individual participant in the signing process
 * 
 * A signer can be either the envelope owner or an invited external party.
 * The entity manages signer status, consent, and signing metadata for audit purposes.
 */
export class Signer {
  constructor(
    private readonly id: SignerId,
    private readonly envelopeId: string,
    private readonly email: Email,
    private readonly fullName: string,
    private status: SignerStatus,
    private readonly order: number,
    private signedAt?: Date,
    private declinedAt?: Date,
    private readonly invitationToken?: string,
    private readonly metadata: {
      ipAddress?: string;
      userAgent?: string;
      consentGiven: boolean;
      consentTimestamp?: Date;
      declineReason?: string;
    } = { consentGiven: false }
  ) {}

  /**
   * Gets the signer unique identifier
   */
  getId(): SignerId {
    return this.id;
  }

  /**
   * Gets the envelope ID this signer belongs to
   */
  getEnvelopeId(): string {
    return this.envelopeId;
  }

  /**
   * Gets the signer's email address
   */
  getEmail(): Email {
    return this.email;
  }

  /**
   * Gets the signer's full name
   */
  getFullName(): string {
    return this.fullName;
  }

  /**
   * Gets the current signer status
   */
  getStatus(): SignerStatus {
    return this.status;
  }

  /**
   * Gets the signing order for this signer
   */
  getOrder(): number {
    return this.order;
  }

  /**
   * Gets the timestamp when the signer signed
   */
  getSignedAt(): Date | undefined {
    return this.signedAt;
  }

  /**
   * Gets the timestamp when the signer declined
   */
  getDeclinedAt(): Date | undefined {
    return this.declinedAt;
  }

  /**
   * Gets the invitation token for external signers
   */
  getInvitationToken(): string | undefined {
    return this.invitationToken;
  }

  /**
   * Gets signer metadata
   */
  getMetadata() {
    return { ...this.metadata };
  }

  /**
   * Checks if this signer is the envelope owner
   */
  isOwner(ownerId: string): boolean {
    return this.email.getValue() === ownerId;
  }

  /**
   * Checks if this signer is external (invited)
   */
  isExternal(): boolean {
    return !!this.invitationToken;
  }

  /**
   * Checks if the signer has given consent
   */
  hasConsent(): boolean {
    return this.metadata.consentGiven;
  }

  /**
   * Records consent given by the signer
   */
  recordConsent(ipAddress?: string, userAgent?: string): void {
    if (this.status !== SignerStatus.PENDING) {
      throw invalidSignerState('Can only record consent for pending signers');
    }

    this.metadata.consentGiven = true;
    this.metadata.consentTimestamp = new Date();
    this.metadata.ipAddress = ipAddress;
    this.metadata.userAgent = userAgent;
  }

  /**
   * Updates signer status to signed
   */
  markAsSigned(): void {
    if (this.status !== SignerStatus.PENDING) {
      throw signerAlreadySigned('Can only mark pending signers as signed');
    }

    if (!this.metadata.consentGiven) {
      throw consentRequired('Cannot sign without consent');
    }

    this.status = SignerStatus.SIGNED;
    this.signedAt = new Date();
  }

  /**
   * Updates signer status to declined
   */
  markAsDeclined(reason?: string): void {
    if (this.status !== SignerStatus.PENDING) {
      throw signerAlreadyDeclined('Can only mark pending signers as declined');
    }

    this.status = SignerStatus.DECLINED;
    this.declinedAt = new Date();
    this.metadata.declineReason = reason;
  }

  /**
   * Updates signer status (internal method)
   */
  updateStatus(status: SignerStatus.SIGNED | SignerStatus.DECLINED): void {
    if (status === SignerStatus.SIGNED) {
      this.markAsSigned();
    } else if (status === SignerStatus.DECLINED) {
      this.markAsDeclined();
    }
  }

  /**
   * Checks if signer can sign at this moment
   */
  canSign(): boolean {
    return this.status === SignerStatus.PENDING && 
           this.metadata.consentGiven;
  }

  /**
   * Checks if signer has already signed
   */
  hasSigned(): boolean {
    return this.status === SignerStatus.SIGNED;
  }

  /**
   * Checks if signer has declined
   */
  hasDeclined(): boolean {
    return this.status === SignerStatus.DECLINED;
  }

  /**
   * Gets the decline reason if signer declined
   */
  getDeclineReason(): string | undefined {
    return this.metadata.declineReason;
  }

  /**
   * Validates that the signer can participate in signing
   */
  validateForSigning(): void {
    if (this.status !== SignerStatus.PENDING) {
      throw invalidSignerState('Signer is not in pending status');
    }

    if (!this.metadata.consentGiven) {
      throw consentRequired('Signer has not given consent');
    }

    if (!this.metadata.consentTimestamp) {
      throw consentRequired('Consent timestamp is missing');
    }
  }
}
