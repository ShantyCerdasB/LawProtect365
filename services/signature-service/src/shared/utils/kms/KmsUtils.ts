/**
 * @file KmsUtils.ts
 * @summary Shared utilities for KMS operations
 * @description Common KMS utility functions that can be reused across microservices
 */

/**
 * Chooses KMS `MessageType` automatically.
 *
 * Heuristic:
 * - If the algorithm contains SHA_256/384/512 and the message length equals the digest size (32/48/64),
 *   treat input as a precomputed digest (`DIGEST`); otherwise use `RAW`.
 *
 * @param message - The message to analyze
 * @param signingAlgorithm - The signing algorithm to use
 * @returns "RAW" or "DIGEST" based on the heuristic
 */
export function pickMessageType(
  message: Uint8Array,
  signingAlgorithm?: string
): "RAW" | "DIGEST" {
  const algo = String(signingAlgorithm ?? "").toUpperCase();
  const len = message.byteLength;

  if (algo.includes("SHA_256") && len === 32) return "DIGEST";
  if (algo.includes("SHA_384") && len === 48) return "DIGEST";
  if (algo.includes("SHA_512") && len === 64) return "DIGEST";

  return "RAW";
}
