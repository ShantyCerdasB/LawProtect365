/**
 * @file EventBridgeConstants.ts
 * @summary Constants and patterns for EventBridge operations
 * @description Defines standard event patterns and sources
 */

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
 * Default retry configuration for EventBridge operations.
 */
export const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
} as const;

/**
 * Default batch configuration for EventBridge operations.
 */
export const DEFAULT_BATCH_CONFIG = {
  maxSize: 10,
  maxDelayMs: 5000,
} as const;
