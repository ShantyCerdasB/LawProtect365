/**
 * @file EventBridgeEventTypes.ts
 * @summary Additional event types for EventBridge operations
 * @description Defines comprehensive event structures and patterns
 */

// Re-export constants from domain enums
export { EVENT_PATTERNS, EVENT_SOURCES } from "../../../domain/values/enums";

/**
 * Event routing configuration.
 */
export interface EventRoutingConfig {
  /** Event bus name or ARN. */
  busName: string;
  /** Event source identifier. */
  source: string;
  /** Resource ARNs for routing patterns. */
  resources?: string[];
  /** Event detail type pattern. */
  detailType: string;
  /** Optional region for cross-region routing. */
  region?: string;
}

/**
 * Event publishing configuration.
 */
export interface EventPublishingConfig {
  /** Routing configuration. */
  routing: EventRoutingConfig;
  /** Retry configuration. */
  retry?: {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
  };
  /** Batch configuration. */
  batch?: {
    maxSize: number;
    maxDelayMs: number;
  };
  /** Dead letter queue configuration. */
  deadLetterQueue?: {
    arn: string;
    maxRetries: number;
  };
}

/**
 * Event processing result.
 */
export interface EventProcessingResult {
  /** Whether the event was processed successfully. */
  success: boolean;
  /** Event ID from EventBridge. */
  eventId?: string;
  /** Processing timestamp. */
  processedAt: Date;
  /** Error details if processing failed. */
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  /** Processing duration in milliseconds. */
  durationMs: number;
}
