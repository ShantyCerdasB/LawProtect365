/**
 * @fileoverview SigningRequest type - Defines the structure for signing requests
 * @summary Type definition for document signing requests
 * @description The SigningRequest interface defines the data structure required for
 * initiating a document signing process, including all necessary metadata.
 */

/**
 * Request to sign a document
 */
export interface SigningRequest {
  /**
   * The envelope ID containing the document to sign
   */
  envelopeId: string;

  /**
   * The signer ID who is signing the document
   */
  signerId: string;

  /**
   * The document hash before signing (for integrity verification)
   */
  documentHash: string;

  /**
   * The signing algorithm to use (e.g., 'SHA256withRSA')
   */
  algorithm: string;

  /**
   * The KMS key ID to use for signing
   */
  kmsKeyId: string;

  /**
   * Optional reason for signing
   */
  reason?: string;

  /**
   * Optional location where signing is taking place
   */
  location?: string;

  /**
   * IP address of the signer
   */
  ipAddress?: string;

  /**
   * User agent of the signer's browser
   */
  userAgent?: string;
}