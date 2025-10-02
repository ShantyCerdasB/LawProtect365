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
 * Computes a SHA-256 hash and returns a hex-encoded string.
 * 
 * @description
 * Creates a cryptographic hash of the input data using the SHA-256 algorithm.
 * The result is returned as a lowercase hexadecimal string, which is commonly
 * used for checksums, digital signatures, and data integrity verification.
 * 
 * @param data - Input data to hash (string or Buffer).
 * @returns Hex-encoded SHA-256 digest (64 characters).
 * 
 * @example
 * ```ts
 * const hash = sha256Hex("hello world");
 * // Returns "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
 * 
 * const bufferHash = sha256Hex(Buffer.from("hello world"));
 * // Returns the same hash as above
 * ```
 * 
 * @security
 * - Uses SHA-256, a cryptographically secure hash function
 * - Resistant to collision attacks and preimage attacks
 * - Suitable for data integrity and digital signatures
 */
export const sha256Hex = (data: string | Buffer): string =>
  crypto.createHash("sha256").update(data).digest("hex");

/**
 * Computes an HMAC using SHA-256 and returns a hex-encoded string.
 * 
 * @description
 * Creates a Hash-based Message Authentication Code (HMAC) using SHA-256 as the hash function.
 * HMAC provides both data integrity and authenticity verification by combining a secret key
 * with the data being authenticated. This is commonly used for API signatures, JWT tokens,
 * and secure communication protocols.
 * 
 * @param key - Secret key used for authentication (string or Buffer).
 * @param data - Data to authenticate (string or Buffer).
 * @returns Hex-encoded HMAC-SHA256 digest (64 characters).
 * 
 * @example
 * ```ts
 * const signature = hmacSha256Hex("secret-key", "message to sign");
 * // Returns a 64-character hex string
 * 
 * // Verify the signature
 * const expectedSignature = hmacSha256Hex("secret-key", "message to sign");
 * const isValid = signature === expectedSignature;
 * ```
 * 
 * @security
 * - Uses HMAC-SHA256, a cryptographically secure MAC
 * - Provides both integrity and authenticity guarantees
 * - Resistant to length extension attacks
 * - Keep the secret key secure and never expose it
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
 * Re-exports Node's `createHash` function.
 *
 * @example
 * ```ts
 * const digest = createHash("sha256").update("data").digest("hex");
 * ```
 */
export const createHash = crypto.createHash;

/**
 * @description Converts a base64url string (without padding) into a byte array.
 * Handles the conversion from base64url format (URL-safe base64) to binary data.
 *
 * @param {string} base64url - Base64url text without padding
 * @returns {Uint8Array} Byte array representation of the base64url data
 */
export function base64urlToBytes(base64url: string): Uint8Array {
  const padded = base64url + "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = padded.replaceAll("-", "+").replaceAll("_", "/");
  return Buffer.from(base64, "base64");
}

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

/**
 * Converts a hex string to Uint8Array
 * @param hex - Hex string to convert (e.g., "48656c6c6f")
 * @returns Uint8Array representation of the hex string
 * @throws Error if hex string is invalid or has odd length
 * @example
 * const bytes = hexToUint8Array("48656c6c6f"); // "Hello" in hex
 * console.log(bytes); // Uint8Array(5) [72, 101, 108, 108, 111]
 */
export function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error(`Invalid hex string: length must be even, got ${hex.length}`);
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const byte = Number.parseInt(hex.substring(i, i + 2), 16);
    if (Number.isNaN(byte)) {
      throw new TypeError(`Invalid hex character at position ${i}: ${hex.substring(i, i + 2)}`);
    }
    bytes[i / 2] = byte;
  }
  return bytes;
}

/**
 * Converts a Uint8Array to hex string
 * @param bytes - Uint8Array to convert
 * @returns Hex string representation (lowercase)
 * @example
 * const hex = uint8ArrayToHex(new Uint8Array([72, 101, 108, 108, 111]));
 * console.log(hex); // "48656c6c6f"
 */
export function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}