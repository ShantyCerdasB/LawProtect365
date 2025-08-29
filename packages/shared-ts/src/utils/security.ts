// packages/shared-ts/src/security/otp.ts

import { randomInt } from "./math.js";
import { createHash, timingSafeEqual } from "./crypto.js";

/**
 * Generate a numeric OTP with fixed length using a secure RNG.
 *
 * @param length - Number of digits (e.g., 6).
 * @returns Zero-padded numeric string (e.g., "042913").
 */
export function generateNumericOtp(length: number): string {
  if (!Number.isInteger(length) || length < 1 || length > 12) {
    throw new Error("Invalid OTP length");
  }
  const max = 10 ** length - 1;
  const n = randomInt(0, max);
  return n.toString().padStart(length, "0");
}

/**
 * Hash an OTP using SHA-256 and return a base64url-encoded digest.
 *
 * @param otp - Plain OTP value.
 * @returns Base64url-encoded SHA-256 digest.
 */
export function hashOtp(otp: string): string {
  return createHash("sha256").update(otp, "utf8").digest("base64url");
}

/**
 * Constant-time verification of an OTP against a stored hash (base64url).
 *
 * @param otp - Plain OTP value provided by the user.
 * @param expectedBase64UrlSha256 - Stored base64url SHA-256 digest.
 * @returns True when the hash of `otp` matches `expectedBase64UrlSha256`.
 */
export function verifyOtp(otp: string, expectedBase64UrlSha256: string): boolean {
  const actual = hashOtp(otp);

  // Fast length check prevents leaking timing on different-length strings.
  if (actual.length !== expectedBase64UrlSha256.length) return false;

  // timingSafeEqual expects strings per our crypto facade; it does constant-time
  // comparison by converting to Buffers internally.
  return timingSafeEqual(actual, expectedBase64UrlSha256);
}
