/**
 * @fileoverview SendPushRequest - Request type for sending push notifications
 * @summary Defines the structure for push notification requests
 * @description Type definitions for push notification operations (FCM/APNS)
 */

/**
 * Request structure for sending a push notification
 */
import type { PushPriority } from '../../enums';

export interface SendPushRequest {
  deviceToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: string;
  priority?: PushPriority;
  metadata?: Record<string, unknown>;
}

/**
 * Result structure for push notification operations
 */
export interface SendPushResult {
  messageId: string;
  sentAt: Date;
  deviceToken: string;
}

