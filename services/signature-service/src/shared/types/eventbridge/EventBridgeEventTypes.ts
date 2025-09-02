/**
 * @file EventBridgeEventTypes.ts
 * @summary Additional event types for EventBridge operations
 * @description Defines comprehensive event structures and patterns
 */


import type { EventMetadata } from "./EventBridgeTypes";

/**
 * Standard event patterns for common operations.
 */
export const EVENT_PATTERNS = {
  CONSENT: {
    CREATED: "Consent.Created",
    UPDATED: "Consent.Updated",
    DELETED: "Consent.Deleted",
    DELEGATED: "Consent.Delegated",
    REVOKED: "Consent.Revoked",
  },
  ENVELOPE: {
    CREATED: "Envelope.Created",
    SENT: "Envelope.Sent",
    SIGNED: "Envelope.Signed",
    COMPLETED: "Envelope.Completed",
    CANCELLED: "Envelope.Cancelled",
  },
  PARTY: {
    CREATED: "Party.Created",
    UPDATED: "Party.Updated",
    VERIFIED: "Party.Verified",
  },
  AUDIT: {
    EVENT_RECORDED: "Audit.EventRecorded",
    ACCESS_ATTEMPTED: "Audit.AccessAttempted",
  },
} as const;

/**
 * Event source constants.
 */
export const EVENT_SOURCES = {
  SIGNATURE_SERVICE: "signature-service",
  CONSENT_SERVICE: "consent-service",
  PARTY_SERVICE: "party-service",
  AUDIT_SERVICE: "audit-service",
} as const;

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
 * Event validation result.
 */
export interface EventValidationResult {
  /** Whether the event is valid. */
  valid: boolean;
  /** Validation errors if any. */
  errors?: string[];
  /** Event metadata after validation. */
  metadata?: EventMetadata;
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
