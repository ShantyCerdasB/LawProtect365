/**
 * @fileoverview SendNotificationResult - Result type for notification delivery
 * @summary Defines the result structure for notification delivery operations
 * @description This interface represents the result of sending a notification,
 * including the message ID from the provider and the timestamp when it was sent.
 */

/**
 * Result of sending a notification
 */
export interface SendNotificationResult {
  /** Message ID from the notification provider (SES, Pinpoint, FCM, APNS) */
  messageId: string;
  /** Timestamp when the notification was sent */
  sentAt: Date;
}

