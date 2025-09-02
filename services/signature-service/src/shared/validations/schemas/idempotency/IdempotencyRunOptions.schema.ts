/**
 * @file IdempotencyRunOptions.schema.ts
 * @summary Zod schema for validating idempotency run options
 * @description Provides validation for individual idempotency run configuration
 */

import { z } from "zod";

/** Schema for validating idempotency run options. */
export const IdempotencyRunOptionsSchema = z.object({
  /** Idempotency key for this operation. */
  key: z.string().min(1, "Idempotency key is required"),
  
  /** TTL for the idempotency record in seconds. */
  ttlSeconds: z.number().int().positive("TTL must be a positive integer").optional(),
});

/** Type inference from the schema. */
export type IdempotencyRunOptionsSchema = z.infer<typeof IdempotencyRunOptionsSchema>;
