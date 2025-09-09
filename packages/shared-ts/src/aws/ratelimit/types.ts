/**
 * @file types.ts
 * @summary Rate limit types for DynamoDB implementation
 * @description Types for DynamoDB rate limiting implementation
 */

export const RATE_LIMIT_ENTITY = "RateLimit";

export interface DdbRateLimitItem {
  pk: string;
  sk: string;
  type: "RateLimit";
  rateLimitKey: string;
  windowStart: number;
  windowEnd: number;
  currentUsage: number;
  maxRequests: number;
  createdAt: string;
  updatedAt: string;
  ttl: number;
}





