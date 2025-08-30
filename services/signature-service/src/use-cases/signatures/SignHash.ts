/**
 * @file SignHash.ts
 * @summary Use case for signing precomputed hash digests with KMS.
 *
 * @description
 * Orchestrates the signing of precomputed hash digests using AWS KMS.
 * Validates algorithm permissions, converts base64url digest to bytes,
 * calls KMS for signing, and returns base64url signature.
 */

import type { KmsPort } from "@lawprotect/shared-ts";
import { toBase64Url } from "@lawprotect/shared-ts";
import { assertKmsAlgorithmAllowed } from "@/domain/rules/Signing.rules";
import type { HashDigest, KmsAlgorithmType, KmsKeyId } from "@/domain/value-objects";
import { base64urlToBytes } from "@/shared/utils/Base64Url.util";

/**
 * Input parameters for the SignHash use case.
 */
export interface SignHashInput {
  /**
   * Precomputed hash digest to sign.
   */
  digest: HashDigest;
  

  /**
   * KMS signing algorithm to use.
   */
  algorithm: KmsAlgorithmType;

  /**
   * Optional KMS key ID override.
   * If omitted, the default key from configuration is used.
   */
  keyId?: KmsKeyId;
}

/**
 * Output result from the SignHash use case.
 */
export interface SignHashOutput {
  /**
   * KMS key ID used for signing.
   */
  keyId: string;

  /**
   * KMS signing algorithm used.
   */
  algorithm: KmsAlgorithmType;

  /**
   * Base64url-encoded signature (no padding).
   */
  signature: string;
}

/**
 * Context dependencies for the SignHash use case.
 */
export interface SignHashContext {
  /**
   * KMS port for signing operations.
   */
  kms: KmsPort;

  /**
   * Default KMS key ID from configuration.
   */
  defaultKeyId: string;

  /**
   * Allowed KMS algorithms from policy.
   */
  allowedAlgorithms?: readonly string[];
}


/**
 * Signs a precomputed hash digest using KMS.
 *
 * @param input - Input parameters containing digest, algorithm, and optional key ID.
 * @param ctx - Context containing KMS port and configuration.
 * @returns Promise resolving to the signing result.
 * @throws {ForbiddenError} When the algorithm is not allowed by policy.
 * @throws {BadRequestError} When KMS signing fails.
 * @throws {InternalError} When KMS returns unexpected results.
 */
export const executeSignHash = async (
  input: SignHashInput,
  ctx: SignHashContext
): Promise<SignHashOutput> => {
  // Validate algorithm is allowed by policy
  assertKmsAlgorithmAllowed(input.algorithm, ctx.allowedAlgorithms);

  // Convert base64url digest to bytes
  const digestBytes = base64urlToBytes(input.digest.value);

  // Determine key ID (use override or default)
  const keyId = input.keyId ?? ctx.defaultKeyId;

  // Sign the digest using KMS
  const { signature } = await ctx.kms.sign({
    keyId,
    signingAlgorithm: input.algorithm,
    message: digestBytes,
  });

  // Convert signature bytes to base64url
  const signatureBase64url = toBase64Url(Buffer.from(signature));

  return {
    keyId,
    algorithm: input.algorithm,
    signature: signatureBase64url,
  };
};
