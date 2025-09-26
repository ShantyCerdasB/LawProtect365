/**
 * @fileoverview EnvelopeSigner entity - Represents an envelope participant with signature data
 * @summary Manages signer information, status, and cryptographic signature data
 * @description The EnvelopeSigner entity encapsulates all business logic related to individual signers,
 * including status management, signature data, and consent tracking for legal compliance.
 * This entity consolidates the previous Signer and Signature entities into one aligned with Prisma.
 */

import { SignerId } from '../value-objects/SignerId';
import { EnvelopeId } from '../value-objects/EnvelopeId';
import { Email } from '../value-objects/Email';
import { Signature } from '../value-objects/Signature';
import { SignatureMetadata } from '../value-objects/SignatureMetadata';
import { SignerStatus } from '@prisma/client';
import { fromIso, Clock, systemClock } from '@lawprotect/shared-ts';
import { 
  invalidSignerState, 
  signerAlreadySigned,
  signerAlreadyDeclined,
  consentTextRequired
} from '../../signature-errors';

const asDate = (v: unknown): Date | undefined => {
  if (v == null) return undefined;
  if (v instanceof Date) return v;
  if (typeof v === 'string') return fromIso(v);
  if (typeof v === 'number') return fromIso(v.toString());
  return fromIso(JSON.stringify(v));
};

const allowedTransitions: Record<SignerStatus, SignerStatus[]> = {
  [SignerStatus.PENDING]: [SignerStatus.SIGNED, SignerStatus.DECLINED],
  [SignerStatus.SIGNED]: [],
  [SignerStatus.DECLINED]: [],
};

/**
 * EnvelopeSigner entity representing an individual participant in the signing process
 * 
 * An EnvelopeSigner can be either the envelope owner or an invited external party.
 * The entity manages signer status, signature data, and consent tracking for audit purposes.
 * This entity consolidates signer information and cryptographic signature data.
 */
export class EnvelopeSigner {
  constructor(
    private readonly id: SignerId,
    private readonly envelopeId: EnvelopeId,
    private readonly userId: string | null,
    private readonly isExternal: boolean,
    private readonly email: Email | undefined,
    private readonly fullName: string | undefined,
    private readonly invitedByUserId: string | undefined,
    private readonly participantRole: string,
    private order: number,
    private status: SignerStatus,
    private signedAt: Date | undefined,
    private declinedAt: Date | undefined,
    private declineReason: string | undefined,
    private consentGiven: boolean | undefined,
    private consentTimestamp: Date | undefined,
    // Cryptographic signature data
    private documentHash: string | undefined,
    private signatureHash: string | undefined,
    private signedS3Key: string | undefined,
    private kmsKeyId: string | undefined,
    private algorithm: string | undefined,
    private ipAddress: string | undefined,
    private userAgent: string | undefined,
    private reason: string | undefined,
    private location: string | undefined,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private readonly clock: Clock = systemClock
  ) {}

  /**
   * Creates an EnvelopeSigner from persistence data
   * @param data - Prisma EnvelopeSigner data
   * @returns EnvelopeSigner instance
   */
  static fromPersistence(data: any): EnvelopeSigner {
    return new EnvelopeSigner(
      SignerId.fromString(data.id),
      EnvelopeId.fromString(data.envelopeId),
      data.userId ?? null,
      Boolean(data.isExternal),
      Email.fromStringOrUndefined(data.email),
      data.fullName,
      data.invitedByUserId,
      String(data.participantRole),
      Number(data.order),
      data.status,
      asDate(data.signedAt),
      asDate(data.declinedAt),
      data.declineReason,
      Boolean(data.consentGiven),
      asDate(data.consentTimestamp),
      data.documentHash,
      data.signatureHash,
      data.signedS3Key,
      data.kmsKeyId,
      data.algorithm,
      data.ipAddress,
      data.userAgent,
      data.reason,
      data.location,
      asDate(data.createdAt) || new Date(),
      asDate(data.updatedAt) || new Date()
    );
  }

  /**
   * Gets the signer unique identifier
   */
  getId(): SignerId {
    return this.id;
  }

  /**
   * Gets the envelope ID this signer belongs to
   */
  getEnvelopeId(): EnvelopeId {
    return this.envelopeId;
  }

  /**
   * Gets the user ID if this is an internal signer
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Checks if this is an external signer
   */
  getIsExternal(): boolean {
    return this.isExternal;
  }

