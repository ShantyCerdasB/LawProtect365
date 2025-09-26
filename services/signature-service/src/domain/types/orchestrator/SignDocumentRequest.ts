/**
 * @fileoverview SignDocumentRequest - Request interface for document signing operations
 * @summary Contains all data required for document signing workflow
 * @description This interface defines the structure for document signing requests,
 * including authentication data, document information, signature parameters, and consent data.
 */

import { NetworkSecurityContext } from '@lawprotect/shared-ts';

/**
 * Consent information with network security context
 */
export interface ConsentInfo extends NetworkSecurityContext {
  /** Whether consent was given */
  given: boolean;
  /** Timestamp when consent was given */
  timestamp: string;
  /** Text of the consent that was shown */
  text: string;
}

export interface SignDocumentRequest {
  /** Envelope ID for authenticated users */
  envelopeId: string;
  /** Signer ID for authenticated users */
  signerId: string;
  /** Invitation token for external users */
  invitationToken?: string;
  /** S3 key of the flattened document ready for signing */
  flattenedKey?: string;
  /** Signed document (PDF with visual signature applied) */
  signedDocument?: string;
  /** Hash of the document to be signed */
  documentHash: string;
  /** Hash of the signature */
  signatureHash: string;
  /** S3 key where the signed document is stored */
  s3Key: string;
  /** KMS key ID used for signing */
  kmsKeyId: string;
  /** Signing algorithm used */
  algorithm: string;
  /** Optional reason for signing */
  reason?: string;
  /** Optional location where signing occurred */
  location?: string;
  /** Consent information */
  consent: ConsentInfo;
}