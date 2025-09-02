/**
 * @file EventBusPortAdapterOptions.schema.ts
 * @summary Zod schema for validating EventBus port adapter options
 * @description Provides validation for EventBridge bus adapter configuration
 */

import { z } from "zod";

/** Schema for validating EventBus port adapter options. */
export const EventBusPortAdapterOptionsSchema = z.object({
  /** Name or ARN of the EventBridge event bus. */
  busName: z.string().min(1, "Event bus name is required"),
  
  /** Logical event source. */
  source: z.string().min(1, "Event source is required"),
  
  /** Client that satisfies EventBridgeClientPort. */
  client: z.any(), // Will be validated at runtime
  
  /** Optional static resources to attach to each entry. */
  resources: z.array(z.string()).optional(),
  
  /** Max entries per putEvents call (1-10). */
  maxEntriesPerBatch: z.number().int().min(1).max(10).optional().default(10),
  
  /** Optional retry configuration for failed operations. */
  retryConfig: z.object({
    maxAttempts: z.number().int().positive("Max attempts must be a positive integer"),
    baseDelayMs: z.number().int().positive("Base delay must be a positive integer"),
    maxDelayMs: z.number().int().positive("Max delay must be a positive integer"),
  }).optional(),
});

/** Type inference from the schema. */
export type EventBusPortAdapterOptionsSchema = z.infer<typeof EventBusPortAdapterOptionsSchema>;
