/**
 * @fileoverview SignatureValidationResult - Result interface for signature validation
 * @summary Defines the result structure for signature validation operations
 * @description This interface defines the complete result structure for signature
 * validation operations, including validation status and error information.
 */

/**
 * Result interface for signature validation operations
 * 
 * This interface defines the complete result structure for signature
 * validation operations. It provides information about the validation
 * outcome, including success status, timing, and error details.
 */
export interface SignatureValidationResult {
  /**
   * Whether the signature validation was successful
   * - true: Signature is valid and authentic
   * - false: Signature is invalid, corrupted, or tampered with
   */
  readonly isValid: boolean;

  /**
   * Timestamp when the signature was originally created
   * Only present when validation is successful
   */
  readonly signedAt?: Date;

  /**
   * Error message describing why validation failed
   * Only present when isValid is false
   */
  readonly error?: string;
}

