/**
 * @file SignHash.schema.ts
 * @summary Zod schemas for the SignHash endpoint.
 *
 * @description
 * Validates request/response shapes for the internal endpoint that signs precomputed hash digests.
 * Uses existing domain value objects for consistency.
 */

import { z } from "zod";
import { HashDigestSchema } from "@/domain/value-objects/HashDigest";
import { KmsAlgorithmSchema, KmsKeyIdSchema } from "@/domain/value-objects/Kms";


/**
 * Request body schema for signing a hash digest.
 */
export const SignHashRequestSchema = z.object({
  /**
   * Precomputed hash digest to sign.
   */
  digest: HashDigestSchema,

  /**
   * KMS signing algorithm to use.
   */
  algorithm: KmsAlgorithmSchema,

  /**
   * Optional KMS key ID override.
   * If omitted, the default key from configuration is used.
   */
  keyId: KmsKeyIdSchema.optional(),
});

/**
 * Response schema for the signed hash digest.
 */
export const SignHashResponseSchema = z.object({
  /**
   * KMS key ID used for signing.
   */
  keyId: z.string(),

  /**
   * KMS signing algorithm used.
   */
  algorithm: KmsAlgorithmSchema,

  /**
   * Base64url-encoded signature (no padding).
   */
  signature: z.string().regex(/^[A-Za-z0-9_-]+$/, "Expected base64url"),
});

/**
 * Type definitions inferred from schemas.
 */
export type SignHashRequest = z.infer<typeof SignHashRequestSchema>;
export type SignHashResponse = z.infer<typeof SignHashResponseSchema>;

/**
 * Parses and validates the SignHash request body.
 *
 * @param evt - API Gateway event containing the request.
 * @returns Validated request body.
 * @throws {AppError} 400 when body is missing or invalid JSON.
 * @throws {AppError} 422 when schema validation fails.
 */
export const parseSignHashRequest = (evt: any): SignHashRequest => {
  if (!evt.body) {
    throw new Error("Missing request body");
  }

  let json: unknown;
  try {
    json = typeof evt.body === "string" ? JSON.parse(evt.body) : evt.body;
  } catch {
    throw new Error("Invalid JSON in request body");
  }

  const result = SignHashRequestSchema.safeParse(json);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }

  return result.data;
};
