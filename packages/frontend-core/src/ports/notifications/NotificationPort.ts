/**
 * @fileoverview Notification Port - Interface for push and local notifications
 * @summary Platform-agnostic notification abstraction
 * @description Defines a contract for notifications across web (Web Notifications API)
 * and mobile (Push Notifications via FCM/APNS) platforms.
 */

/**
 * @description Represents a notification payload.
 */
export interface Notification {
  /**
   * @description Notification title.
   */
  title: string;
  /**
   * @description Notification body text.
   */
  body: string;
  /**
   * @description Optional custom data payload.
   */
  data?: Record<string, unknown>;
  /**
   * @description Optional notification image URL.
   */
  imageUrl?: string;
}

/**
 * @description Interface for notification operations.
 * Implementations should use platform-native notification APIs.
 */
export interface NotificationPort {
  /**
   * @description Requests permission to send notifications.
   * @returns Promise that resolves to true if permission is granted, false otherwise
   */
  requestPermission(): Promise<boolean>;

  /**
   * @description Shows a local notification.
   * @param title Notification title
   * @param body Notification body text
   * @param data Optional custom data payload
   * @returns Promise that resolves when notification is shown
   */
  showNotification(title: string, body: string, data?: Record<string, unknown>): Promise<void>;

  /**
   * @description Gets the push notification token for this device.
   * @returns Promise that resolves to the device token, or null if unavailable
   */
  getToken(): Promise<string | null>;

  /**
   * @description Adds a listener for incoming notifications.
   * @param callback Function to call when a notification is received
   * @returns Unsubscribe function to remove the listener
   */
  onNotification(callback: (notification: Notification) => void): () => void;
}

