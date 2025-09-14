/**
 * @fileoverview Signature entity - Represents a cryptographic signature on a document
 * @summary Manages digital signature data, validation, and audit trail for legal compliance
 * @description The Signature entity encapsulates all cryptographic signature information,
 * including hash values, KMS key usage, timestamps, and certificate data for legal validation.
 */

import { SignatureId } from '../value-objects/SignatureId';
import { SignatureStatus } from '../enums/SignatureStatus';
import { 
  signatureFailed, 
  signatureAlreadyExists
} from '../../signature-errors';

/**
 * Signature entity representing a cryptographic signature on a document
 * 
 * A signature contains all the cryptographic evidence of a document signing,
 * including hashes, KMS key information, and certificate data for legal validation.
 */
export class Signature {
  constructor(
    private readonly id: SignatureId,
    private readonly envelopeId: string,
    private readonly signerId: string,
    private readonly documentHash: string,
    private readonly signatureHash: string,
    private readonly s3Key: string,
    private readonly kmsKeyId: string,
    private readonly algorithm: string,
    private readonly timestamp: Date,
    private status: SignatureStatus,
    private readonly metadata: {
      reason?: string;
      location?: string;
      certificateInfo?: {
        issuer: string;
        subject: string;
        validFrom: Date;
        validTo: Date;
        certificateHash: string;
      };
      ipAddress?: string;
      userAgent?: string;
    }
  ) {}

  /**
   * Gets the signature unique identifier
   */
  getId(): SignatureId {
    return this.id;
  }

  /**
   * Gets the envelope ID this signature belongs to
   */
  getEnvelopeId(): string {
    return this.envelopeId;
  }

  /**
   * Gets the signer ID who created this signature
   */
  getSignerId(): string {
    return this.signerId;
  }

  /**
   * Gets the document hash before signing
   */
  getDocumentHash(): string {
    return this.documentHash;
  }

  /**
   * Gets the signature hash
   */
  getSignatureHash(): string {
    return this.signatureHash;
  }

  /**
   * Gets the S3 key of the signed document
   */
  getS3Key(): string {
    return this.s3Key;
  }

  /**
   * Gets the KMS key ID used for signing
   */
  getKmsKeyId(): string {
    return this.kmsKeyId;
  }

  /**
   * Gets the signing algorithm used
   */
  getAlgorithm(): string {
    return this.algorithm;
  }

  /**
   * Gets the signature timestamp
   */
  getTimestamp(): Date {
    return this.timestamp;
  }

  /**
   * Gets the current signature status
   */
  getStatus(): SignatureStatus {
    return this.status;
  }

  /**
   * Gets signature metadata
   */
  getMetadata() {
    return { ...this.metadata };
  }

  /**
   * Gets the signing reason if provided
   */
  getReason(): string | undefined {
    return this.metadata.reason;
  }

  /**
   * Gets the signing location if provided
   */
  getLocation(): string | undefined {
    return this.metadata.location;
  }

  /**
   * Gets certificate information if available
   */
  getCertificateInfo() {
    return this.metadata.certificateInfo;
  }

  /**
   * Gets the IP address of the signer
   */
  getIpAddress(): string | undefined {
    return this.metadata.ipAddress;
  }

  /**
   * Gets the user agent of the signer
   */
  getUserAgent(): string | undefined {
    return this.metadata.userAgent;
  }

  /**
   * Marks the signature as successfully created
   */
  markAsSigned(): void {
    if (this.status !== SignatureStatus.PENDING) {
      throw signatureAlreadyExists('Can only mark pending signatures as signed');
    }

    this.status = SignatureStatus.SIGNED;
  }

  /**
   * Marks the signature as failed
   */
  markAsFailed(): void {
    if (this.status !== SignatureStatus.PENDING) {
      throw signatureFailed('Can only mark pending signatures as failed');
    }

    this.status = SignatureStatus.FAILED;
  }

  /**
   * Checks if the signature is valid
   */
  isValid(): boolean {
    return this.status === SignatureStatus.SIGNED;
  }

  /**
   * Checks if the signature is pending
   */
  isPending(): boolean {
    return this.status === SignatureStatus.PENDING;
  }

  /**
   * Checks if the signature failed
   */
  isFailed(): boolean {
    return this.status === SignatureStatus.FAILED;
  }

  /**
   * Validates the signature data integrity
   */
  validateIntegrity(): boolean {
    // Basic validation of required fields
    if (!this.documentHash || !this.signatureHash || !this.s3Key) {
      return false;
    }

    // Validate hash formats (assuming SHA-256)
    const hashRegex = /^[a-f0-9]{64}$/i;
    if (!hashRegex.test(this.documentHash) || !hashRegex.test(this.signatureHash)) {
      return false;
    }

    // Validate timestamp is not in the future
    if (this.timestamp > new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Gets the signature age in milliseconds
   */
  getAge(): number {
    return Date.now() - this.timestamp.getTime();
  }

  /**
   * Checks if the signature is recent (within specified time)
   */
  isRecent(maxAgeMs: number): boolean {
    return this.getAge() <= maxAgeMs;
  }

  /**
   * Gets a summary of the signature for audit purposes
   */
  getAuditSummary() {
    return {
      id: this.id.getValue(),
      envelopeId: this.envelopeId,
      signerId: this.signerId,
      timestamp: this.timestamp,
      status: this.status,
      algorithm: this.algorithm,
      kmsKeyId: this.kmsKeyId,
      documentHash: this.documentHash,
      signatureHash: this.signatureHash,
      s3Key: this.s3Key,
      reason: this.metadata.reason,
      location: this.metadata.location,
      ipAddress: this.metadata.ipAddress,
      userAgent: this.metadata.userAgent
    };
  }
}
