/**
 * @fileoverview SendNotificationUseCase - Use case for sending a single notification
 * @summary Handles sending a single notification request
 * @description This use case handles sending a single notification, including
 * template rendering, delivery coordination, and status tracking.
 */

import type {
  NotificationRequest,
  SendNotificationUseCaseResult
} from '../../../domain/types/orchestrator';
import type { NotificationRepository } from '../../../domain/types/repository';
import type { NotificationDeliveryService } from '../../domain/NotificationDeliveryService';
import type { NotificationTemplateService } from '../../domain/NotificationTemplateService';
import type { Logger } from '@lawprotect/shared-ts';
import { Notification } from '../../../domain/entities/Notification';
import { NotificationChannel } from '@prisma/client';
import { uuid } from '@lawprotect/shared-ts';
import { EntityFactory } from '../../../infrastructure/factories/EntityFactory';
import { PayloadExtractor } from '../../../domain/utils';
import { DEFAULT_MAX_RETRIES } from '../../../domain/constants';

/**
 * Use case for sending a single notification
 * 
 * Follows Single Responsibility Principle by focusing exclusively on
 * sending a single notification request.
 */
export class SendNotificationUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly deliveryService: NotificationDeliveryService,
    private readonly templateService: NotificationTemplateService,
    private readonly logger: Logger
  ) {}

  /**
   * @description Sends a single notification request
   * @param {NotificationRequest} request - Notification request
   * @param {string} eventId - Event ID associated with this notification
   * @param {string} eventType - Event type
   * @param {Record<string, unknown>} [metadata] - Optional event metadata
   * @returns {Promise<SendNotificationResult>} Send result with notification entity
   */
  async execute(
    request: NotificationRequest,
    eventId: string,
    eventType: string,
    metadata?: Record<string, unknown>
  ): Promise<SendNotificationUseCaseResult> {
    const notificationId = uuid();

    const notification = EntityFactory.createNotification({
      notificationId,
      eventId,
      eventType,
      channel: request.channel,
      recipient: request.recipient,
      recipientType: request.recipientType,
      subject: request.subject,
      body: request.body,
      metadata: request.metadata,
      userId: PayloadExtractor.extractString(metadata || {}, 'userId'),
      envelopeId: PayloadExtractor.extractString(metadata || {}, 'envelopeId'),
      signerId: PayloadExtractor.extractString(metadata || {}, 'signerId'),
      maxRetries: DEFAULT_MAX_RETRIES
    });

    const persistedNotification = await this.notificationRepository.create(notification);

    try {
      let finalSubject = request.subject;
      let finalHtmlBody = request.body;
      let finalTextBody = request.body;

      if (request.channel === NotificationChannel.EMAIL) {
        const templateResult = await this.templateService.renderEmailTemplate(request, metadata);
        finalSubject = templateResult.subject;
        finalHtmlBody = templateResult.htmlBody;
        finalTextBody = templateResult.textBody;
      }

      const sendResult = await this.deliveryService.sendNotification(
        request.channel,
        request.recipient,
        finalSubject,
        finalTextBody,
        finalHtmlBody,
        {
          ...request.metadata,
          ...metadata,
          language: request.language
        }
      );

      const updatedNotification = persistedNotification
        .markAsSent(new Date())
        .updateProviderInfo(sendResult.messageId, { sentAt: sendResult.sentAt.toISOString() });

      await this.notificationRepository.update(updatedNotification.getId(), updatedNotification);

      this.logger.info('Notification sent successfully', {
        channel: request.channel,
        recipient: request.recipient,
        messageId: sendResult.messageId
      });

      return {
        notification: updatedNotification,
        messageId: sendResult.messageId,
        sentAt: sendResult.sentAt
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = error instanceof Error && 'code' in error ? String(error.code) : undefined;

      const failedNotification = persistedNotification.markAsFailed(
        errorMessage,
        errorCode,
        new Date()
      );

      await this.notificationRepository.update(failedNotification.getId(), failedNotification);

      this.logger.error('Notification send failed', {
        channel: request.channel,
        recipient: request.recipient,
        error: errorMessage
      });

      throw error;
    }
  }
}

