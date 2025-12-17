/**
 * @fileoverview SendNotificationUseCaseResult - Result type for SendNotificationUseCase
 * @summary Defines the result structure for SendNotificationUseCase
 * @description This interface represents the result of the SendNotificationUseCase,
 * including the notification entity, message ID, and sent timestamp.
 */

import type { Notification } from '../../entities/Notification';

/**
 * Result of sending a notification via SendNotificationUseCase
 */
export interface SendNotificationUseCaseResult {
  /** The notification entity that was created and sent */
  notification: Notification;
  /** Message ID from the notification provider */
  messageId: string;
  /** Timestamp when the notification was sent */
  sentAt: Date;
}

