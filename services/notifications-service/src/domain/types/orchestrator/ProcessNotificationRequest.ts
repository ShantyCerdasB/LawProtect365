/**
 * @fileoverview ProcessNotificationRequest - Request type for processing notifications
 * @summary Defines the input structure for notification processing
 * @description This type represents the request structure passed to the NotificationOrchestrator
 * when processing events from EventBridge. It encapsulates all necessary information
 * to process a notification event.
 */

/**
 * Request structure for processing a notification event
 */
export interface ProcessNotificationRequest {
  /** Unique event identifier from EventBridge */
  eventId: string;
  /** Event type (e.g., "ENVELOPE_INVITATION", "SIGNER_DECLINED") */
  eventType: string;
  /** Event source (e.g., "signature-service") */
  source: string;
  /** Event payload containing notification data */
  payload: Record<string, unknown>;
  /** Timestamp when the event occurred */
  occurredAt: Date;
  /** Optional metadata (account, region, resources) */
  metadata?: {
    account?: string;
    region?: string;
    resources?: string[];
    [key: string]: unknown;
  };
}

