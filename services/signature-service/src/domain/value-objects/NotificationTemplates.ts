/**
 * @fileoverview Notification Templates - Centralized notification message templates
 * @summary Provides default notification messages to avoid scattering hardcoded strings
 * @description Centralizes default messages used in notifications across the signature service
 */

import { NotificationDefaults } from '../../domain/enums/NotificationDefaults';

/**
 * Notification message templates for the signature service
 * Centralizes default messages to avoid scattering hardcoded strings
 */
export class NotificationTemplates {
  /**
   * Default invitation message for signers
   * @returns Default message text
   * @example
   * const msg = NotificationTemplates.defaultInviteMessage();
   */
  static defaultInviteMessage(): string {
    return NotificationDefaults.INVITE_MESSAGE;
  }

  /**
   * Default viewer invitation message
   * @returns Default message text
   * @example
   * const msg = NotificationTemplates.defaultViewerMessage();
   */
  static defaultViewerMessage(): string {
    return NotificationDefaults.VIEWER_MESSAGE;
  }

  /**
   * Default reminder message
   * @returns Default message text
   * @example
   * const msg = NotificationTemplates.defaultReminderMessage();
   */
  static defaultReminderMessage(): string {
    return NotificationDefaults.REMINDER_MESSAGE;
  }
}
