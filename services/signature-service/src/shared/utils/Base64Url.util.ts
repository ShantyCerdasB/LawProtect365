/**
 * @file Base64Url.util.ts
 * @description Utilities for base64url encoding and decoding operations.
 * Provides functions for converting between base64url format and binary data.
 */

/**
 * @file Base64Url.util.ts
 * @summary Utilities for base64url conversions.
 */

/**
 * @description Converts a base64url string (without padding) into a byte array.
 * Handles the conversion from base64url format (URL-safe base64) to binary data.
 *
 * @param {string} base64url - Base64url text without padding
 * @returns {Uint8Array} Byte array representation of the base64url data
 */
export function base64urlToBytes(base64url: string): Uint8Array {
  const padded = base64url + "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64");
}
