/**
 * @fileoverview RetryNotificationResult - Result type for RetryNotificationUseCase
 * @summary Defines the result structure for retry notification operations
 * @description This interface represents the result of retrying a failed notification,
 * including the notification entity, success status, and optional message details.
 */

import type { Notification } from '../../entities/Notification';

/**
 * Result of retrying a notification
 */
export interface RetryNotificationResult {
  /** The notification entity that was retried */
  notification: Notification;
  /** Whether the retry was successful */
  success: boolean;
  /** Message ID from the notification provider (if successful) */
  messageId?: string;
  /** Timestamp when the notification was sent (if successful) */
  sentAt?: Date;
}

