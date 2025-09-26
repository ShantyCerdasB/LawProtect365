/**
 * @fileoverview Notification Defaults Enum - Centralized notification message constants
 * @summary Enum containing default notification messages to avoid hardcoded strings
 * @description Provides centralized default messages for all notification types
 */

/**
 * Default notification messages for signature service
 */
export enum NotificationDefaults {
  INVITE_MESSAGE = 'You have been invited to sign a document',
  VIEWER_MESSAGE = 'You have been granted view access to a document',
  REMINDER_MESSAGE = 'Please sign the document'
}
