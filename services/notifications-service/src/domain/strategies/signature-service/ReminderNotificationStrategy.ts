/**
 * @fileoverview ReminderNotificationStrategy - Strategy for processing REMINDER_NOTIFICATION events
 * @summary Handles reminder notification events
 * @description Processes REMINDER_NOTIFICATION events from signature-service and converts
 * them to email notification requests. Validates required fields and creates email notification
 * requests with translated subjects and reminder messages.
 */

import type { NotificationRequest } from '../../types/orchestrator';
import { SignatureServiceEventType, EventSource } from '../../enums';
import { eventValidationFailed } from '../../../notification-errors';
import { BaseEventProcessingStrategy } from '../BaseEventProcessingStrategy';
import { DEFAULT_REMINDER_COUNT, TranslationKeys } from '../../constants';

/**
 * Strategy for processing REMINDER_NOTIFICATION events
 * 
 * Follows Single Responsibility Principle by focusing exclusively on
 * processing REMINDER_NOTIFICATION events from signature-service.
 */
export class ReminderNotificationStrategy extends BaseEventProcessingStrategy {
  /**
   * @description Determines if this strategy can handle the given event
   * @param {string} eventType - Event type to check
   * @param {string} source - Event source to check
   * @returns {boolean} True if this strategy can handle the event
   */
  canHandle(eventType: string, source: string): boolean {
    return (
      source === EventSource.SIGNATURE_SERVICE &&
      eventType === SignatureServiceEventType.REMINDER_NOTIFICATION
    );
  }

  /**
   * @description Processes a REMINDER_NOTIFICATION event and returns notification requests
   * @param {Record<string, unknown>} payload - Event payload containing message, reminderCount, and signerEmail
   * @param {Record<string, unknown>} [metadata] - Optional event metadata
   * @returns {Promise<NotificationRequest[]>} Array containing a single email notification request, or empty if signerEmail is missing
   * @throws {eventValidationFailed} When message is missing
   */
  async process(
    payload: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<NotificationRequest[]> {
    const message = this.extractString(payload, 'message');
    const reminderCount = this.extractNumber(payload, 'reminderCount') || DEFAULT_REMINDER_COUNT;
    const signerEmail = this.extractString(payload, 'signerEmail');
    const language = this.extractLanguage(payload, metadata);

    if (!message) {
      throw eventValidationFailed({ field: 'message', value: message });
    }

    if (!signerEmail) {
      return [];
    }

    const subject = this.translate(
      TranslationKeys.reminderNotification.subject,
      language,
      { reminderCount }
    );

    return [
      this.createEmailNotificationRequest(
        signerEmail,
        subject || `Reminder: Please Sign Document (Reminder #${reminderCount})`,
        message,
        payload,
        language
      )
    ];
  }
}

