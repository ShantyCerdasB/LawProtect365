/**
 * @file SignaturesCommandsPort.ts
 * @summary Port interface for signature command operations
 * @description Defines the interface for signature command operations.
 * This port provides methods to handle hash signing operations with proper business rule validation.
 */

import type { HashAlgorithm, KmsAlgorithm } from "../../../domain/values/enums";
import type { SignatureContext } from "../../../domain/value-objects/security/SignatureContext";

/**
 * Input for hash signing operation
 */
export interface SignHashCommand {
  /** The hash digest to sign */
  digest: {
    alg: HashAlgorithm;
    value: string;
  };
  /** KMS signing algorithm to use (must be allowed by policy) */
  algorithm: KmsAlgorithm;
  /** Optional override for the KMS key id */
  keyId?: string;
}

/**
 * Result of hash signing
 */
export interface SignHashResult {
  /** The signature generated */
  signature: string;
  /** The key ID used for signing */
  keyId: string;
  /** The algorithm used for signing */
  algorithm: string;
}

/**
 * Input for hash signing operation with complete context
 */
export interface SignHashWithContextCommand {
  /** The hash digest to sign */
  digest: {
    alg: HashAlgorithm;
    value: string;
  };
  /** KMS signing algorithm to use (must be allowed by policy) */
  algorithm: KmsAlgorithm;
  /** Optional override for the KMS key id */
  keyId?: string;
  /** Email address of the signer */
  signerEmail: string;
  /** Full name of the signer */
  signerName: string;
  /** Unique identifier of the signer */
  signerId: string;
  /** IP address from which the signing was performed */
  ipAddress: string;
  /** User agent string from the signing request */
  userAgent: string;
  /** Timestamp when the signing occurred (ISO 8601) */
  timestamp: string;
  /** Whether consent was given for signing */
  consentGiven: boolean;
  /** Timestamp when consent was given (ISO 8601) */
  consentTimestamp: string;
  /** Text of the consent that was given */
  consentText: string;
  /** Email of the person who invited the signer (if applicable) */
  invitedBy?: string;
  /** Name of the person who invited the signer (if applicable) */
  invitedByName?: string;
  /** Message included with the invitation (if applicable) */
  invitationMessage?: string;
  /** Unique identifier of the envelope being signed */
  envelopeId: string;
}

/**
 * Result of hash signing with complete context
 */
export interface SignHashWithContextResult {
  /** The signature generated */
  signature: string;
  /** The key ID used for signing */
  keyId: string;
  /** The algorithm used for signing */
  algorithm: string;
  /** Complete context information used for signing */
  context: SignatureContext;
  /** Hash of the context for verification */
  contextHash: string;
}

/**
 * Port interface for signature command operations
 * 
 * This port defines the contract for write operations on signature processes.
 * Implementations should handle business rule validation and KMS operations.
 */
export interface SignaturesCommandsPort {
  /**
   * @summary Signs a hash digest using KMS
   * @description Signs a hash digest using KMS with proper algorithm validation
   * @param command - The hash signing command
   * @returns Promise resolving to signing result
   */
  signHash(command: SignHashCommand): Promise<SignHashResult>;
  
  /**
   * @summary Signs a hash digest using KMS with complete context
   * @description Signs a hash digest using KMS with complete legal context for compliance
   * @param command - The hash signing command with context
   * @returns Promise resolving to signing result with context
   */
  signHashWithContext(command: SignHashWithContextCommand): Promise<SignHashWithContextResult>;
};
