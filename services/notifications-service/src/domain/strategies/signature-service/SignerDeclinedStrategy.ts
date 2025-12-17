/**
 * @fileoverview SignerDeclinedStrategy - Strategy for processing SIGNER_DECLINED events
 * @summary Handles signer declined notifications
 * @description Processes SIGNER_DECLINED events from signature-service and converts
 * them to email notification requests. Validates required fields and creates email notification
 * requests with translated subjects and bodies.
 */

import type { NotificationRequest } from '../../types/orchestrator';
import { SignatureServiceEventType, EventSource } from '../../enums';
import { eventValidationFailed } from '../../../notification-errors';
import { BaseEventProcessingStrategy } from '../BaseEventProcessingStrategy';
import { DEFAULT_DOCUMENT_TITLE, TranslationKeys } from '../../constants';

/**
 * Strategy for processing SIGNER_DECLINED events
 * 
 * Follows Single Responsibility Principle by focusing exclusively on
 * processing SIGNER_DECLINED events from signature-service.
 */
export class SignerDeclinedStrategy extends BaseEventProcessingStrategy {
  /**
   * @description Determines if this strategy can handle the given event
   * @param {string} eventType - Event type to check
   * @param {string} source - Event source to check
   * @returns {boolean} True if this strategy can handle the event
   */
  canHandle(eventType: string, source: string): boolean {
    return (
      source === EventSource.SIGNATURE_SERVICE &&
      eventType === SignatureServiceEventType.SIGNER_DECLINED
    );
  }

  /**
   * @description Processes a SIGNER_DECLINED event and returns notification requests
   * @param {Record<string, unknown>} payload - Event payload containing signerEmail, declineReason, and metadata
   * @param {Record<string, unknown>} [metadata] - Optional event metadata
   * @returns {Promise<NotificationRequest[]>} Array containing a single email notification request
   * @throws {eventValidationFailed} When signerEmail or declineReason is missing
   */
  async process(
    payload: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<NotificationRequest[]> {
    const signerEmail = this.extractString(payload, 'signerEmail');
    const declineReason = this.extractString(payload, 'declineReason');
    const payloadMetadata = this.extractPayloadMetadata(payload);
    const envelopeTitle = this.extractString(payloadMetadata, 'envelopeTitle') || DEFAULT_DOCUMENT_TITLE;
    const language = this.extractLanguage(payload, metadata);

    if (!signerEmail) {
      throw eventValidationFailed({ field: 'signerEmail', value: signerEmail });
    }

    if (!declineReason) {
      throw eventValidationFailed({ field: 'declineReason', value: declineReason });
    }

    const subject = this.translate(
      TranslationKeys.signerDeclined.subject,
      language,
      { envelopeTitle }
    );

    const body = this.translate(
      TranslationKeys.signerDeclined.body,
      language,
      { envelopeTitle, declineReason }
    );

    return [
      this.createEmailNotificationRequest(
        signerEmail,
        subject || `Document Signing Declined: ${envelopeTitle}`,
        body || `The document "${envelopeTitle}" was declined. Reason: ${declineReason}`,
        payload,
        language
      )
    ];
  }
}

