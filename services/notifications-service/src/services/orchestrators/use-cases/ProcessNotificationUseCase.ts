/**
 * @fileoverview ProcessNotificationUseCase - Use case for processing notification events
 * @summary Handles the complete workflow of processing EventBridge events into notifications
 * @description This use case orchestrates the complete notification processing workflow:
 * idempotency checking, event processing through strategies, notification creation,
 * persistence, and delivery coordination.
 */

import type { ProcessNotificationRequest, ProcessNotificationResult, NotificationRequest } from '../../../domain/types/orchestrator';
import type { NotificationRepository } from '../../../domain/types/repository';
import type { NotificationDeliveryService } from '../../domain/NotificationDeliveryService';
import type { NotificationTemplateService } from '../../domain/NotificationTemplateService';
import type { NotificationEventProcessor } from '../processors/NotificationEventProcessor';
import type { Logger } from '@lawprotect/shared-ts';
import { Notification } from '../../../domain/entities/Notification';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { uuid } from '@lawprotect/shared-ts';
import { eventAlreadyProcessed } from '../../../notification-errors';
import { EntityFactory } from '../../../infrastructure/factories/EntityFactory';
import { channelToKey } from '../../../domain/mappers';
import { PayloadExtractor } from '../../../domain/utils';
import { DEFAULT_LANGUAGE, DEFAULT_MAX_RETRIES } from '../../../domain/constants';

/**
 * Use case for processing notification events
 * 
 * Follows Single Responsibility Principle by focusing exclusively on
 * the notification processing workflow orchestration.
 */
