/**
 * @file types.ts
 * @summary KMS implementation types
 * @description Types for KMS implementation
 */

export interface KmsSignerOptions {
  maxAttempts?: number;
  defaultKeyId?: string;
  defaultSigningAlgorithm?: string;
  // Legacy support
  signerKeyId?: string;
  signingAlgorithm?: string;
  // External configuration support
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}






