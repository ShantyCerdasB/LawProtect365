/**
 * @fileoverview Signature value object - Represents cryptographic signature data
 * @summary Immutable value object for signature validation and audit
 * @description Signature is a value object that encapsulates cryptographic signature
 * data and provides validation and audit capabilities. It's created from EnvelopeSigner
 * data and used for business logic operations.
 */

import { SignatureMetadata } from '../value-objects/SignatureMetadata';
import { validateSignatureHash, validateSignatureTimestamp } from '@lawprotect/shared-ts';

/**
 * Signature value object representing cryptographic signature data
 * 
 * A signature contains all the cryptographic evidence of a document signing,
 * including hashes, KMS key information, and metadata for legal validation.
 * This is an immutable value object created from EnvelopeSigner data.
 */
export class Signature {
  constructor(
    private readonly signerId: string,
    private readonly documentHash: string,
    private readonly signatureHash: string,
    private readonly signedS3Key: string,
    private readonly kmsKeyId: string,
    private readonly algorithm: string,
    private readonly signedAt: Date,
    private readonly metadata: SignatureMetadata
  ) {}

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
  getSignedS3Key(): string {
    return this.signedS3Key;
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
  getSignedAt(): Date {
    return this.signedAt;
  }

  /**
   * Gets signature metadata
   */
  getMetadata(): SignatureMetadata {
    return this.metadata;
  }

  /**
   * Gets the signing reason if provided
   */
  getReason(): string | undefined {
    return this.metadata.getReason();
  }

  /**
   * Gets the signing location if provided
   */
  getLocation(): string | undefined {
    return this.metadata.getLocation();
  }

  /**
   * Gets the IP address of the signer
   */
  getIpAddress(): string | undefined {
    return this.metadata.getIpAddress();
  }

  /**
   * Gets the user agent of the signer
   */
  getUserAgent(): string | undefined {
    return this.metadata.getUserAgent();
  }

  /**
   * Creates a Signature from EnvelopeSigner data
   * @param signer - The EnvelopeSigner containing signature data
   * @returns Signature value object or null if no signature data
   */
  static fromEnvelopeSigner(signer: any): Signature | null {
    if (!signer.getDocumentHash() || !signer.getSignatureHash()) {
      return null;
    }

    return new Signature(
      signer.getId().getValue(),
      signer.getDocumentHash()!,
      signer.getSignatureHash()!,
      signer.getSignedS3Key()!,
      signer.getKmsKeyId()!,
      signer.getAlgorithm()!,
      signer.getSignedAt()!,
      SignatureMetadata.fromObject({
        reason: signer.getReason(),
        location: signer.getLocation(),
        ipAddress: signer.getIpAddress(),
        userAgent: signer.getUserAgent()
      })
    );
  }

  /**
   * Checks if this signature equals another signature
   * @param other - Other signature to compare
   * @returns true if signatures are equal
   */
  equals(other: Signature): boolean {
    return this.signerId === other.signerId &&
           this.documentHash === other.documentHash &&
           this.signatureHash === other.signatureHash;
  }

  /**
   * Validates the signature data integrity
   */
  validateIntegrity(): boolean {
    // Basic validation of required fields
    if (!this.documentHash || !this.signatureHash || !this.signedS3Key) {
      return false;
    }

    // Validate hash formats using shared utilities
    try {
      validateSignatureHash(this.documentHash, this.algorithm);
      validateSignatureHash(this.signatureHash, this.algorithm);
    } catch {
      return false;
    }

    // Validate timestamp using shared utilities
    try {
      validateSignatureTimestamp(this.signedAt);
    } catch {
      return false;
    }

    return true;
  }

  /**
   * Gets the signature age in milliseconds
   */
  getAge(): number {
    return Date.now() - this.signedAt.getTime();
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
      signerId: this.signerId,
      documentHash: this.documentHash,
      signatureHash: this.signatureHash,
      signedAt: this.signedAt,
      algorithm: this.algorithm,
      kmsKeyId: this.kmsKeyId,
      signedS3Key: this.signedS3Key,
      reason: this.metadata.getReason(),
      location: this.metadata.getLocation(),
      ipAddress: this.metadata.getIpAddress(),
      userAgent: this.metadata.getUserAgent()
    };
  }
}
