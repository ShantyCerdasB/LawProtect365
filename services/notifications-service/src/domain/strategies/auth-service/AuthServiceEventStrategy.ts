/**
 * @fileoverview AuthServiceEventStrategy - Generic strategy for auth service events
 * @summary Handles generic auth service event notifications
 * @description Processes generic auth service events and converts them to email notification requests.
 * This is a fallback strategy for auth events that don't have specific strategies. It handles
 * multiple event types through configuration and provides default messages when translations
 * are not available.
 */

import type { NotificationRequest } from '../../types/orchestrator';
import { EventSource } from '../../enums';
import { BaseEventProcessingStrategy } from '../BaseEventProcessingStrategy';
import type { TranslationService } from '../../../services/i18n';
import {
  DEFAULT_USER_NAME,
  DEFAULT_EVENT_TYPE,
  DEFAULT_ACCOUNT_NOTIFICATION_SUBJECT,
  DEFAULT_AUTH_SUBJECTS,
  getDefaultAuthBody
} from '../../constants';

/**
 * Generic strategy for processing auth service events
 * 
 * Follows Single Responsibility Principle by focusing exclusively on
 * processing generic auth service events that don't have dedicated strategies.
 * Uses configuration to determine which event types it can handle.
 */
export class AuthServiceEventStrategy extends BaseEventProcessingStrategy {
  /**
   * @description Creates a new AuthServiceEventStrategy instance
   * @param {TranslationService} translationService - Translation service for i18n
   * @param {string[]} supportedEventTypes - Array of event types this strategy can handle
   */
  constructor(
    translationService: TranslationService,
    private readonly supportedEventTypes: string[]
  ) {
    super(translationService);
  }

  /**
   * @description Determines if this strategy can handle the given event
   * @param {string} eventType - Event type to check
   * @param {string} source - Event source to check
   * @returns {boolean} True if this strategy can handle the event
   */
  canHandle(eventType: string, source: string): boolean {
    return (
      source === EventSource.AUTH_SERVICE &&
      this.supportedEventTypes.includes(eventType)
    );
  }

  /**
   * @description Processes an auth service event and returns notification requests
   * @param {Record<string, unknown>} payload - Event payload containing email, firstName, and event-specific data
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

    const eventType = this.extractString(metadata || {}, 'eventType') || 
                      this.extractString(payload, 'type') || 
                      DEFAULT_EVENT_TYPE;
    const firstName = this.extractString(payload, 'firstName') || DEFAULT_USER_NAME;
    const language = this.extractLanguage(payload, metadata);

    const subject = this.getSubject(eventType, language);
    const body = this.getBody(eventType, payload, language, firstName);

    return [
      this.createEmailNotificationRequest(
        email,
        subject,
        body,
        { eventType, ...payload },
        language
      )
    ];
  }

  /**
   * @description Gets the subject for an event type, using translation or default
   * @param {string} eventType - Event type
   * @param {string} language - Language code
   * @returns {string} Subject line for the notification
   */
  private getSubject(eventType: string, language: string): string {
    const translationKey = this.getTranslationKey(eventType, 'subject');
    const subject = this.translate(translationKey, language);
    
    if (subject !== translationKey) {
      return subject;
    }

    return DEFAULT_AUTH_SUBJECTS[eventType] || DEFAULT_ACCOUNT_NOTIFICATION_SUBJECT;
  }

  /**
   * @description Gets the body message for an event type, using translation or default
   * @param {string} eventType - Event type
   * @param {Record<string, unknown>} payload - Event payload
   * @param {string} language - Language code
   * @param {string} firstName - User's first name
   * @returns {string} Body message for the notification
   */
  private getBody(
    eventType: string,
    payload: Record<string, unknown>,
    language: string,
    firstName: string
  ): string {
    const translationKey = this.getTranslationKey(eventType, 'body');
    const body = this.translate(translationKey, language, { ...payload, firstName });
    
    if (body !== translationKey) {
      return body;
    }

    return getDefaultAuthBody(eventType, firstName, payload);
  }

  /**
   * @description Builds translation key for an event type and message part
   * @param {string} eventType - Event type
   * @param {'subject' | 'body'} part - Message part (subject or body)
   * @returns {string} Translation key
   */
  private getTranslationKey(eventType: string, part: 'subject' | 'body'): string {
    return `notifications.${eventType.toLowerCase()}.${part}`;
  }
}

