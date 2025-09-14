/**
 * @fileoverview DeclineRequest type - Defines the structure for decline requests
 * @summary Type definition for document signing decline requests
 * @description The DeclineRequest interface defines the data structure required for
 * declining a document signing request.
 */

/**
 * Request to decline signing
 */
export interface DeclineRequest {
  /**
   * The envelope ID
   */
  envelopeId: string;

  /**
   * The signer ID who is declining
   */
  signerId: string;

  /**
   * Optional reason for declining
   */
  reason?: string;

  /**
   * IP address of the signer
   */
  ipAddress?: string;

  /**
   * User agent of the signer's browser
   */
  userAgent?: string;
}
