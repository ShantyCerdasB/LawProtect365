/**
 * @fileoverview SigningAlgorithmEnum - Enum for KMS signing algorithms
 * @summary Defines supported signing algorithms for KMS operations
 * @description This enum contains the supported signing algorithms for KMS operations,
 * providing a centralized location for algorithm constants to avoid hardcoding.
 */

/**
 * Enum for KMS signing algorithms
 * These are the algorithms supported by AWS KMS for digital signing
 */
export enum SigningAlgorithmEnum {
  /** RSA with PSS padding and SHA-256 hash (recommended for new applications) */
  RSASSA_PSS_SHA_256 = 'RSASSA_PSS_SHA_256',
  
  /** RSA with PKCS#1 v1.5 padding and SHA-256 hash (legacy compatibility) */
  RSASSA_PKCS1_V1_5_SHA_256 = 'RSASSA_PKCS1_V1_5_SHA_256',
  
  /** ECDSA with P-256 curve and SHA-256 hash (elliptic curve) */
  ECDSA_SHA_256 = 'ECDSA_SHA_256',
  
  /** ECDSA with P-384 curve and SHA-384 hash (elliptic curve) */
  ECDSA_SHA_384 = 'ECDSA_SHA_384',
  
  /** ECDSA with P-521 curve and SHA-512 hash (elliptic curve) */
  ECDSA_SHA_512 = 'ECDSA_SHA_512'
}

/**
 * Default signing algorithm for new signatures
 * RSASSA_PSS_SHA_256 is recommended for new applications as it provides
 * better security than PKCS#1 v1.5 padding
 */
export const DEFAULT_SIGNING_ALGORITHM = SigningAlgorithmEnum.RSASSA_PSS_SHA_256;

/**
 * Gets the default signing algorithm from environment or uses the default
 * @returns The signing algorithm to use
 */
export function getDefaultSigningAlgorithm(): SigningAlgorithmEnum {
  const envAlgorithm = process.env.KMS_SIGNING_ALGORITHM;
  
  if (envAlgorithm && Object.values(SigningAlgorithmEnum).includes(envAlgorithm as SigningAlgorithmEnum)) {
    return envAlgorithm as SigningAlgorithmEnum;
  }
  
  return DEFAULT_SIGNING_ALGORITHM;
}
