/**
 * @fileoverview SigningAlgorithm enum - Defines supported cryptographic signing algorithms
 * @summary Enumerates the cryptographic algorithms supported for digital signatures
 * @description The SigningAlgorithm enum defines all supported cryptographic algorithms
 * for digital signatures, ensuring compliance with security standards and legal requirements.
 */

/**
 * Signing algorithm enumeration
 * 
 * Defines all supported cryptographic algorithms for digital signatures.
 * These algorithms are compliant with security standards and legal requirements.
 */
export enum SigningAlgorithm {
  /**
   * SHA-256 with RSA (RSA-SHA256)
   * - 2048-bit RSA key with SHA-256 hash
   * - Widely supported and legally compliant
   * - Recommended for most use cases
   */
  SHA256_RSA = 'SHA256-RSA',

  /**
   * SHA-384 with RSA (RSA-SHA384)
   * - 3072-bit RSA key with SHA-384 hash
   * - Higher security than SHA-256
   * - Used for high-security applications
   */
  SHA384_RSA = 'SHA384-RSA',

  /**
   * SHA-512 with RSA (RSA-SHA512)
   * - 4096-bit RSA key with SHA-512 hash
   * - Highest security level
   * - Used for maximum security requirements
   */
  SHA512_RSA = 'SHA512-RSA',

  /**
   * ECDSA with P-256 curve and SHA-256
   * - Elliptic Curve Digital Signature Algorithm
   * - More efficient than RSA
   * - Widely supported in modern systems
   */
  ECDSA_P256_SHA256 = 'ECDSA-P256-SHA256',

  /**
   * ECDSA with P-384 curve and SHA-384
   * - Higher security than P-256
   * - Used for high-security applications
   */
  ECDSA_P384_SHA384 = 'ECDSA-P384-SHA384'
}

/**
 * Valid signing algorithms for compliance validation
 */
export const VALID_SIGNING_ALGORITHMS: SigningAlgorithm[] = [
  SigningAlgorithm.SHA256_RSA,
  SigningAlgorithm.SHA384_RSA,
  SigningAlgorithm.SHA512_RSA,
  SigningAlgorithm.ECDSA_P256_SHA256,
  SigningAlgorithm.ECDSA_P384_SHA384
];

/**
 * Default signing algorithm for new signatures
 */
export const DEFAULT_SIGNING_ALGORITHM = SigningAlgorithm.SHA256_RSA;

/**
 * Checks if a signing algorithm is valid
 * @param algorithm - The algorithm to validate
 * @returns True if the algorithm is valid, false otherwise
 */
export function isValidSigningAlgorithm(algorithm: string): algorithm is SigningAlgorithm {
  return VALID_SIGNING_ALGORITHMS.includes(algorithm as SigningAlgorithm);
}

/**
 * Gets all valid signing algorithms
 * @returns Array of all valid signing algorithms
 */
export function getValidSigningAlgorithms(): SigningAlgorithm[] {
  return [...VALID_SIGNING_ALGORITHMS];
}

/**
 * Gets the display name for a signing algorithm
 * @param algorithm - The signing algorithm
 * @returns Human-readable display name for the algorithm
 */
export function getSigningAlgorithmDisplayName(algorithm: SigningAlgorithm): string {
  switch (algorithm) {
    case SigningAlgorithm.SHA256_RSA:
      return 'SHA-256 with RSA';
    case SigningAlgorithm.SHA384_RSA:
      return 'SHA-384 with RSA';
    case SigningAlgorithm.SHA512_RSA:
      return 'SHA-512 with RSA';
    case SigningAlgorithm.ECDSA_P256_SHA256:
      return 'ECDSA P-256 with SHA-256';
    case SigningAlgorithm.ECDSA_P384_SHA384:
      return 'ECDSA P-384 with SHA-384';
    default:
      return 'Unknown Algorithm';
  }
}

/**
 * Gets the security level for a signing algorithm
 * @param algorithm - The signing algorithm
 * @returns Security level: 'HIGH', 'MEDIUM', or 'LOW'
 */
export function getSigningAlgorithmSecurityLevel(algorithm: SigningAlgorithm): 'HIGH' | 'MEDIUM' | 'LOW' {
  switch (algorithm) {
    case SigningAlgorithm.SHA512_RSA:
    case SigningAlgorithm.ECDSA_P384_SHA384:
      return 'HIGH';
    case SigningAlgorithm.SHA384_RSA:
    case SigningAlgorithm.ECDSA_P256_SHA256:
      return 'MEDIUM';
    case SigningAlgorithm.SHA256_RSA:
      return 'LOW';
    default:
      return 'LOW';
  }
}

/**
 * Checks if a signing algorithm meets minimum security requirements
 * @param algorithm - The signing algorithm to check
 * @param minimumLevel - The minimum required security level
 * @returns True if the algorithm meets the minimum security level
 */
export function meetsMinimumSecurityLevel(
  algorithm: SigningAlgorithm, 
  minimumLevel: 'HIGH' | 'MEDIUM' | 'LOW'
): boolean {
  const algorithmLevel = getSigningAlgorithmSecurityLevel(algorithm);
  
  const levelOrder = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 };
  return levelOrder[algorithmLevel] >= levelOrder[minimumLevel];
}

/**
 * Maps AWS KMS SigningAlgorithmSpec strings to domain SigningAlgorithm
 * Returns null if no mapping is known.
 */
export function mapKmsAlgorithmToDomain(spec: string): SigningAlgorithm | null {
  switch (spec) {
    case 'RSASSA_PSS_SHA_256':
    case 'RSA_PKCS1_SHA_256':
      return SigningAlgorithm.SHA256_RSA;
    case 'RSASSA_PSS_SHA_384':
    case 'RSA_PKCS1_SHA_384':
      return SigningAlgorithm.SHA384_RSA;
    case 'RSASSA_PSS_SHA_512':
    case 'RSA_PKCS1_SHA_512':
      return SigningAlgorithm.SHA512_RSA;
    case 'ECDSA_SHA_256':
      return SigningAlgorithm.ECDSA_P256_SHA256;
    case 'ECDSA_SHA_384':
      return SigningAlgorithm.ECDSA_P384_SHA384;
    default:
      return null;
  }
}