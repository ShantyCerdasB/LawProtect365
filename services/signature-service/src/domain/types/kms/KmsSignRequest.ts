/**
 * @fileoverview KmsSignRequest - Request interface for KMS signing operations
 * @summary Interface for requesting document signature creation via KMS
 * @description This interface defines the structure for requesting cryptographic
 * signature creation using AWS KMS, containing all necessary parameters for signing.
 */

/**
 * Request interface for KMS signing operations
 * 
 * Contains all parameters required to create a cryptographic signature
 * using AWS KMS for a document hash.
 */
export interface KmsSignRequest {
  /**
   * SHA-256 hash of the document to be signed
   * Must be a valid SHA-256 hash (64 hex characters)
   */
  documentHash: string;

  /**
   * KMS key ID to use for signing
   * Must be a valid AWS KMS key format (UUID, alias, or ARN)
   */
  kmsKeyId: string;

  /**
   * Signing algorithm to use
   * Must be a valid signing algorithm from the SigningAlgorithm enum
   */
  algorithm: string;
}
