/**
 * @fileoverview FcmMessage - Types for Firebase Cloud Messaging messages
 * @summary Type definitions for FCM message structure
 * @description Defines the structure for FCM messages including notification
 * payload, data payload, and platform-specific options.
 */

/**
 * FCM notification payload (displayed to user)
 */
export interface FcmNotification {
  title: string;
  body: string;
  imageUrl?: string;
  sound?: string;
  badge?: string;
}

/**
 * FCM data payload (custom key-value pairs)
 */
export interface FcmData {
  [key: string]: string;
}

/**
 * FCM message structure
 */
export interface FcmMessage {
  token: string;
  notification?: FcmNotification;
  data?: FcmData;
  android?: {
    priority?: 'normal' | 'high';
    ttl?: number;
    collapseKey?: string;
  };
  apns?: {
    headers?: {
      'apns-priority'?: string;
      'apns-expiration'?: string;
    };
    payload?: {
      aps?: {
        badge?: number;
        sound?: string;
        'content-available'?: number;
      };
    };
  };
}

/**
 * FCM send result
 */
export interface FcmSendResult {
  messageId: string;
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

