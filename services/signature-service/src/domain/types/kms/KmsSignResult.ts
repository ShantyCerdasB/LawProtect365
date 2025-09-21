/**
 * @fileoverview KmsSignResult - Result interface for KMS signing operations
 * @summary Interface for the result of KMS signature creation
 * @description This interface defines the structure returned after successful
 * cryptographic signature creation using AWS KMS.
 */

/**
 * Result interface for KMS signing operations
 * 
 * Contains all data returned after successful signature creation
 * using AWS KMS.
 */
export interface KmsSignResult {
  /**
   * Raw signature bytes as returned by KMS
   * This is the actual cryptographic signature data
   */
  signatureBytes: Uint8Array;

  /**
   * String representation of the signature hash
   * Typically base64 encoded or hex encoded signature
   */
  signatureHash: string;

  /**
   * Algorithm used for signing
   * Matches the algorithm from the request
   */
  algorithm: string;

  /**
   * KMS key ID used for signing
   * Matches the key ID from the request
   */
  kmsKeyId: string;

  /**
   * Timestamp when the signature was created
   * Used for audit and compliance purposes
   */
  signedAt: Date;
}
