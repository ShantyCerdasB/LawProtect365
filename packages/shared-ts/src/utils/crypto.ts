/**
 * Cryptographic utilities for hashing, HMAC, base64url and constant-time compare.
 * Uses Node's crypto module only.
 * @remarks
 * - `toBase64Url` prefers native `"base64url"` and falls back to a regex-free conversion.
 * - `randomBase64Url` floors to an integer and clamps size to at least 1 byte.
 */

import * as crypto from "node:crypto";

/** Computes SHA-256 hash and returns hex string. */
export const sha256Hex = (data: string | Buffer): string =>
  crypto.createHash("sha256").update(data).digest("hex");

/** Computes HMAC-SHA256 and returns hex string. */
export const hmacSha256Hex = (key: string | Buffer, data: string | Buffer): string =>
  crypto.createHmac("sha256", key).update(data).digest("hex");

/**
 * Base64url encodes a Buffer without using regex-based global replacements.
 * Prefers native `"base64url"` when supported, otherwise converts from `"base64"`.
 */
export const toBase64Url = (buf: Buffer): string => {
  if (Buffer.isEncoding && Buffer.isEncoding("base64url")) {
    return buf.toString("base64url");
  }
  const base64 = buf.toString("base64");
  // String-only replacements to avoid regex backtracking.
  let out = base64.replaceAll("+", "-").replaceAll("/", "_");
  // Strip padding deterministically.
  let end = out.length - 1;
  while (end >= 0 && out[end] === "=") end--;
  return out.slice(0, end + 1);
};

/**
 * Generates cryptographically strong random bytes and returns base64url.
 * @param bytes Requested number of random bytes. Floored to an integer and clamped to ≥ 1. Default: 32.
 */
export const randomBase64Url = (bytes = 32): string => {
  const nRaw = Number(bytes);
  const n = Number.isFinite(nRaw) ? Math.floor(nRaw) : 32;
  const size = Math.max(1, n);
  return toBase64Url(crypto.randomBytes(size));
};

/** Constant-time equality comparison for strings (returns false for length mismatch). */
export const timingSafeEqual = (a: string, b: string): boolean => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
};
