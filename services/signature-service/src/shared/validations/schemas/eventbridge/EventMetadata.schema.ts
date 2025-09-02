/**
 * @file EventMetadata.schema.ts
 * @summary Zod schema for validating EventBridge event metadata
 * @description Provides comprehensive validation for EventBridge event publishing
 */

import { z } from "zod";

/** Schema for validating EventBridge event metadata. */
export const EventMetadataSchema = z.object({
  /** Event source identifier. */
  source: z.string().min(1, "Event source is required"),
  
  /** Event type/category. */
  detailType: z.string().min(1, "Event detail type is required"),
  
  /** Event payload data. */
  detail: z.record(z.unknown()),
  
  /** Optional event bus name or ARN. */
  eventBusName: z.string().optional(),
  
  /** Optional event time. */
  time: z.date().optional(),
  
  /** Optional AWS region. */
  region: z.string().optional(),
  
  /** Optional resource ARNs for routing. */
  resources: z.array(z.string()).optional(),
  
  /** Optional trace header for distributed tracing. */
  traceHeader: z.string().optional(),
});

/** Type inference from the schema. */
export type EventMetadataSchema = z.infer<typeof EventMetadataSchema>;
