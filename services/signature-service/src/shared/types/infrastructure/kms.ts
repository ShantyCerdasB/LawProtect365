/**
 * @file kms.ts
 * @summary KMS-specific types and interfaces
 * @description Shared types for KMS operations and signing
 */

import type { SigningAlgorithmSpec } from "@aws-sdk/client-kms";

/**
 * @summary KMS signing algorithm types
 * @description Supported KMS signing algorithms.
 */
export type KmsAlgorithm = SigningAlgorithmSpec;

/**
 * @summary KMS signer options
 * @description Configuration options for KMS signer.
 */
export interface KmsSignerOptions {
  /** KMS key ID for signing */
  readonly keyId: string;
  /** AWS region */
  readonly region: string;
  /** Signing algorithm */
  readonly algorithm: KmsAlgorithm;
  /** Optional KMS client configuration */
  readonly clientConfig?: {
    /** Maximum retry attempts */
    readonly maxAttempts?: number;
    /** Request timeout in milliseconds */
    readonly requestTimeout?: number;
  };
}

/**
 * @summary KMS signing parameters
 * @description Parameters for KMS signing operations.
 */
export interface KmsSignParams {
  /** Message to sign */
  readonly message: string | Buffer;
  /** Message type (RAW or DIGEST) */
  readonly messageType?: "RAW" | "DIGEST";
  /** Optional signing context */
  readonly signingContext?: Record<string, string>;
}

/**
 * @summary KMS verification parameters
 * @description Parameters for KMS signature verification.
 */
export interface KmsVerifyParams {
  /** Original message */
  readonly message: string | Buffer;
  /** Signature to verify */
  readonly signature: Buffer;
  /** Message type (RAW or DIGEST) */
  readonly messageType?: "RAW" | "DIGEST";
  /** Optional signing context */
  readonly signingContext?: Record<string, string>;
}

/**
 * @summary KMS signing result
 * @description Result of a KMS signing operation.
 */
export interface KmsSignResult {
  /** Generated signature */
  readonly signature: Buffer;
  /** Key ID used for signing */
  readonly keyId: string;
  /** Algorithm used for signing */
  readonly algorithm: KmsAlgorithm;
  /** Signature algorithm */
  readonly signatureAlgorithm: string;
}

/**
 * @summary KMS verification result
 * @description Result of a KMS signature verification.
 */
export interface KmsVerifyResult {
  /** Whether the signature is valid */
  readonly isValid: boolean;
  /** Key ID used for verification */
  readonly keyId: string;
  /** Algorithm used for verification */
  readonly algorithm: KmsAlgorithm;
  /** Error message if verification failed */
  readonly error?: string;
}

/**
 * @summary KMS key configuration
 * @description Configuration for KMS keys used by the application.
 */
export interface KmsKeyConfig {
  /** Key ID or ARN */
  readonly keyId: string;
  /** Key alias */
  readonly alias?: string;
  /** Key description */
  readonly description?: string;
  /** Key usage */
  readonly keyUsage: "SIGN_VERIFY" | "ENCRYPT_DECRYPT";
  /** Key origin */
  readonly origin: "AWS_KMS" | "EXTERNAL" | "AWS_CLOUDHSM";
  /** Whether the key is enabled */
  readonly enabled: boolean;
  /** Key creation date */
  readonly creationDate: string;
  /** Key manager */
  readonly keyManager: "AWS" | "CUSTOMER";
}
