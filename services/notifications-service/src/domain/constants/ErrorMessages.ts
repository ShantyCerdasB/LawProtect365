/**
 * @fileoverview ErrorMessages - Error message constants for notifications
 * @summary Centralized error messages to avoid hardcoded strings
 * @description Provides error message constants used throughout the notification
 * service for consistent error reporting.
 */

/**
 * Error message when email notifications are disabled
 */
export const ERROR_EMAIL_DISABLED = 'Email notifications are disabled' as const;

/**
 * Error message when SMS notifications are disabled
 */
export const ERROR_SMS_DISABLED = 'SMS notifications are disabled' as const;

/**
 * Error message when push notifications are disabled
 */
export const ERROR_PUSH_DISABLED = 'Push notifications are disabled' as const;

/**
 * Error message template for unsupported notification channel
 */
export const ERROR_UNSUPPORTED_CHANNEL = (channel: string): string =>
  `Unsupported notification channel: ${channel}`;

