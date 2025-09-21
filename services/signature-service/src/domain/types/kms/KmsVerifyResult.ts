/**
 * @fileoverview KmsVerifyResult - Result interface for KMS signature verification
 * @summary Interface for the result of KMS signature verification
 * @description This interface defines the structure returned after signature
 * verification using AWS KMS.
 */

/**
 * Result interface for KMS signature verification
 * 
 * Contains the verification result and any error information
 * from the KMS signature verification process.
 */
export interface KmsVerifyResult {
  /**
   * Whether the signature is valid
   * True if the signature matches the document hash and key
   */
  isValid: boolean;

  /**
   * Error message if verification failed
   * Only present when isValid is false
   */
  error?: string;
}
