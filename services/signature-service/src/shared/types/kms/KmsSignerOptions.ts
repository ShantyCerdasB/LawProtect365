/**
 * @file KmsSignerOptions.ts
 * @summary Types for KMS signer operations
 * @description Defines configuration options for KMS signer implementations
 */

import type { SigningAlgorithmSpec } from "@aws-sdk/client-kms";

/**
 * Configuration options for KMS signer implementations.
 */
export interface KmsSignerOptions {
  /** Maximum number of retry attempts. */
  maxAttempts?: number;
  
  /** Default KMS key ID used when a call omits `input.keyId`. */
  defaultKeyId?: string;
  
  /** Legacy property for backward compatibility. */
  signerKeyId?: string;
  
  /** Default signing algorithm used when a call omits `input.signingAlgorithm`. */
  defaultSigningAlgorithm?: SigningAlgorithmSpec;
  
  /** Signing algorithm to use. */
  signingAlgorithm?: SigningAlgorithmSpec;
}
