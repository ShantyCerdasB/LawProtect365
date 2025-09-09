/**
 * @file SignaturesCommandsPort.ts
 * @summary Port interface for signature command operations
 * @description Defines the interface for signature command operations.
 * This port provides methods to handle hash signing operations with proper business rule validation.
 */

import type { HashAlgorithm, KmsAlgorithm } from "../../../domain/values/enums";

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
};
