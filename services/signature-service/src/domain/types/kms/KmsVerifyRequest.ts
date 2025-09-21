/**
 * @fileoverview KmsVerifyRequest - Request interface for KMS signature verification
 * @summary Interface for requesting signature verification via KMS
 * @description This interface defines the structure for requesting cryptographic
 * signature verification using AWS KMS.
 */

/**
 * Request interface for KMS signature verification
 * 
 * Contains all parameters required to verify a cryptographic signature
 * using AWS KMS.
 */
export interface KmsVerifyRequest {
  /**
   * SHA-256 hash of the original document
   * Must match the hash that was used during signing
   */
  documentHash: string;

  /**
   * Signature to verify
   * The signature data to be validated against the document hash
   */
  signature: string;

  /**
   * KMS key ID that was used for signing
   * Must be a valid AWS KMS key format (UUID, alias, or ARN)
   */
  kmsKeyId: string;

  /**
   * Signing algorithm used for the signature
   * Optional - defaults to RSASSA_PSS_SHA_256 if not provided
   */
  algorithm?: string;
}
