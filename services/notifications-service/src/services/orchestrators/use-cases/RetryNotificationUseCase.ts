/**
 * @fileoverview RetryNotificationUseCase - Use case for retrying failed notifications
 * @summary Handles retry logic for failed notifications
 * @description This use case handles retrying failed notifications, checking retry limits,
 * updating retry counts, and attempting to resend notifications.
 */

import type { NotificationRepository } from '../../../domain/types/repository';
import type { NotificationDeliveryService } from '../../domain/NotificationDeliveryService';
import type { NotificationTemplateService } from '../../domain/NotificationTemplateService';
import type { RetryNotificationResult } from '../../../domain/types/orchestrator';
import type { Logger } from '@lawprotect/shared-ts';
import { Notification } from '../../../domain/entities/Notification';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { NotificationId } from '../../../domain/value-objects/NotificationId';
import { notificationNotFound, maxRetriesExceeded } from '../../../notification-errors';

/**
 * Use case for retrying failed notifications
 * 
 * Follows Single Responsibility Principle by focusing exclusively on
 * retry logic for failed notifications.
 */
export class RetryNotificationUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly deliveryService: NotificationDeliveryService,
    private readonly templateService: NotificationTemplateService,
    private readonly logger: Logger
  ) {}

  /**
   * @description Retries a failed notification
   * @param {string} notificationId - Notification ID to retry
   * @returns {Promise<RetryNotificationResult>} Retry result
   * @throws {Error} When notification not found or retry limit exceeded
   */
  async execute(notificationId: string): Promise<RetryNotificationResult> {
    const id = NotificationId.fromString(notificationId);
    const notification = await this.notificationRepository.findById(id);

    if (!notification) {
      throw notificationNotFound({ notificationId });
    }

    if (notification.getStatus() === NotificationStatus.SENT) {
      this.logger.warn('Attempted to retry already sent notification', {
        notificationId: notification.getId().getValue()
      });
      return {
        notification,
        success: true,
        messageId: notification.getProviderMessageId(),
        sentAt: notification.getSentAt()
      };
    }

    if (notification.getRetryCount() >= notification.getMaxRetries()) {
      this.logger.warn('Retry limit exceeded for notification', {
        notificationId: notification.getId().getValue(),
        retryCount: notification.getRetryCount(),
        maxRetries: notification.getMaxRetries()
      });
      throw maxRetriesExceeded({
        notificationId: notification.getId().getValue(),
        retryCount: notification.getRetryCount(),
        maxRetries: notification.getMaxRetries()
      });
    }

    const updatedNotification = new Notification(
      notification.getId(),
      notification.getNotificationId(),
      notification.getEventId(),
      notification.getEventType(),
      notification.getChannel(),
      notification.getRecipient(),
      notification.getRecipientType(),
      NotificationStatus.PENDING,
      undefined,
      notification.getDeliveredAt(),
      undefined,
      notification.getBouncedAt(),
      undefined,
      undefined,
      notification.getRetryCount() + 1,
      notification.getMaxRetries(),
      notification.getSubject(),
      notification.getBody(),
      notification.getTemplateId(),
      notification.getMetadata(),
      notification.getProviderMessageId(),
      notification.getProviderResponse(),
      notification.getUserId(),
      notification.getEnvelopeId(),
      notification.getSignerId(),
      notification.getCreatedAt(),
      new Date()
    );

    try {
      const sendResult = await this.resendNotification(updatedNotification);

      const successNotification = updatedNotification
        .markAsSent(new Date())
        .updateProviderInfo(sendResult.messageId, { sentAt: sendResult.sentAt.toISOString() });

      await this.notificationRepository.update(successNotification.getId(), successNotification);

      this.logger.info('Notification retry successful', {
        notificationId: notification.getId().getValue(),
        retryCount: successNotification.getRetryCount(),
        messageId: sendResult.messageId
      });

      return {
        notification: successNotification,
        success: true,
        messageId: sendResult.messageId,
        sentAt: sendResult.sentAt
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = error instanceof Error && 'code' in error ? String(error.code) : undefined;

      const failedNotification = updatedNotification.markAsFailed(
        errorMessage,
        errorCode,
        new Date()
      );

      await this.notificationRepository.update(failedNotification.getId(), failedNotification);

      this.logger.error('Notification retry failed', {
        notificationId: notification.getId().getValue(),
        retryCount: failedNotification.getRetryCount(),
        error: errorMessage
      });

      return {
        notification: failedNotification,
        success: false
      };
    }
  }

  /**
   * @description Resends a notification using delivery service
   * @param {Notification} notification - Notification to resend
   * @returns {Promise<{messageId: string; sentAt: Date}>} Send result
   */
  private async resendNotification(
    notification: Notification
  ): Promise<{ messageId: string; sentAt: Date }> {
    const channel = notification.getChannel();
    const recipient = notification.getRecipient();
    const subject = notification.getSubject();
    const body = notification.getBody();
    const metadata = notification.getMetadata();

    let finalSubject = subject || undefined;
    let finalHtmlBody: string | undefined;
    let finalTextBody = body || '';

    if (channel === NotificationChannel.EMAIL) {
      const safeBody = body || '';
      const templateResult = await this.templateService.renderEmailTemplate(
        {
          channel,
          recipient,
          recipientType: notification.getRecipientType(),
          subject,
          body: safeBody,
          metadata,
          language: metadata?.language as string | undefined
        },
        metadata
      );
      finalSubject = templateResult.subject;
      finalHtmlBody = templateResult.htmlBody;
      finalTextBody = templateResult.textBody;
    }

    const safeTextBody = finalTextBody || body || '';
    return await this.deliveryService.sendNotification(
      channel,
      recipient,
      finalSubject,
      safeTextBody,
      finalHtmlBody,
      metadata
    );
  }
}

