/**
 * @fileoverview UserRegisteredStrategy - Strategy for processing UserRegistered events
 * @summary Handles user registration notifications
 * @description Processes UserRegistered events from auth-service and converts
 * them to email notification requests. Creates welcome emails for newly registered users
 * with personalized messages based on user information.
 */

import type { NotificationRequest } from '../../types/orchestrator';
import { AuthServiceEventType, EventSource } from '../../enums';
import { BaseEventProcessingStrategy } from '../BaseEventProcessingStrategy';
import { DEFAULT_USER_NAME, TranslationKeys } from '../../constants';

/**
 * Strategy for processing UserRegistered events
 * 
 * Follows Single Responsibility Principle by focusing exclusively on
 * processing UserRegistered events from auth-service.
 */
export class UserRegisteredStrategy extends BaseEventProcessingStrategy {
  /**
   * @description Determines if this strategy can handle the given event
   * @param {string} eventType - Event type to check
   * @param {string} source - Event source to check
   * @returns {boolean} True if this strategy can handle the event
   */
  canHandle(eventType: string, source: string): boolean {
    return (
      source === EventSource.AUTH_SERVICE &&
      eventType === AuthServiceEventType.USER_REGISTERED
    );
  }

  /**
   * @description Processes a UserRegistered event and returns notification requests
   * @param {Record<string, unknown>} payload - Event payload containing email, firstName, and lastName
   * @param {Record<string, unknown>} [metadata] - Optional event metadata
   * @returns {Promise<NotificationRequest[]>} Array containing a single email notification request, or empty if email is invalid
   */
  async process(
    payload: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<NotificationRequest[]> {
    const email = this.extractEmail(payload);
    if (!email) {
      return [];
    }

    const firstName = this.extractString(payload, 'firstName') || DEFAULT_USER_NAME;
    const lastName = this.extractString(payload, 'lastName') || '';
    const language = this.extractLanguage(payload, metadata);

    const subject = this.translate(
      TranslationKeys.userRegistered.subject,
      language
    );

    const body = this.translate(
      TranslationKeys.userRegistered.body,
      language,
      { firstName, lastName: lastName ? ` ${lastName}` : '' }
    );

    return [
      this.createEmailNotificationRequest(
        email,
        subject || 'Welcome to LawProtect365',
        body || `Welcome ${firstName}${lastName ? ` ${lastName}` : ''}! Your account has been successfully created.`,
        { eventType: AuthServiceEventType.USER_REGISTERED, ...payload },
        language
      )
    ];
  }
}

