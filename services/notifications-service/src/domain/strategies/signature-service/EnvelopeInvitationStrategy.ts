/**
 * @fileoverview EnvelopeInvitationStrategy - Strategy for processing ENVELOPE_INVITATION events
 * @summary Handles envelope invitation notifications
 * @description Processes ENVELOPE_INVITATION events from signature-service and converts
 * them to email notification requests. Validates required fields and creates email notification
 * requests with translated subjects and messages.
 */

import type { NotificationRequest } from '../../types/orchestrator';
import { SignatureServiceEventType, EventSource } from '../../enums';
import { eventValidationFailed } from '../../../notification-errors';
import { isEmail } from '@lawprotect/shared-ts';
import { BaseEventProcessingStrategy } from '../BaseEventProcessingStrategy';
import { DEFAULT_DOCUMENT_TITLE, TranslationKeys } from '../../constants';

/**
 * Strategy for processing ENVELOPE_INVITATION events
 * 
 * Follows Single Responsibility Principle by focusing exclusively on
 * processing ENVELOPE_INVITATION events from signature-service.
 */
export class EnvelopeInvitationStrategy extends BaseEventProcessingStrategy {
  /**
   * @description Determines if this strategy can handle the given event
   * @param {string} eventType - Event type to check
   * @param {string} source - Event source to check
   * @returns {boolean} True if this strategy can handle the event
   */
  canHandle(eventType: string, source: string): boolean {
    return (
      source === EventSource.SIGNATURE_SERVICE &&
      eventType === SignatureServiceEventType.ENVELOPE_INVITATION
    );
  }

  /**
   * @description Processes an ENVELOPE_INVITATION event and returns notification requests
   * @param {Record<string, unknown>} payload - Event payload containing signerEmail, message, and metadata
   * @param {Record<string, unknown>} [metadata] - Optional event metadata
   * @returns {Promise<NotificationRequest[]>} Array containing a single email notification request
   * @throws {eventValidationFailed} When signerEmail or message is missing or invalid
   */
  async process(
    payload: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<NotificationRequest[]> {
    const signerEmail = this.extractString(payload, 'signerEmail');
    const message = this.extractString(payload, 'message');
    const payloadMetadata = this.extractPayloadMetadata(payload);
    const envelopeTitle = this.extractString(payloadMetadata, 'envelopeTitle') || DEFAULT_DOCUMENT_TITLE;
    const language = this.extractLanguage(payload, metadata);

    if (!signerEmail || !isEmail(signerEmail)) {
      throw eventValidationFailed({ field: 'signerEmail', value: signerEmail });
    }

    if (!message) {
      throw eventValidationFailed({ field: 'message', value: message });
    }

    const subject = this.translate(
      TranslationKeys.envelopeInvitation.subject,
      language,
      { envelopeTitle }
    );

    return [
      this.createEmailNotificationRequest(
        signerEmail,
        subject || `Sign Document: ${envelopeTitle}`,
        message,
        payload,
        language
      )
    ];
  }
}

