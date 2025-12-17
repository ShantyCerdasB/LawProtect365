/**
 * @fileoverview BaseEventProcessingStrategy - Base class for event processing strategies
 * @summary Provides common functionality for all event processing strategies
 * @description This abstract base class provides shared utility methods and common
 * logic for extracting data from event payloads and metadata. All strategies should
 * extend this class to reduce code duplication.
 */

import type { EventProcessingStrategy } from '../types/strategy';
import type { NotificationRequest } from '../types/orchestrator';
import { NotificationChannel, RecipientType } from '@prisma/client';
import { isEmail } from '@lawprotect/shared-ts';
import type { TranslationService } from '../../services/i18n';
import { PayloadExtractor } from '../utils';
import { DEFAULT_LANGUAGE } from '../constants';

/**
 * Base class for event processing strategies
 * 
 * Provides common functionality for extracting data from payloads and metadata,
 * creating notification requests, and handling translations.
 */
export abstract class BaseEventProcessingStrategy implements EventProcessingStrategy {
  constructor(protected readonly translationService: TranslationService) {}

  /**
   * @description Determines if this strategy can handle the given event
   * @param {string} eventType - Event type
   * @param {string} source - Event source
   * @returns {boolean} True if this strategy can handle the event
   */
  abstract canHandle(eventType: string, source: string): boolean;

  /**
   * @description Processes an event and returns notification requests
   * @param {Record<string, unknown>} payload - Event payload
   * @param {Record<string, unknown>} [metadata] - Optional event metadata
   * @returns {Promise<NotificationRequest[]>} Array of notification requests
   * @throws {Error} When payload is invalid or processing fails
   */
  abstract process(
    payload: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<NotificationRequest[]>;

  /**
   * @description Extracts string value from object
   * @param {Record<string, unknown>} obj - Object to extract from
   * @param {string} key - Key to extract
   * @returns {string | undefined} String value or undefined
   */
  protected extractString(obj: Record<string, unknown>, key: string): string | undefined {
    return PayloadExtractor.extractString(obj, key);
  }

  /**
   * @description Extracts number value from object
   * @param {Record<string, unknown>} obj - Object to extract from
   * @param {string} key - Key to extract
   * @returns {number | undefined} Number value or undefined
   */
  protected extractNumber(obj: Record<string, unknown>, key: string): number | undefined {
    return PayloadExtractor.extractNumber(obj, key);
  }

  /**
   * @description Extracts email from payload and validates it
   * @param {Record<string, unknown>} payload - Event payload
   * @returns {string | undefined} Valid email or undefined
   */
  protected extractEmail(payload: Record<string, unknown>): string | undefined {
    const email = this.extractString(payload, 'email');
    return email && isEmail(email) ? email : undefined;
  }

  /**
   * @description Extracts language from metadata or payload
   * @param {Record<string, unknown>} payload - Event payload
   * @param {Record<string, unknown>} [metadata] - Optional event metadata
   * @returns {string} Language code (default: DEFAULT_LANGUAGE)
   */
  protected extractLanguage(
    payload: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): string {
    return (
      this.extractString(metadata || {}, 'recipientLanguage') ||
      this.extractString(payload, 'recipientLanguage') ||
      this.extractString(payload, 'language') ||
      DEFAULT_LANGUAGE
    );
  }

  /**
   * @description Extracts payload metadata as a safe object
   * @param {Record<string, unknown>} payload - Event payload
   * @returns {Record<string, unknown>} Payload metadata or empty object
   */
  protected extractPayloadMetadata(payload: Record<string, unknown>): Record<string, unknown> {
    return PayloadExtractor.extractPayloadMetadata(payload);
  }

  /**
   * @description Creates an email notification request
   * @param {string} recipient - Email recipient
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   * @param {Record<string, unknown>} payload - Original event payload
   * @param {string} language - Language code
   * @returns {NotificationRequest} Email notification request
   */
  protected createEmailNotificationRequest(
    recipient: string,
    subject: string,
    body: string,
    payload: Record<string, unknown>,
    language: string
  ): NotificationRequest {
    return {
      channel: NotificationChannel.EMAIL,
      recipient,
      recipientType: RecipientType.EMAIL,
      subject,
      body,
      metadata: payload,
      language
    };
  }

  /**
   * @description Translates a notification key with variables
   * @param {string} key - Translation key
   * @param {string} language - Language code
   * @param {Record<string, unknown>} [variables] - Optional variables
   * @returns {string} Translated string or key if not found
   */
  protected translate(
    key: string,
    language: string,
    variables?: Record<string, unknown>
  ): string {
    return this.translationService.translate(key, language, variables);
  }
}

