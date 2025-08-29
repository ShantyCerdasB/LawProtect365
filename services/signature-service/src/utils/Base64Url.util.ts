/**
 * @file Base64Url.util.ts
 * @summary Utilities for base64url conversions.
 */

/**
 * Converts a base64url string (no padding) into bytes.
 * @param base64url Base64url text without padding.
 */
export function base64urlToBytes(base64url: string): Uint8Array {
  const padded = base64url + "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64");
}
