/**
 * @fileoverview ProcessNotificationResult - Result type for notification processing
 * @summary Defines the output structure for notification processing operations
 * @description This type represents the result of processing a notification event,
 * including success status, processing statistics, and detailed notification counts by channel.
 */

/**
 * Result of processing a notification event
 */
export interface ProcessNotificationResult {
  /** Whether the processing was successful */
  success: boolean;
  /** Number of notifications processed successfully */
  processedCount: number;
  /** Number of notifications that failed */
  failedCount: number;
  /** Request ID for tracking */
  requestId: string;
  /** Detailed counts by notification channel */
  notificationsSent?: {
    email?: number;
    sms?: number;
    push?: number;
  };
  /** Detailed failure counts by channel */
  notificationsFailed?: {
    email?: number;
    sms?: number;
    push?: number;
  };
  /** Optional error details */
  errors?: Array<{
    channel: string;
    error: string;
  }>;
}

