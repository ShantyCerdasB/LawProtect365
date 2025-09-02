/**
 * @file IdempotencyRunnerOptions.schema.ts
 * @summary Zod schema for validating idempotency runner options
 * @description Provides validation for idempotency runner configuration
 */

import { z } from "zod";

/** Schema for validating idempotency runner options. */
export const IdempotencyRunnerOptionsSchema = z.object({
  /** Default TTL (seconds) used when none is provided per run. */
  defaultTtlSeconds: z.number().int().positive("Default TTL must be a positive integer").optional(),
});

/** Type inference from the schema. */
export type IdempotencyRunnerOptionsSchema = z.infer<typeof IdempotencyRunnerOptionsSchema>;
