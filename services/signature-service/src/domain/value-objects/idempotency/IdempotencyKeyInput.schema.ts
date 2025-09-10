/**
 * @file IdempotencyKeyInput.schema.ts
 * @summary Zod schema for validating idempotency key input
 * @description Provides validation for idempotency key generation parameters
 */

import { z } from "zod";

/** Schema for validating idempotency key input. */
export const IdempotencyKeyInputSchema = z.object({
  /** HTTP method (e.g., GET, POST). */
  method: z.string().min(1, "HTTP method is required"),
  
  /** API route/path (as received). */
  path: z.string().min(1, "API path is required"),
  
  /** End user id. */
  userId: z.string().min(1, "User ID is required"),
  
  /** Normalized query parameters object (or null). */
  query: z.record(z.unknown()).nullable(),
  
  /** Normalized JSON body (or null). */
  body: z.record(z.unknown()).nullable(),
  
  /** Optional logical scope (service/feature). */
  scope: z.string().optional()
});

/** Type inference from the schema. */
export type IdempotencyKeyInputSchema = z.infer<typeof IdempotencyKeyInputSchema>;
