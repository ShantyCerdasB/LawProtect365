/**
 * @fileoverview SigningResponse type - Defines the structure for signing responses
 * @summary Type definition for document signing responses
 * @description The SigningResponse interface defines the data structure returned after
 * a successful document signing process.
 */

/**
 * Response after successful signing
 */
export interface SigningResponse {
  /**
   * The signature ID
   */
  signatureId: string;

  /**
   * The envelope ID
   */
  envelopeId: string;

  /**
   * The signer ID
   */
  signerId: string;

  /**
   * The S3 key of the signed document
   */
  s3Key: string;

  /**
   * The signature hash
   */
  signatureHash: string;

  /**
   * The timestamp when the signature was created
   */
  timestamp: Date;

  /**
   * The algorithm used for signing
   */
  algorithm: string;

  /**
   * The KMS key ID used
   */
  kmsKeyId: string;
}
