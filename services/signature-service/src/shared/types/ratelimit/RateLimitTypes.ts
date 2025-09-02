/**
 * @file RateLimitTypes.ts
 * @summary Core types for rate limiting operations
 * @description Defines the core interfaces for rate limiting functionality
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
