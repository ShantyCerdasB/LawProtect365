/**
 * @fileoverview NotificationType enum - Types of notifications for envelope operations
 * @summary Enum for notification type options
 * @description Defines the available types of notifications that can be sent
 * for envelope operations, including reminders and resends.
 */

/**
 * Notification type options
 * 
 * Defines the available types of notifications that can be sent
 * for envelope operations, including reminders and resends.
 */
export enum NotificationType {
  /**
   * Reminder notification to signers who haven't signed yet
   */
  REMINDER = 'reminder',
  
  /**
   * Resend invitation to signers who haven't received or accessed their invitation
   */
  RESEND = 'resend'
}
