/**
 * @file OutboxWorkerOptions.schema.ts
 * @summary Zod schema for OutboxWorkerOptions validation
 * @description Validates configuration options for the outbox worker
 */

import { z } from "zod";

/**
 * Zod schema for OutboxWorkerOptions.
 */
export const OutboxWorkerOptionsSchema = z.object({
  /** Maximum number of events to process in a single batch. */
  maxBatchSize: z.number().int().positive().max(100).optional().default(10),
  
  /** Maximum time to wait before processing a batch (milliseconds). */
  maxWaitTimeMs: z.number().int().positive().max(30000).optional().default(5000),
  
  /** Maximum number of retry attempts for failed events. */
  maxRetries: z.number().int().positive().max(10).optional().default(3),
  
  /** Delay between retry attempts (milliseconds). */
  retryDelayMs: z.number().int().positive().max(10000).optional().default(1000),
  
  /** Whether to enable debug logging. */
  debug: z.boolean().optional().default(false),
});

/**
 * Type inference from the schema.
 */
export type OutboxWorkerOptionsSchemaType = z.infer<typeof OutboxWorkerOptionsSchema>;
