/**
 * @file RateLimitWindow.schema.ts
 * @summary Zod schema for RateLimitWindow validation
 * @description Validates rate limit window configuration
 */

import { z } from "zod";

/**
 * Zod schema for RateLimitWindow validation.
 */
export const RateLimitWindowSchema = z.object({
  /** Window size in seconds. */
  windowSeconds: z.number().int().positive("Window size must be a positive integer"),
  /** Maximum requests allowed in this window. */
  maxRequests: z.number().int().positive("Max requests must be a positive integer"),
  /** TTL for the rate limit record in seconds. */
  ttlSeconds: z.number().int().positive("TTL must be a positive integer"),
});

/**
 * Type inference from the schema.
 */
export type RateLimitWindowSchema = z.infer<typeof RateLimitWindowSchema>; 