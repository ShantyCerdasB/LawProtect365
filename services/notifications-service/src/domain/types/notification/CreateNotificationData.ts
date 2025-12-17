/**
 * @fileoverview CreateNotificationData - Data structure for creating Notification entities
 * @summary Defines the structure for notification creation requests
 * @description This interface provides type safety for notification creation operations
 * in the EntityFactory, ensuring all required fields are provided.
 */

import { NotificationChannel, RecipientType } from '@prisma/client';

/**
 * Data structure for creating a Notification entity
 */
export interface CreateNotificationData {
  notificationId?: string;
  eventId?: string;
  eventType: string;
  channel: NotificationChannel;
  recipient: string;
  recipientType: RecipientType;
  subject?: string;
  body?: string;
  templateId?: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  envelopeId?: string;
  signerId?: string;
  maxRetries?: number;
}

