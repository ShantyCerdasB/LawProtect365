/**
 * @fileoverview NotificationData - Data transfer object for Notification persistence
 * @summary Defines the structure for notification data in repository operations
 * @description This interface represents the notification data structure used for
 * persistence operations. It maps directly to the Prisma Notification model.
 */
export interface NotificationData {
  id: string;
  notificationId: string;
  eventId?: string;
  eventType: string;
  channel: string;
  recipient: string;
  recipientType: string;
  status: string;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  bouncedAt?: Date;
  errorMessage?: string;
  errorCode?: string;
  retryCount: number;
  maxRetries: number;
  subject?: string;
  body?: string;
  templateId?: string;
  metadata?: Record<string, unknown>;
  providerMessageId?: string;
  providerResponse?: Record<string, unknown>;
  userId?: string;
  envelopeId?: string;
  signerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

