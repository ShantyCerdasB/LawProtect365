/**
 * @file RateLimitStore.ts
 * @summary Store for rate limiting OTP requests.
 * @description
 * Tracks rate limit usage with sliding windows and TTL-based expiration.
 * Supports both per-minute and per-day rate limiting for OTP requests.
 */

/**
 * Rate limit window configuration.
 */
export interface RateLimitWindow {
  /** Window size in seconds. */
  windowSeconds: number;
  /** Maximum requests allowed in this window. */
  maxRequests: number;
  /** TTL for the rate limit record in seconds. */
  ttlSeconds: number;
}

/**
 * Rate limit usage statistics.
 */
export interface RateLimitUsage {
  /** Current usage count in the window. */
  currentUsage: number;
  /** Maximum allowed requests in the window. */
  maxRequests: number;
  /** Window start timestamp (epoch seconds). */
  windowStart: number;
  /** Window end timestamp (epoch seconds). */
  windowEnd: number;
  /** Time until window resets (seconds). */
  resetInSeconds: number;
}

/**
 * Store for rate limiting OTP requests.
 */
export interface RateLimitStore {
  /**
   * Increments the rate limit counter for a key and returns current usage.
   * @param key Rate limit key (e.g., "otp:envelopeId:partyId").
   * @param window Rate limit window configuration.
   * @returns Current usage statistics.
   * @throws Error when rate limit is exceeded.
   */
  incrementAndCheck(key: string, window: RateLimitWindow): Promise<RateLimitUsage>;
}
