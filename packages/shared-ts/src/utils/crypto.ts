/**
 * @file crypto.ts
 * @summary Cryptographic utilities for hashing, HMAC, base64url and constant-time comparison.
 *
 * @description
 * Provides a minimal crypto facade around Node’s `crypto` module:
 * - SHA-256 and HMAC helpers
 * - Base64url encoding with fallback
 * - Random token generator
 * - Constant-time equality check for strings
 */

import * as crypto from "node:crypto";

/**
 * Computes a SHA-256 hash and returns a hex string.
 *
 * @param data - Input string or Buffer.
 * @returns Hex-encoded SHA-256 digest.
 */
export const sha256Hex = (data: string | Buffer): string =>
  crypto.createHash("sha256").update(data).digest("hex");

/**
 * Computes an HMAC using SHA-256 and returns a hex string.
 *
 * @param key - Secret key (string or Buffer).
 * @param data - Input data (string or Buffer).
 * @returns Hex-encoded HMAC digest.
 */
export const hmacSha256Hex = (key: string | Buffer, data: string | Buffer): string =>
  crypto.createHmac("sha256", key).update(data).digest("hex");

/**
 * Base64url encodes a Buffer without regex replacements.
 *
 * @remarks
 * - Uses native `"base64url"` encoding if supported.
 * - Otherwise converts from `"base64"`, replacing characters and stripping `=` padding.
 *
 * @param buf - Input Buffer to encode.
 * @returns Base64url-encoded string.
 */
export const toBase64Url = (buf: Buffer): string => {
  if (Buffer.isEncoding?.("base64url")) {
    return buf.toString("base64url");
  }
  const base64 = buf.toString("base64");
  let out = base64.replaceAll("+", "-").replaceAll("/", "_");
  let end = out.length - 1;
  while (end >= 0 && out[end] === "=") end--;
  return out.slice(0, end + 1);
};

/**
 * Generates cryptographically strong random bytes and returns a base64url string.
 *
 * @param bytes - Number of random bytes to generate (floored, clamped to ≥ 1). Default is `32`.
 * @returns Base64url-encoded random token.
 */
export const randomBase64Url = (bytes = 32): string => {
  const nRaw = Number(bytes);
  const n = Number.isFinite(nRaw) ? Math.floor(nRaw) : 32;
  const size = Math.max(1, n);
  return toBase64Url(crypto.randomBytes(size));
};

/**
 * Constant-time equality comparison for strings.
 *
 * @remarks
 * - Converts inputs to Buffers.
 * - Returns `false` if the lengths differ.
 * - Uses Node’s `crypto.timingSafeEqual` for comparison.
 *
 * @param a - First string.
 * @param b - Second string.
 * @returns True if equal, false otherwise.
 */
export const timingSafeEqual = (a: string, b: string): boolean => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
};

/**
 * Re-exports Node’s `createHash` function.
 *
 * @example
 * ```ts
 * const digest = createHash("sha256").update("data").digest("hex");
 * ```
 */
export const createHash = crypto.createHash;
