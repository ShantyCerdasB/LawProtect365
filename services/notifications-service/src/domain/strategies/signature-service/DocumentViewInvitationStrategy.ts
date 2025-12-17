/**
 * @fileoverview DocumentViewInvitationStrategy - Strategy for processing DOCUMENT_VIEW_INVITATION events
 * @summary Handles document view invitation notifications
 * @description Processes DOCUMENT_VIEW_INVITATION events from signature-service and converts
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
 * Strategy for processing DOCUMENT_VIEW_INVITATION events
 * 
 * Follows Single Responsibility Principle by focusing exclusively on
 * processing DOCUMENT_VIEW_INVITATION events from signature-service.
 */
export class DocumentViewInvitationStrategy extends BaseEventProcessingStrategy {
  /**
   * @description Determines if this strategy can handle the given event
   * @param {string} eventType - Event type to check
   * @param {string} source - Event source to check
   * @returns {boolean} True if this strategy can handle the event
   */
  canHandle(eventType: string, source: string): boolean {
    return (
      source === EventSource.SIGNATURE_SERVICE &&
      eventType === SignatureServiceEventType.DOCUMENT_VIEW_INVITATION
    );
  }

  /**
   * @description Processes a DOCUMENT_VIEW_INVITATION event and returns notification requests
   * @param {Record<string, unknown>} payload - Event payload containing viewerEmail, message, and metadata
   * @param {Record<string, unknown>} [metadata] - Optional event metadata
   * @returns {Promise<NotificationRequest[]>} Array containing a single email notification request
   * @throws {eventValidationFailed} When viewerEmail or message is missing or invalid
   */
  async process(
    payload: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<NotificationRequest[]> {
    const viewerEmail = this.extractString(payload, 'viewerEmail');
    const message = this.extractString(payload, 'message');
    const payloadMetadata = this.extractPayloadMetadata(payload);
    const envelopeTitle = this.extractString(payloadMetadata, 'envelopeTitle') || DEFAULT_DOCUMENT_TITLE;
    const language = this.extractLanguage(payload, metadata);

    if (!viewerEmail || !isEmail(viewerEmail)) {
      throw eventValidationFailed({ field: 'viewerEmail', value: viewerEmail });
    }

    if (!message) {
      throw eventValidationFailed({ field: 'message', value: message });
    }

    const subject = this.translate(
      TranslationKeys.documentViewInvitation.subject,
      language,
      { envelopeTitle }
    );

    return [
      this.createEmailNotificationRequest(
        viewerEmail,
        subject || `View Document: ${envelopeTitle}`,
        message,
        payload,
        language
      )
    ];
  }
}