  /**
   * Gets the signer email
   */
  getEmail(): Email | undefined {
    return this.email;
  }

  /**
   * Gets the signer full name
   */
  getFullName(): string | undefined {
    return this.fullName;
  }

  /**
   * Gets the user ID who invited this signer
   */
  getInvitedByUserId(): string | undefined {
    return this.invitedByUserId;
  }

  /**
   * Gets the participant role
   */
  getParticipantRole(): string {
    return this.participantRole;
  }

  /**
   * Gets the signing order
   */
  getOrder(): number {
    return this.order;
  }

  /**
   * Gets the current signer status
   */
  getStatus(): SignerStatus {
    return this.status;
  }

  /**
   * Gets the signed timestamp
   */
  getSignedAt(): Date | undefined {
    return this.signedAt;
  }

  /**
   * Gets the declined timestamp
   */
  getDeclinedAt(): Date | undefined {
    return this.declinedAt;
  }

  /**
   * Gets the decline reason
   */
  getDeclineReason(): string | undefined {
    return this.declineReason;
  }

  /**
   * Gets consent given status
   */
  getConsentGiven(): boolean | undefined {
    return this.consentGiven;
  }

  /**
   * Gets consent timestamp
   */
  getConsentTimestamp(): Date | undefined {
    return this.consentTimestamp;
  }

  /**
   * Gets the document hash
   */
  getDocumentHash(): string | undefined {
    return this.documentHash;
  }

  /**
   * Gets the signature hash
   */
  getSignatureHash(): string | undefined {
    return this.signatureHash;
  }

  /**
   * Gets the signed S3 key
   */
  getSignedS3Key(): string | undefined {
    return this.signedS3Key;
  }

  /**
   * Gets the KMS key ID
   */
  getKmsKeyId(): string | undefined {
    return this.kmsKeyId;
  }

