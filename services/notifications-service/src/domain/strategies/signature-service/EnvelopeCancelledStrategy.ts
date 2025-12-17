/**
 * @fileoverview EnvelopeCancelledStrategy - Strategy for processing ENVELOPE_CANCELLED events
 * @summary Handles envelope cancelled notifications
 * @description Processes ENVELOPE_CANCELLED events from signature-service and converts
 * them to email notification requests. Creates email notifications to inform signers
 * that an envelope has been cancelled.
 */

import type { NotificationRequest } from '../../types/orchestrator';
import { SignatureServiceEventType, EventSource } from '../../enums';
import { isEmail } from '@lawprotect/shared-ts';
import { BaseEventProcessingStrategy } from '../BaseEventProcessingStrategy';
import { DEFAULT_DOCUMENT_TITLE, TranslationKeys } from '../../constants';

/**
 * Strategy for processing ENVELOPE_CANCELLED events
 * 
 * Follows Single Responsibility Principle by focusing exclusively on
 * processing ENVELOPE_CANCELLED events from signature-service.
 */
export class EnvelopeCancelledStrategy extends BaseEventProcessingStrategy {
  /**
   * @description Determines if this strategy can handle the given event
   * @param {string} eventType - Event type to check
   * @param {string} source - Event source to check
   * @returns {boolean} True if this strategy can handle the event
   */
  canHandle(eventType: string, source: string): boolean {
    return (
      source === EventSource.SIGNATURE_SERVICE &&
      eventType === SignatureServiceEventType.ENVELOPE_CANCELLED
    );
  }

  /**
   * @description Processes an ENVELOPE_CANCELLED event and returns notification requests
   * @param {Record<string, unknown>} payload - Event payload containing signerEmail and envelopeTitle
   * @param {Record<string, unknown>} [metadata] - Optional event metadata
   * @returns {Promise<NotificationRequest[]>} Array containing a single email notification request, or empty if signerEmail is invalid
   */
  async process(
    payload: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<NotificationRequest[]> {
    const signerEmail = this.extractString(payload, 'signerEmail');
    const envelopeTitle = this.extractString(payload, 'envelopeTitle') || DEFAULT_DOCUMENT_TITLE;
    const language = this.extractLanguage(payload, metadata);

    if (!signerEmail || !isEmail(signerEmail)) {
      return [];
    }

    const subject = this.translate(
      TranslationKeys.envelopeCancelled.subject,
      language,
      { envelopeTitle }
    );

    const body = this.translate(
      TranslationKeys.envelopeCancelled.body,
      language,
      { envelopeTitle }
    );

    return [
      this.createEmailNotificationRequest(
        signerEmail,
        subject || `Document Cancelled: ${envelopeTitle}`,
        body || `The document "${envelopeTitle}" has been cancelled.`,
        payload,
        language
      )
    ];
  }
}

