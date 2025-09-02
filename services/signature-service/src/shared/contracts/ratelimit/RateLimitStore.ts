/**
 * @file RateLimitStore.ts
 * @summary Contract for rate limiting store implementations
 * @description Defines the interface for rate limiting functionality
 */

import type { RateLimitWindow, RateLimitUsage } from "../../types/ratelimit/RateLimitTypes";

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