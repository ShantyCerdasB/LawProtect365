/**
 * @fileoverview SignatureData - Interface for signature information
 * @summary Defines the interface for signature data when a signer signs
 * @description This interface contains all the cryptographic and metadata information
 * associated with a signature, including hashes, S3 keys, and audit information.
 */

export interface SignatureData {
  documentHash: string;
  signatureHash: string;
  signedS3Key: string;
  kmsKeyId: string;
  algorithm: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  location?: string;
  consentText?: string;
}
