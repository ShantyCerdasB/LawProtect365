/**
 * @fileoverview SigningAlgorithmEnum - Enum for KMS signing algorithms
 * @summary Defines supported signing algorithms for KMS operations
 * @description This enum contains the supported signing algorithms for KMS operations,
 * providing a centralized location for algorithm constants to avoid hardcoding.
 */

import { SigningAlgorithm } from '@lawprotect/shared-ts';

/**
 * Default signing algorithm for new signatures
 * SHA256-RSA is the standard algorithm supported by the KmsService
 */
export const DEFAULT_SIGNING_ALGORITHM = SigningAlgorithm.SHA256_RSA;

/**
 * Gets the default signing algorithm from environment or uses the default
 * @returns The signing algorithm to use
 */
export function getDefaultSigningAlgorithm(): SigningAlgorithm {
  const envAlgorithm = process.env.KMS_SIGNING_ALGORITHM;
  
  if (envAlgorithm && Object.values(SigningAlgorithm).includes(envAlgorithm as SigningAlgorithm)) {
    return envAlgorithm as SigningAlgorithm;
  }
  
  return DEFAULT_SIGNING_ALGORITHM;
}
