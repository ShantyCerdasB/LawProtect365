/**
 * @fileoverview NotificationRequest - Request structure for sending notifications
 * @summary Defines the structure for notification sending requests
 * @description This interface represents a notification request that will be sent
 * via email, SMS, or push channels. It encapsulates all necessary information
 * for notification delivery.
 */

import { NotificationChannel, RecipientType } from '@prisma/client';

/**
 * Notification request structure for sending
 */
export interface NotificationRequest {
  channel: NotificationChannel;
  recipient: string;
  recipientType: RecipientType;
  subject?: string;
  body: string;
  htmlBody?: string;
  metadata?: Record<string, unknown>;
  language?: string;
}

