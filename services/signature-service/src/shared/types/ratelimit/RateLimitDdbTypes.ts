/**
 * @file RateLimitDdbTypes.ts
 * @summary DynamoDB-specific types for rate limiting
 * @description Defines the DynamoDB item structure for rate limit records
 */

/**
 * DynamoDB item structure for rate limit records.
 */
export interface DdbRateLimitItem {
  /** Partition key: "RATE_LIMIT#<key>" */
  pk: string;
  /** Sort key: "WINDOW#<windowStart>" */
  sk: string;
  /** Entity type marker */
  type: "RateLimit";
  /** Rate limit key identifier */
  rateLimitKey: string;
  /** Window start timestamp (epoch seconds) */
  windowStart: number;
  /** Window end timestamp (epoch seconds) */
  windowEnd: number;
  /** Current usage count in the window */
  currentUsage: number;
  /** Maximum allowed requests in the window */
  maxRequests: number;
  /** Creation timestamp (ISO-8601) */
  createdAt: string;
  /** Last update timestamp (ISO-8601) */
  updatedAt: string;
  /** TTL timestamp (epoch seconds) */
  ttl: number;
}
