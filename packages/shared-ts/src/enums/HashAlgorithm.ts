/**
 * @fileoverview HashAlgorithm enum - Defines hash algorithms for validation
 * @summary Enumerates hash algorithms used in signature and validation operations
 * @description The HashAlgorithm enum defines hash algorithms used in
 * signature validation, cryptographic operations, and hash length calculations.
 */

/**
 * Hash algorithm enumeration
 * 
 * Defines hash algorithms used in signature validation and cryptographic operations.
 * Used for hash length calculations and algorithm validation.
 */
export enum HashAlgorithm {
  /**
   * SHA-256 hash algorithm
   * - 256-bit hash
   * - 64 character hex string
   * - Standard security level
   */
  SHA256 = 'SHA256',

  /**
   * SHA-384 hash algorithm
   * - 384-bit hash
   * - 96 character hex string
   * - Enhanced security level
   */
  SHA384 = 'SHA384',

  /**
   * SHA-512 hash algorithm
   * - 512-bit hash
   * - 128 character hex string
   * - High security level
   */
  SHA512 = 'SHA512'
}

/**
 * Hash lengths for different algorithms
 */
export const HASH_LENGTHS: Record<HashAlgorithm, number> = {
  [HashAlgorithm.SHA256]: 64,    // SHA-256 produces 64 character hex string
  [HashAlgorithm.SHA384]: 96,    // SHA-384 produces 96 character hex string
  [HashAlgorithm.SHA512]: 128,   // SHA-512 produces 128 character hex string
};

/**
 * Gets the hash length for a specific algorithm
 * @param algorithm - The hash algorithm
 * @returns The expected hash length in characters
 */
export function getHashLength(algorithm: HashAlgorithm): number {
  return HASH_LENGTHS[algorithm];
}
