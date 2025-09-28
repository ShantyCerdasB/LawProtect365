/**
 * @fileoverview SigningMessages - Enum for signing operation messages
 * @summary Centralized messages for signing operations
 * @description This enum contains all standardized messages used in signing operations
 * to ensure consistency and maintainability across the signature service.
 */

/**
 * Enum containing standardized messages for signing operations
 */
export enum SigningMessages {
  /** Success message when document is signed successfully */
  DOCUMENT_SIGNED_SUCCESS = 'Document signed successfully',
  /** Message when signing process is initiated */
  SIGNING_INITIATED = 'Signing process initiated',
  /** Message when signature is validated */
  SIGNATURE_VALIDATED = 'Signature validated successfully',
  /** Message when signing is completed */
  SIGNING_COMPLETED = 'Signing completed successfully'
}
