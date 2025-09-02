/**
 * @file RateLimitUsage.schema.ts
 * @summary Zod schema for RateLimitUsage validation
 * @description Validates rate limit usage statistics
 */

import { z } from "zod";

/**
 * Zod schema for RateLimitUsage validation.
 */
export const RateLimitUsageSchema = z.object({
  /** Current usage count in the window. */
  currentUsage: z.number().int().nonnegative("Current usage must be non-negative"),
  /** Maximum allowed requests in the window. */
  maxRequests: z.number().int().positive("Max requests must be a positive integer"),
  /** Window start timestamp (epoch seconds). */
  windowStart: z.number().int().nonnegative("Window start must be non-negative"),
  /** Window end timestamp (epoch seconds). */
  windowEnd: z.number().int().nonnegative("Window end must be non-negative"),
  /** Time until window resets (seconds). */
  resetInSeconds: z.number().int().nonnegative("Reset time must be non-negative"),
});

/**
 * Type inference from the schema.
 */
export type RateLimitUsageSchema = z.infer<typeof RateLimitUsageSchema>; 