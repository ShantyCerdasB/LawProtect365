/**
 * @fileoverview NotificationSpec - Query specification for Notification queries
 * @summary Defines filter criteria for querying notifications
 * @description This interface provides type-safe query specifications for filtering
 * and searching notification entities in the repository layer.
 */
export interface NotificationSpec {
  status?: string;
  channel?: string;
  recipient?: string;
  eventType?: string;
  userId?: string;
  envelopeId?: string;
  signerId?: string;
  eventId?: string;
  notificationId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  sentAfter?: Date;
  sentBefore?: Date;
}

