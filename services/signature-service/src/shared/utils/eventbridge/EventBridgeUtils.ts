/**
 * @file EventBridgeUtils.ts
 * @summary Utility functions for EventBridge operations
 * @description Provides helper functions for common EventBridge tasks
 */

import { EventBridgeEntry } from "@/shared/contracts/eventbridge/EventBridgeClientPort";
import type { EventMetadataSchema } from "@/shared/validations/schemas/eventbridge/EventMetadata.schema";



/**
 * Converts EventMetadata to EventBridgeEntry format.
 */
export function toEventBridgeEntry(metadata: EventMetadataSchema): EventBridgeEntry {
  return {
    Source: metadata.source,
    DetailType: metadata.detailType,
    Detail: JSON.stringify(metadata.detail),
    EventBusName: metadata.eventBusName,
    Time: metadata.time || new Date(),
    Region: metadata.region,
    Resources: metadata.resources,
    TraceHeader: metadata.traceHeader,
  };
}

/**
 * Creates a standardized event metadata object.
 */
export function createEventMetadata(
  source: string,
  detailType: string,
  detail: Record<string, unknown>,
  options?: Partial<EventMetadataSchema>
): EventMetadataSchema {
  return {
    source,
    detailType,
    detail,
    time: new Date(),
    ...options,
  };
}

/**
 * Validates event metadata for required fields.
 */
export function validateEventMetadata(metadata: EventMetadataSchema): string[] {
  const errors: string[] = [];
  
  if (!metadata.source || metadata.source.trim() === "") {
    errors.push("Event source is required");
  }
  
  if (!metadata.detailType || metadata.detailType.trim() === "") {
    errors.push("Event detail type is required");
  }
  
  if (!metadata.detail || typeof metadata.detail !== "object") {
    errors.push("Event detail must be a valid object");
  }
  
  return errors;
}

/**
 * Generates a unique event ID.
 */
export function generateEventId(): string {
  // Use crypto.randomUUID for secure random generation
  const crypto = require('crypto');
  const randomPart = crypto.randomUUID().replace(/-/g, '').substring(0, 9);
  return `evt_${Date.now()}_${randomPart}`;
}

/**
 * Formats event for logging.
 */
export function formatEventForLogging(metadata: EventMetadataSchema): string {
  return `[${metadata.source}] ${metadata.detailType} at ${metadata.time?.toISOString() || new Date().toISOString()}`;
}
