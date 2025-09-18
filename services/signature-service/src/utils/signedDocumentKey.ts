/**
 * @fileoverview signedDocumentKey - Utility for signed PDF S3 key generation
 * @summary Generates the canonical S3 key for a signed PDF given an envelopeId
 * @description Centralizes the logic to build the signed document S3 key, so
 * it can be changed in one place without touching handlers/services.
 */

/**
 * Builds the S3 key for a signed PDF for a given envelope.
 * Uses a stable, predictable prefix per envelopeId.
 *
 * If in the future you want to make it configurable, replace the template
 * below with a value from configuration or environment variable and keep
 * this function as the single source of truth.
 */
export function getSignedDocumentS3Key(envelopeId: string): string {
  // Default canonical pattern: envelopes/{envelopeId}/signed.pdf
  return `envelopes/${envelopeId}/signed.pdf`;
}