  /**
   * Gets the signing algorithm
   */
  getAlgorithm(): string | undefined {
    return this.algorithm;
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
   * Gets the signing reason
   */
  getReason(): string | undefined {
    return this.reason;
  }

  /**
   * Gets the signing location
   */
  getLocation(): string | undefined {
    return this.location;
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
   * Asserts that a status transition is valid
   * @param to - Target status
   * @throws invalidSignerState when transition is not allowed
   */
  private assertTransition(to: SignerStatus): void {
    if (!allowedTransitions[this.status]?.includes(to)) {
      throw invalidSignerState(`Invalid status transition: ${this.status} -> ${to}`);
    }
  }

  /**
   * Updates the signer status
   * @param newStatus - The new status to set
   * @throws invalidSignerState when trying to make invalid status transitions
   */
  updateStatus(newStatus: SignerStatus): void {
    this.assertTransition(newStatus);
    this.status = newStatus;
    this.updatedAt = this.clock.now();
  }

  /**
   * Validates that the signer can perform signing or declining actions
   * @throws signerAlreadySigned when signer has already signed
   * @throws signerAlreadyDeclined when signer has already declined
   * @throws invalidSignerState when signer has not given consent
   */
  private validateCanPerformAction(): void {
    if (this.status === SignerStatus.SIGNED) {
      throw signerAlreadySigned('Signer has already signed');
    }
    if (this.status === SignerStatus.DECLINED) {
      throw signerAlreadyDeclined('Signer has already declined');
    }
    if (!this.hasGivenConsent()) {
      throw invalidSignerState('Signer must give consent before signing');
    }
  }

  /**
   * Validates that the signer can decline (does not require consent)
   * @throws signerAlreadySigned when signer has already signed
   * @throws signerAlreadyDeclined when signer has already declined
   */
  private validateCanDecline(): void {
    if (this.status === SignerStatus.SIGNED) {
      throw signerAlreadySigned('Signer has already signed');
    }
    if (this.status === SignerStatus.DECLINED) {
      throw signerAlreadyDeclined('Signer has already declined');
    }
    // Note: Decline does not require consent, unlike signing
  }

  /**
   * Marks the signer as signed with cryptographic evidence
   * @param documentHash - Hash of the document before signing
   * @param signatureHash - Hash of the signature
   * @param signedS3Key - S3 key of the signed document
   * @param kmsKeyId - KMS key used for signing
   * @param algorithm - Signing algorithm used
   * @param metadata - Additional signature metadata
   * @throws signerAlreadySigned when signer has already signed
   * @throws signerAlreadyDeclined when signer has already declined
   * @throws invalidSignerState when signer has not given consent or missing signature fields
   */
  sign(
    documentHash: string,
    signatureHash: string,
    signedS3Key: string,
    kmsKeyId: string,
    algorithm: string,
    metadata: SignatureMetadata
  ): void {
    this.validateCanPerformAction();

    // Validate all required signature evidence fields
    if (!documentHash || documentHash.trim().length === 0) {
      throw invalidSignerState('Missing required signature field: documentHash');
    }
    if (!signatureHash || signatureHash.trim().length === 0) {
      throw invalidSignerState('Missing required signature field: signatureHash');
    }
    if (!signedS3Key || signedS3Key.trim().length === 0) {
      throw invalidSignerState('Missing required signature field: signedS3Key');
    }
    if (!kmsKeyId || kmsKeyId.trim().length === 0) {
      throw invalidSignerState('Missing required signature field: kmsKeyId');
    }
    if (!algorithm || algorithm.trim().length === 0) {
      throw invalidSignerState('Missing required signature field: algorithm');
    }

    this.assertTransition(SignerStatus.SIGNED);
    this.status = SignerStatus.SIGNED;
    this.signedAt = this.clock.now();
    this.documentHash = documentHash;
    this.signatureHash = signatureHash;
    this.signedS3Key = signedS3Key;
    this.kmsKeyId = kmsKeyId;
    this.algorithm = algorithm;
    this.ipAddress = metadata.getIpAddress();
    this.userAgent = metadata.getUserAgent();
    this.reason = metadata.getReason();
    this.location = metadata.getLocation();
    this.updatedAt = this.clock.now();
  }

  /**
   * Marks the signer as declined
   * @param reason - Reason for declining
   * @param ipAddress - IP address of the signer
   * @param userAgent - User agent of the signer
   * @param location - Location of the signer
   * @throws signerAlreadySigned when signer has already signed
   * @throws signerAlreadyDeclined when signer has already declined
   */
  decline(reason: string, ipAddress?: string, userAgent?: string, location?: string): void {
    this.validateCanDecline();

    this.assertTransition(SignerStatus.DECLINED);
    this.status = SignerStatus.DECLINED;
    this.declinedAt = new Date();
    this.declineReason = reason;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
    this.location = location;
    this.updatedAt = this.clock.now();
  }

  /**
   * Records consent given by the signer
   * @param consentText - The consent text that was shown
   * @param ipAddress - IP address of the signer
   * @param userAgent - User agent of the signer
   * @throws consentTextRequired when consent text is empty
   */
  recordConsent(consentText: string, ipAddress: string, userAgent: string): void {
    // Note: consentText is stored in the Consent entity, not here
    // We validate that consentText is not empty for audit purposes
    if (!consentText || consentText.trim().length === 0) {
      throw consentTextRequired('Consent text cannot be empty');
    }
    
    this.consentGiven = true;
    this.consentTimestamp = new Date();
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
    this.updatedAt = this.clock.now();
  }

  /**
   * Checks if the signer has signed
   */
  hasSigned(): boolean {
    return this.status === SignerStatus.SIGNED;
  }

  /**
   * Checks if the signer has declined
   */
  hasDeclined(): boolean {
    return this.status === SignerStatus.DECLINED;
  }

  /**
   * Checks if the signer is pending
   */
  isPending(): boolean {
    return this.status === SignerStatus.PENDING;
  }

  /**
   * Checks if the signer has given consent
   */
  hasGivenConsent(): boolean {
    return this.consentGiven === true;
  }

  /**
   * Creates a Signature value object from this signer's data
   * @returns Signature value object or null if no signature data
   */
  getSignature(): Signature | null {
    return Signature.fromEnvelopeSigner(this);
  }

  /**
   * Checks if this signer equals another signer
   * @param other - Other signer to compare
   * @returns true if signers are equal
   */
  equals(other: EnvelopeSigner): boolean {
    return this.id.equals(other.id);
  }

  /**
   * Updates the signing order of this signer
   * @param newOrder - The new order number
   * @throws invalidSignerState when order is not a valid non-negative integer
   */
  updateOrder(newOrder: number): void {
    if (!Number.isInteger(newOrder) || newOrder < 0) {
      throw invalidSignerState('Order must be a non-negative integer');
    }
    this.order = newOrder;
    this.updatedAt = this.clock.now();
  }

  /**
   * Gets the original order for comparison purposes
   * @returns The original order number
   */
  getOriginalOrder(): number {
    return this.order;
  }
}
