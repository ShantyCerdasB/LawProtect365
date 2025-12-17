/**
 * @fileoverview ApnsMessage - Types for Apple Push Notification Service messages
 * @summary Type definitions for APNS message structure
 * @description Defines the structure for APNS messages including alert,
 * badge, sound, and custom data payload.
 */

/**
 * APNS alert structure
 */
export interface ApnsAlert {
  title?: string;
  body: string;
  'title-loc-key'?: string;
  'title-loc-args'?: string[];
  'action-loc-key'?: string;
  'loc-key'?: string;
  'loc-args'?: string[];
  'launch-image'?: string;
}

/**
 * APNS aps payload structure
 */
export interface ApnsAps {
  alert?: string | ApnsAlert;
  badge?: number;
  sound?: string;
  'content-available'?: number;
  category?: string;
  'thread-id'?: string;
  'mutable-content'?: number;
}

/**
 * APNS notification structure
 */
export interface ApnsNotification {
  deviceToken: string;
  aps: ApnsAps;
  data?: Record<string, unknown>;
}

/**
 * APNS send result
 */
export interface ApnsSendResult {
  sent: boolean;
  device: string;
  status?: string;
  response?: {
    status: string;
    reason?: string;
  };
}

