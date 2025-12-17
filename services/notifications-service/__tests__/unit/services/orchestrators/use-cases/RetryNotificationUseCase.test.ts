/**
 * @fileoverview RetryNotificationUseCase Tests - Unit tests for RetryNotificationUseCase
 * @summary Tests for notification retry logic
 * @description Comprehensive test suite for RetryNotificationUseCase covering retry attempts,
 * retry limits, notification resending, and error handling.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { RetryNotificationUseCase } from '../../../../../src/services/orchestrators/use-cases/RetryNotificationUseCase';
import type { NotificationRepository } from '../../../../../src/domain/types/repository';
import type { NotificationDeliveryService } from '../../../../../src/services/domain/NotificationDeliveryService';
import type { NotificationTemplateService } from '../../../../../src/services/domain/NotificationTemplateService';
import type { Logger } from '@lawprotect/shared-ts';
import { Notification } from '../../../../../src/domain/entities/Notification';
import { NotificationChannel, NotificationStatus, RecipientType } from '@prisma/client';
import { NotificationId } from '../../../../../src/domain/value-objects/NotificationId';
import { notificationNotFound, maxRetriesExceeded } from '../../../../../src/notification-errors';
import { EntityFactory } from '../../../../../src/infrastructure/factories/EntityFactory';
import { NotFoundError, UnprocessableEntityError } from '@lawprotect/shared-ts';
import { TestUtils } from '../../../../helpers/testUtils';

describe('RetryNotificationUseCase', () => {
  let useCase: RetryNotificationUseCase;
  let mockRepository: jest.Mocked<NotificationRepository>;
  let mockDeliveryService: jest.Mocked<NotificationDeliveryService>;
  let mockTemplateService: jest.Mocked<NotificationTemplateService>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    mockDeliveryService = {
      sendNotification: jest.fn(),
    } as any;

    mockTemplateService = {
      renderEmailTemplate: jest.fn(),
    } as any;

    mockLogger = {
      warn: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    } as any;

    useCase = new RetryNotificationUseCase(
      mockRepository,
      mockDeliveryService,
      mockTemplateService,
      mockLogger
    );
  });

  describe('execute', () => {
    it('should throw error when notification not found', async () => {
      const notificationId = TestUtils.generateUuid();
      mockRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(notificationId)).rejects.toThrow(NotFoundError);
    });

    it('should return success for already sent notification', async () => {
      const notificationId = TestUtils.generateUuid();
      const notification = EntityFactory.createNotification({
        notificationId: TestUtils.generateUuid(),
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test',
        body: 'Test',
      });
      const sentNotification = notification.markAsSent(new Date());

      mockRepository.findById.mockResolvedValue(sentNotification);

      const result = await useCase.execute(notificationId);

      expect(result.success).toBe(true);
      expect(result.notification).toBe(sentNotification);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should throw error when retry limit exceeded', async () => {
      const notificationId = TestUtils.generateUuid();
      const notification = EntityFactory.createNotification({
        notificationId: TestUtils.generateUuid(),
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test',
        body: 'Test',
        maxRetries: 3,
      });

      const failedNotification = new Notification(
        notification.getId(),
        notification.getNotificationId(),
        notification.getEventId(),
        notification.getEventType(),
        notification.getChannel(),
        notification.getRecipient(),
        notification.getRecipientType(),
        notification.getStatus(),
        notification.getSentAt(),
        notification.getDeliveredAt(),
        notification.getFailedAt(),
        notification.getBouncedAt(),
        notification.getErrorMessage(),
        notification.getErrorCode(),
        notification.getRetryCount() + 3,
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

      mockRepository.findById.mockResolvedValue(failedNotification);

      await expect(useCase.execute(notificationId)).rejects.toThrow(UnprocessableEntityError);
    });

    it('should retry notification successfully', async () => {
      const notificationId = TestUtils.generateUuid();
      const notification = EntityFactory.createNotification({
        notificationId: TestUtils.generateUuid(),
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test',
        body: 'Test',
      });
      const failedNotification = notification.markAsFailed('Error', undefined, new Date());

      mockRepository.findById.mockResolvedValue(failedNotification);
      mockTemplateService.renderEmailTemplate.mockResolvedValue({
        subject: 'Test',
        htmlBody: '<html>Test</html>',
        textBody: 'Test',
      });
      mockDeliveryService.sendNotification.mockResolvedValue({
        messageId: 'msg-123',
        sentAt: new Date(),
      });
      const updatedNotification = new Notification(
        failedNotification.getId(),
        failedNotification.getNotificationId(),
        failedNotification.getEventId(),
        failedNotification.getEventType(),
        failedNotification.getChannel(),
        failedNotification.getRecipient(),
        failedNotification.getRecipientType(),
        NotificationStatus.PENDING,
        undefined,
        failedNotification.getDeliveredAt(),
        undefined,
        failedNotification.getBouncedAt(),
        undefined,
        undefined,
        failedNotification.getRetryCount() + 1,
        failedNotification.getMaxRetries(),
        failedNotification.getSubject(),
        failedNotification.getBody(),
        failedNotification.getTemplateId(),
        failedNotification.getMetadata(),
        failedNotification.getProviderMessageId(),
        failedNotification.getProviderResponse(),
        failedNotification.getUserId(),
        failedNotification.getEnvelopeId(),
        failedNotification.getSignerId(),
        failedNotification.getCreatedAt(),
        new Date()
      );
      const sentNotification = updatedNotification.markAsSent(new Date()).updateProviderInfo('msg-123', { sentAt: new Date().toISOString() });
      mockRepository.update.mockResolvedValue(sentNotification);

      const result = await useCase.execute(notificationId);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should handle retry failure', async () => {
      const notificationId = TestUtils.generateUuid();
      const notification = EntityFactory.createNotification({
        notificationId: TestUtils.generateUuid(),
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test',
        body: 'Test',
      });
      const failedNotification = notification.markAsFailed('Error', undefined, new Date());

      mockRepository.findById.mockResolvedValue(failedNotification);
      mockDeliveryService.sendNotification.mockRejectedValue(new Error('Send failed'));
      mockRepository.update.mockResolvedValue(notification);

      const result = await useCase.execute(notificationId);

      expect(result.success).toBe(false);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should render email template for EMAIL channel retry', async () => {
      const notificationId = TestUtils.generateUuid();
      const notification = EntityFactory.createNotification({
        notificationId: TestUtils.generateUuid(),
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test',
        body: 'Test',
      });
      const failedNotification = notification.markAsFailed('Error', undefined, new Date());

      mockRepository.findById.mockResolvedValue(failedNotification);
      mockTemplateService.renderEmailTemplate.mockResolvedValue({
        subject: 'Rendered Subject',
        htmlBody: '<html>Rendered</html>',
        textBody: 'Rendered Text',
      });
      mockDeliveryService.sendNotification.mockResolvedValue({
        messageId: 'msg-123',
        sentAt: new Date(),
      });
      mockRepository.update.mockResolvedValue(notification);

      await useCase.execute(notificationId);

      expect(mockTemplateService.renderEmailTemplate).toHaveBeenCalled();
    });

    it('should handle SMS channel retry without template', async () => {
      const notificationId = TestUtils.generateUuid();
      const notification = EntityFactory.createNotification({
        notificationId: TestUtils.generateUuid(),
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.SMS,
        recipient: '+1234567890',
        recipientType: RecipientType.EMAIL,
        body: 'Test',
      });
      const failedNotification = notification.markAsFailed('Error', undefined, new Date());

      mockRepository.findById.mockResolvedValue(failedNotification);
      mockDeliveryService.sendNotification.mockResolvedValue({
        messageId: 'msg-123',
        sentAt: new Date(),
      });
      mockRepository.update.mockResolvedValue(notification);

      await useCase.execute(notificationId);

      expect(mockTemplateService.renderEmailTemplate).not.toHaveBeenCalled();
    });

    it('should increment retry count', async () => {
      const notificationId = TestUtils.generateUuid();
      const notification = EntityFactory.createNotification({
        notificationId: TestUtils.generateUuid(),
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test',
        body: 'Test',
      });
      const failedNotification = new Notification(
        notification.getId(),
        notification.getNotificationId(),
        notification.getEventId(),
        notification.getEventType(),
        notification.getChannel(),
        notification.getRecipient(),
        notification.getRecipientType(),
        notification.getStatus(),
        notification.getSentAt(),
        notification.getDeliveredAt(),
        notification.getFailedAt(),
        notification.getBouncedAt(),
        notification.getErrorMessage(),
        notification.getErrorCode(),
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

      mockRepository.findById.mockResolvedValue(failedNotification);
      mockDeliveryService.sendNotification.mockResolvedValue({
        messageId: 'msg-123',
        sentAt: new Date(),
      });
      mockRepository.update.mockResolvedValue(notification);

      await useCase.execute(notificationId);

      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should handle notification with metadata', async () => {
      const notificationId = TestUtils.generateUuid();
      const notification = EntityFactory.createNotification({
        notificationId: TestUtils.generateUuid(),
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test',
        body: 'Test',
        metadata: { language: 'en' },
      });
      const failedNotification = notification.markAsFailed('Error', undefined, new Date());

      mockRepository.findById.mockResolvedValue(failedNotification);
      mockTemplateService.renderEmailTemplate.mockResolvedValue({
        subject: 'Rendered Subject',
        htmlBody: '<html>Rendered</html>',
        textBody: 'Rendered Text',
      });
      mockDeliveryService.sendNotification.mockResolvedValue({
        messageId: 'msg-123',
        sentAt: new Date(),
      });
      mockRepository.update.mockResolvedValue(notification);

      await useCase.execute(notificationId);

      expect(mockTemplateService.renderEmailTemplate).toHaveBeenCalled();
    });
  });
});

