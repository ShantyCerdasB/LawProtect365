/**
 * @file security.ts
 * @summary Security utilities for OTP (One-Time Password) generation and verification.
 * @description
 * Provides secure OTP functionality including:
 * - Numeric OTP generation with configurable length
 * - SHA-256 hashing for OTP storage
 * - Constant-time verification to prevent timing attacks
 */

import { randomInt } from "./math.js";
import { createHash, timingSafeEqual } from "./crypto.js";
import { NetworkSecurityContext } from "../types/security.js";

/**
 * Generates a cryptographically secure numeric OTP with fixed length.
 * 
 * @description
 * Creates a random numeric string of specified length using a secure random number generator.
 * The OTP is zero-padded to ensure consistent length and uses rejection sampling to avoid bias.
 * 
 * @param length - Number of digits in the OTP (1-12 inclusive).
 * @returns Zero-padded numeric string (e.g., "042913" for length 6).
 * @throws {Error} When length is not an integer, less than 1, or greater than 12.
 * 
 * @example
 * ```ts
 * const otp = generateNumericOtp(6); // Returns "123456" (example)
 * const shortOtp = generateNumericOtp(4); // Returns "0429" (example)
 * ```
 * 
 * @security
 * - Uses cryptographically secure random number generation
 * - Implements rejection sampling to prevent modulo bias
 * - Suitable for authentication and verification purposes
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
 * Hashes an OTP using SHA-256 and returns a base64url-encoded digest.
 * 
 * @description
 * Creates a cryptographic hash of the OTP for secure storage. The hash is deterministic,
 * meaning the same OTP will always produce the same hash. This function should be used
 * to hash OTPs before storing them in databases or other persistent storage.
 * 
 * @param otp - Plain OTP value to hash.
 * @returns Base64url-encoded SHA-256 digest (URL-safe base64 without padding).
 * 
 * @example
 * ```ts
 * const hash = hashOtp("123456");
 * // Returns something like "jZae727K08KaOmKSgOaGzww_XVqGr_PKEgIMkjrcbJI"
 * ```
 * 
 * @security
 * - Uses SHA-256 for cryptographic strength
 * - Returns base64url encoding (URL-safe, no padding)
 * - Deterministic: same input always produces same output
 */
export function hashOtp(otp: string): string {
  return createHash("sha256").update(otp, "utf8").digest("base64url");
}

/**
 * Verifies an OTP against a stored hash using constant-time comparison.
 * 
 * @description
 * Compares a user-provided OTP against a previously stored hash. This function uses
 * constant-time comparison to prevent timing attacks that could reveal information
 * about the stored hash or the verification process.
 * 
 * @param otp - Plain OTP value provided by the user for verification.
 * @param expectedBase64UrlSha256 - Previously stored base64url SHA-256 digest.
 * @returns True when the hash of the provided OTP matches the stored hash.
 * 
 * @example
 * ```ts
 * // Store the hash when OTP is generated
 * const otp = generateNumericOtp(6);
 * const hash = hashOtp(otp);
 * 
 * // Later, verify user input
 * const userInput = "123456";
 * const isValid = verifyOtp(userInput, hash);
 * ```
 * 
 * @security
 * - Uses constant-time comparison to prevent timing attacks
 * - Performs length check before comparison to avoid timing leaks
 * - Implements defense-in-depth with multiple security measures
 */
export function verifyOtp(otp: string, expectedBase64UrlSha256: string): boolean {
  const actual = hashOtp(otp);

  // Fast length check prevents leaking timing on different-length strings.
  if (actual.length !== expectedBase64UrlSha256.length) return false;

  // timingSafeEqual expects strings per our crypto facade; it does constant-time
  // comparison by converting to Buffers internally.
  return timingSafeEqual(actual, expectedBase64UrlSha256);
}

/**
 * Creates a NetworkSecurityContext from individual network parameters.
 * 
 * @description
 * Helper function to construct a NetworkSecurityContext object from individual
 * network security parameters. This is useful when converting legacy audit calls
 * that pass ipAddress, userAgent, and country as separate parameters into the
 * structured NetworkSecurityContext format required by the audit system.
 * 
 * @param ipAddress - IP address of the request origin
 * @param userAgent - User agent string from the request
 * @param country - Country code of the request origin
 * @returns NetworkSecurityContext object with the provided parameters
 * 
 * @example
 * ```ts
 * const context = createNetworkSecurityContext(
 *   "192.168.1.1",
 *   "Mozilla/5.0...",
 *   "US"
 * );
 * // Returns { ipAddress: "192.168.1.1", userAgent: "Mozilla/5.0...", country: "US" }
 * ```
 */
export function createNetworkSecurityContext(
  ipAddress?: string,
  userAgent?: string,
  country?: string
): NetworkSecurityContext {
  return {
    ipAddress,
    userAgent,
    country
  };
}
