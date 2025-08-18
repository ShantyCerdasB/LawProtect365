/**
 * Cryptographic utilities for hashing, HMAC, base64url and constant-time compare.
 * Uses Node's crypto module only.
 */

import * as crypto from "node:crypto";

/** Computes SHA-256 hash and returns hex string. */
export const sha256Hex = (data: string | Buffer): string =>
  crypto.createHash("sha256").update(data).digest("hex");

/** Computes HMAC-SHA256 and returns hex string. */
export const hmacSha256Hex = (key: string | Buffer, data: string | Buffer): string =>
  crypto.createHmac("sha256", key).update(data).digest("hex");

/** Base64url encodes a Buffer. */
export const toBase64Url = (buf: Buffer): string =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

/** Generates cryptographically-strong random bytes as base64url. */
export const randomBase64Url = (bytes = 32): string =>
  toBase64Url(crypto.randomBytes(bytes));

/** Constant-time equality comparison for strings. */
export const timingSafeEqual = (a: string, b: string): boolean => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
};
