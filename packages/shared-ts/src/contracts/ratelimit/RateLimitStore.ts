/**
 * @file RateLimitStore.ts
 * @summary Contract for rate limiting store implementations
 * @description Defines the interface for rate limiting functionality
 */

// Rate limit types should be defined in shared-ts
// For now, we'll define them here
export interface RateLimitWindow {
  /** Window size in seconds. */
  windowSeconds: number;
  /** Maximum requests allowed in this window. */
  maxRequests: number;
  /** TTL for the rate limit record in seconds. */
  ttlSeconds: number;
}

export interface RateLimitUsage {
  currentUsage: number;
  maxRequests: number;
  windowStart: number;
  windowEnd: number;
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
   * @throws {TooManyRequestsError} If rate limit is exceeded.
   */
  incrementAndCheck(key: string, window: RateLimitWindow): Promise<RateLimitUsage>;
} 
