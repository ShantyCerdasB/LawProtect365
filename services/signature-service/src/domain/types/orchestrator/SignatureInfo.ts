/**
 * @fileoverview SignatureInfo - Interface for signature information in responses
 * @summary Contains signature data for API responses
 * @description This interface defines the structure for signature information
 * returned in API responses, including signature details and metadata.
 */

export interface SignatureInfo {
  /** Signature ID */
  id: string;
  /** Signer ID */
  signerId: string;
  /** Envelope ID */
  envelopeId: string;
  /** Timestamp when signature was created */
  signedAt: string;
  /** Signing algorithm used */
  algorithm: string;
  /** Signature hash */
  hash: string;
}
