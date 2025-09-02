/**
 * @file KmsSignerOptions.schema.ts
 * @summary Zod schema for validating KMS signer options
 * @description Provides validation for KMS signer configuration
 */

import { z } from "zod";

/** Schema for validating KMS signer options. */
export const KmsSignerOptionsSchema = z.object({
  /** Maximum number of retry attempts. */
  maxAttempts: z.number().int().positive("Max attempts must be a positive integer").optional(),
  
  /** Default KMS key ID used when a call omits `input.keyId`. */
  defaultKeyId: z.string().optional(),
  
  /** Legacy property for backward compatibility. */
  signerKeyId: z.string().optional(),
  
  /** Default signing algorithm used when a call omits `input.signingAlgorithm`. */
  defaultSigningAlgorithm: z.string().optional(),
  
  /** Signing algorithm to use. */
  signingAlgorithm: z.string().optional(),
});

/** Type inference from the schema. */
export type KmsSignerOptionsSchema = z.infer<typeof KmsSignerOptionsSchema>;
