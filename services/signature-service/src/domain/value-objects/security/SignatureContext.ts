/**
 * @file SignatureContext.ts
 * @summary Value object for signature context information
 * @description Contains all the contextual information required for legal signature validation
 */

/**
 * @summary Complete context information for signature operations
 * @description Includes signer information, consent data, invitation details, and cryptographic context
 * This context is cryptographically bound to the signature for legal compliance
 */
export interface SignatureContext {
  /** Email address of the signer */
  readonly signerEmail: string;
  /** Full name of the signer */
  readonly signerName: string;
  /** Unique identifier of the signer */
  readonly signerId: string;
  
  /** IP address from which the signing was performed */
  readonly ipAddress: string;
  /** User agent string from the signing request */
  readonly userAgent: string;
  /** Timestamp when the signing occurred (ISO 8601) */
  readonly timestamp: string;
  
  /** Whether consent was given for signing */
  readonly consentGiven: boolean;
  /** Timestamp when consent was given (ISO 8601) */
  readonly consentTimestamp: string;
  /** Text of the consent that was given */
  readonly consentText: string;
  
  /** Email of the person who invited the signer (if applicable) */
  readonly invitedBy?: string;
  /** Name of the person who invited the signer (if applicable) */
  readonly invitedByName?: string;
  /** Message included with the invitation (if applicable) */
  readonly invitationMessage?: string;
  
  /** Unique identifier of the envelope being signed */
  readonly envelopeId: string;
  /** Hash digest of the document being signed */
  readonly documentDigest: string;
  /** Algorithm used to generate the document hash */
  readonly documentHashAlgorithm: string;
  
  /** KMS signing algorithm used */
  readonly signingAlgorithm: string;
  /** KMS key ID used for signing */
  readonly kmsKeyId: string;
}