export class ProcessNotificationUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly deliveryService: NotificationDeliveryService,
    private readonly templateService: NotificationTemplateService,
    private readonly eventProcessor: NotificationEventProcessor,
    private readonly logger: Logger
  ) {}

  /**
   * @description Processes an EventBridge event and sends notifications via appropriate channels
   * @param {ProcessNotificationRequest} request - EventBridge event data
   * @returns {Promise<ProcessNotificationResult>} Processing result with counts and errors
   * @throws {eventAlreadyProcessed} When event was already processed (idempotency)
   * @throws {eventTypeUnknown} When event type is not recognized
   * @throws {eventValidationFailed} When event payload is invalid
   */
  async execute(request: ProcessNotificationRequest): Promise<ProcessNotificationResult> {
    const requestId = request.eventId;
    const childLogger = this.logger.child({
      requestId,
      eventId: request.eventId,
      eventType: request.eventType,
      source: request.source
    });

    childLogger.info('Processing notification event', {
      eventId: request.eventId,
      eventType: request.eventType,
      source: request.source,
      occurredAt: request.occurredAt.toISOString()
    });

    try {
      childLogger.debug('Checking event idempotency', { eventId: request.eventId });
      const existingNotification = await this.checkIdempotency(request.eventId);
      if (existingNotification) {
        childLogger.warn('Event already processed', {
          eventId: request.eventId,
          existingNotificationId: existingNotification.getId().getValue()
        });
        throw eventAlreadyProcessed({ eventId: request.eventId });
      }

      childLogger.debug('Processing event through strategy', {
        eventId: request.eventId,
        eventType: request.eventType,
        source: request.source
      });
      const notificationRequests = await this.eventProcessor.processEvent(request);

      if (!notificationRequests || notificationRequests.length === 0) {
        childLogger.warn('No notifications to send for event', {
          eventId: request.eventId,
          eventType: request.eventType,
          source: request.source
        });
        return this.createEmptyResult(requestId);
      }

      childLogger.info('Event processed, sending notifications', {
        eventId: request.eventId,
        notificationCount: notificationRequests.length,
        channels: notificationRequests.map(r => r.channel)
      });

      const results = await this.sendNotifications(notificationRequests, request, childLogger);

      childLogger.info('Notification processing completed', {
        eventId: request.eventId,
        processedCount: results.processedCount,
        failedCount: results.failedCount,
        notificationsSent: results.notificationsSent,
        notificationsFailed: results.notificationsFailed
      });

      return {
        ...results,
        requestId
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      childLogger.error('Failed to process notification event', {
        eventId: request.eventId,
        eventType: request.eventType,
        source: request.source,
        error: errorMessage,
        stack: errorStack
      });
      throw error;
    }
  }

  /**
   * @description Checks if event was already processed (idempotency)
   * @param {string} eventId - EventBridge event ID
   * @returns {Promise<Notification | null>} Existing notification or null
   */
  private async checkIdempotency(eventId: string): Promise<Notification | null> {
    return await this.notificationRepository.findByEventId(eventId);
  }

  /**
   * @description Creates empty result for events with no notifications
   * @param {string} requestId - Request ID
   * @returns {ProcessNotificationResult} Empty result
   */
  private createEmptyResult(requestId: string): ProcessNotificationResult {
    return {
      success: true,
      processedCount: 0,
      failedCount: 0,
      requestId,
      notificationsSent: { email: 0, sms: 0, push: 0 },
      notificationsFailed: { email: 0, sms: 0, push: 0 },
      errors: []
    };
  }

  /**
   * @description Sends notifications via all requested channels
   * @param {NotificationRequest[]} notificationRequests - Array of notification requests to send
   * @param {ProcessNotificationRequest} eventRequest - Original event request
   * @param {Logger} logger - Logger instance
   * @returns {Promise<Omit<ProcessNotificationResult, 'requestId'>>} Processing results
   */
  private async sendNotifications(
    notificationRequests: NotificationRequest[],
    eventRequest: ProcessNotificationRequest,
    logger: Logger
  ): Promise<Omit<ProcessNotificationResult, 'requestId'>> {
    const notificationsSent = { email: 0, sms: 0, push: 0 };
    const notificationsFailed = { email: 0, sms: 0, push: 0 };
    const errors: Array<{ channel: string; error: string }> = [];

    const results: Omit<ProcessNotificationResult, 'requestId'> = {
      success: true,
      processedCount: 0,
      failedCount: 0,
      notificationsSent,
      notificationsFailed,
      errors
    };

    for (const notificationRequest of notificationRequests) {
      try {
        logger.debug('Creating and sending notification', {
          channel: notificationRequest.channel,
          recipient: notificationRequest.recipient,
          language: notificationRequest.language || DEFAULT_LANGUAGE
        });

        const notification = await this.createAndSendNotification(
          notificationRequest,
          eventRequest,
          logger
        );

        results.processedCount++;
        const channelKey = channelToKey(notification.getChannel());
        if (notification.getStatus() === NotificationStatus.SENT) {
          notificationsSent[channelKey]++;
          logger.debug('Notification sent successfully', {
            channel: notificationRequest.channel,
            recipient: notificationRequest.recipient,
            notificationId: notification.getId().getValue()
          });
        } else {
          notificationsFailed[channelKey]++;
          results.failedCount++;
          logger.warn('Notification failed to send', {
            channel: notificationRequest.channel,
            recipient: notificationRequest.recipient,
            status: notification.getStatus(),
            errorMessage: notification.getErrorMessage()
          });
        }
      } catch (error) {
        results.failedCount++;
        const channelKey = channelToKey(notificationRequest.channel);
        notificationsFailed[channelKey]++;
        const errorMessage = error instanceof Error ? error.message : String(error);

        errors.push({
          channel: notificationRequest.channel,
          error: errorMessage
        });

        logger.error('Failed to send notification', {
          channel: notificationRequest.channel,
          recipient: notificationRequest.recipient,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }

    results.success = results.failedCount === 0;
    return results;
  }

  /**
   * @description Creates notification entity, persists it, sends it, and updates status
   * @param {NotificationRequest} notificationRequest - Notification request data
   * @param {ProcessNotificationRequest} eventRequest - Original event request
   * @param {Logger} logger - Logger instance
   * @returns {Promise<Notification>} Created and sent notification entity
   */
  private async createAndSendNotification(
    notificationRequest: NotificationRequest,
    eventRequest: ProcessNotificationRequest,
    logger: Logger
  ): Promise<Notification> {
    const notificationId = uuid();

    const notification = EntityFactory.createNotification({
      notificationId,
      eventId: eventRequest.eventId,
      eventType: eventRequest.eventType,
      channel: notificationRequest.channel,
      recipient: notificationRequest.recipient,
      recipientType: notificationRequest.recipientType,
      subject: notificationRequest.subject,
      body: notificationRequest.body,
      metadata: notificationRequest.metadata,
      userId: PayloadExtractor.extractString(eventRequest.metadata || {}, 'userId'),
      envelopeId: PayloadExtractor.extractString(eventRequest.metadata || {}, 'envelopeId'),
      signerId: PayloadExtractor.extractString(eventRequest.metadata || {}, 'signerId'),
      maxRetries: DEFAULT_MAX_RETRIES
    });

    const persistedNotification = await this.notificationRepository.create(notification);

    try {
      const sendResult = await this.sendNotification(
        notificationRequest,
        eventRequest
      );

      const updatedNotification = persistedNotification
        .markAsSent(new Date())
        .updateProviderInfo(sendResult.messageId, { sentAt: sendResult.sentAt.toISOString() });

      await this.notificationRepository.update(updatedNotification.getId(), updatedNotification);

      logger.info('Notification sent successfully', {
        channel: notificationRequest.channel,
        recipient: notificationRequest.recipient,
        messageId: sendResult.messageId
      });

      return updatedNotification;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = error instanceof Error && 'code' in error ? String(error.code) : undefined;

      const failedNotification = persistedNotification.markAsFailed(
        errorMessage,
        errorCode,
        new Date()
      );

      await this.notificationRepository.update(failedNotification.getId(), failedNotification);

      logger.error('Notification send failed', {
        channel: notificationRequest.channel,
        recipient: notificationRequest.recipient,
        error: errorMessage
      });

      throw error;
    }
  }

  /**
   * @description Sends notification using delivery service with template rendering
   * @param {NotificationRequest} notificationRequest - Notification request
   * @param {ProcessNotificationRequest} eventRequest - Original event request
   * @returns {Promise<{messageId: string; sentAt: Date}>} Send result
   */
  private async sendNotification(
    notificationRequest: NotificationRequest,
    eventRequest: ProcessNotificationRequest
  ): Promise<{ messageId: string; sentAt: Date }> {
    let finalSubject = notificationRequest.subject;
    let finalHtmlBody = notificationRequest.body;
    let finalTextBody = notificationRequest.body;

    if (notificationRequest.channel === NotificationChannel.EMAIL) {
      const templateResult = await this.templateService.renderEmailTemplate(
        notificationRequest,
        {
          ...notificationRequest.metadata,
          source: eventRequest.source,
          eventType: eventRequest.eventType,
          language: notificationRequest.language
        }
      );
      finalSubject = templateResult.subject;
      finalHtmlBody = templateResult.htmlBody;
      finalTextBody = templateResult.textBody;
    }

    return await this.deliveryService.sendNotification(
      notificationRequest.channel,
      notificationRequest.recipient,
      finalSubject,
      finalTextBody,
      finalHtmlBody,
      {
        ...notificationRequest.metadata,
        source: eventRequest.source,
        eventType: eventRequest.eventType,
        language: notificationRequest.language
      }
    );
  }

}

