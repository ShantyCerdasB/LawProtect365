/**
 * @fileoverview KmsCreateSignatureRequest - Request interface for KMS signature creation
 * @summary Defines the request structure for creating digital signatures via KMS
 * @description This interface defines the complete request structure for creating
 * digital signatures using AWS KMS, including all required fields and metadata.
 */

import { SignatureId } from '../../value-objects/SignatureId';
import { SignerId } from '../../value-objects/SignerId';
import { EnvelopeId } from '../../value-objects/EnvelopeId';
import { SigningAlgorithm } from '../../enums/SigningAlgorithm';

/**
 * Request interface for creating digital signatures via KMS
 * 
 * This interface defines the complete request structure for creating
 * digital signatures using AWS KMS. It includes all required fields
 * for signature creation, document handling, and metadata tracking.
 */
export interface KmsCreateSignatureRequest {
  /**
   * Unique identifier for the signature
   */
  readonly signatureId: SignatureId;

  /**
   * Identifier of the signer creating the signature
   */
  readonly signerId: SignerId;

  /**
   * Identifier of the envelope containing the document
   */
  readonly envelopeId: EnvelopeId;

  /**
   * S3 key of the PDF to be signed (flattened or already signed)
   * This is the input document that will be processed
   */
  readonly inputKey: string;

  /**
   * S3 key where the signed PDF will be stored
   * For overwrite strategy, this should always equal inputKey
   */
  readonly outputKey: string;

  /**
   * Hash of the current PDF (before signing)
   * Used for integrity verification and signature binding
   */
  readonly documentHash: string;

  /**
   * Cryptographic algorithm to use for signing
   */
  readonly algorithm: SigningAlgorithm;

  /**
   * AWS KMS key identifier for signing operations
   */
  readonly kmsKeyId: string;

  /**
   * Optional metadata for audit and compliance tracking
   */
  readonly metadata?: {
    /**
     * IP address of the signer (for security audit)
     */
    readonly ipAddress?: string;

    /**
     * User agent string (for security audit)
     */
    readonly userAgent?: string;

    /**
     * Reason for signing (for compliance)
     */
    readonly reason?: string;

    /**
     * Geographic location of signing (for compliance)
     */
    readonly location?: string;

    /**
     * Email of the user performing the signing (for audit trail)
     */
    readonly userEmail?: string;
  };
}
