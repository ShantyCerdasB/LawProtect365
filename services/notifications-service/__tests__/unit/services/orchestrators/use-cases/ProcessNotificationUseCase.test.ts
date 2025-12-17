/**
 * @fileoverview ProcessNotificationUseCase Tests - Unit tests for ProcessNotificationUseCase
 * @summary Tests for notification processing workflow
 * @description Comprehensive test suite for ProcessNotificationUseCase covering event processing,
 * idempotency checking, notification creation, and error handling.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ProcessNotificationUseCase } from '../../../../../src/services/orchestrators/use-cases/ProcessNotificationUseCase';
import type { ProcessNotificationRequest, NotificationRequest } from '../../../../../src/domain/types/orchestrator';
import type { NotificationRepository } from '../../../../../src/domain/types/repository';
import type { NotificationDeliveryService } from '../../../../../src/services/domain/NotificationDeliveryService';
import type { NotificationTemplateService } from '../../../../../src/services/domain/NotificationTemplateService';
import type { NotificationEventProcessor } from '../../../../../src/services/orchestrators/processors/NotificationEventProcessor';
import type { Logger } from '@lawprotect/shared-ts';
import { Notification } from '../../../../../src/domain/entities/Notification';
import { NotificationChannel, NotificationStatus, RecipientType } from '@prisma/client';
import { eventAlreadyProcessed } from '../../../../../src/notification-errors';
import { EntityFactory } from '../../../../../src/infrastructure/factories/EntityFactory';
import { NotificationId } from '../../../../../src/domain/value-objects/NotificationId';
import { ConflictError } from '@lawprotect/shared-ts';

describe('ProcessNotificationUseCase', () => {
  let useCase: ProcessNotificationUseCase;
  let mockRepository: jest.Mocked<NotificationRepository>;
  let mockDeliveryService: jest.Mocked<NotificationDeliveryService>;
  let mockTemplateService: jest.Mocked<NotificationTemplateService>;
  let mockEventProcessor: jest.Mocked<NotificationEventProcessor>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      findByEventId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockDeliveryService = {
      sendNotification: jest.fn(),
    } as any;

    mockTemplateService = {
      renderEmailTemplate: jest.fn(),
    } as any;

    mockEventProcessor = {
      processEvent: jest.fn(),
    } as any;

    mockLogger = {
      child: jest.fn().mockReturnThis(),
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    useCase = new ProcessNotificationUseCase(
      mockRepository,
      mockDeliveryService,
      mockTemplateService,
      mockEventProcessor,
      mockLogger
    );
  });

  describe('execute', () => {
    const baseRequest: ProcessNotificationRequest = {
      eventId: 'event-123',
      eventType: 'ENVELOPE_INVITATION',
      source: 'signature-service',
      payload: { envelopeId: 'env-123' },
      occurredAt: new Date(),
      metadata: { userId: 'user-123' },
    };

    it('should process notification successfully', async () => {
      const notificationRequest: NotificationRequest = {
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test Subject',
        body: 'Test Body',
      };

      mockRepository.findByEventId.mockResolvedValue(null);
      mockEventProcessor.processEvent.mockResolvedValue([notificationRequest]);
      const createdNotification = EntityFactory.createNotification({
        notificationId: 'notif-123',
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test Subject',
        body: 'Test Body',
      });
      mockRepository.create.mockResolvedValue(createdNotification);
      mockTemplateService.renderEmailTemplate.mockResolvedValue({
        subject: 'Test Subject',
        htmlBody: '<html>Test</html>',
        textBody: 'Test Body',
      });
      mockDeliveryService.sendNotification.mockResolvedValue({
        messageId: 'msg-123',
        sentAt: new Date(),
      });
      const sentNotification = createdNotification.markAsSent(new Date()).updateProviderInfo('msg-123', { sentAt: new Date().toISOString() });
      mockRepository.update.mockResolvedValue(sentNotification);

      const result = await useCase.execute(baseRequest);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.requestId).toBe('event-123');
      expect(mockRepository.findByEventId).toHaveBeenCalledWith('event-123');
      expect(mockEventProcessor.processEvent).toHaveBeenCalledWith(baseRequest);
    });

    it('should throw error when event already processed', async () => {
      const existingNotification = EntityFactory.createNotification({
        notificationId: 'notif-existing',
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test',
        body: 'Test',
      });

      mockRepository.findByEventId.mockResolvedValue(existingNotification);

      await expect(useCase.execute(baseRequest)).rejects.toThrow(ConflictError);
    });

    it('should return empty result when no notifications to send', async () => {
      mockRepository.findByEventId.mockResolvedValue(null);
      mockEventProcessor.processEvent.mockResolvedValue([]);

      const result = await useCase.execute(baseRequest);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.notificationsSent).toEqual({ email: 0, sms: 0, push: 0 });
    });

    it('should handle notification send failure', async () => {
      const notificationRequest: NotificationRequest = {
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const notification = EntityFactory.createNotification({
        notificationId: 'notif-123',
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test Subject',
        body: 'Test Body',
      });

      mockRepository.findByEventId.mockResolvedValue(null);
      mockEventProcessor.processEvent.mockResolvedValue([notificationRequest]);
      mockRepository.create.mockResolvedValue(notification);
      mockTemplateService.renderEmailTemplate.mockResolvedValue({
        subject: 'Test Subject',
        htmlBody: '<html>Test</html>',
        textBody: 'Test Body',
      });
      mockDeliveryService.sendNotification.mockRejectedValue(new Error('Send failed'));
      const failedNotification = notification.markAsFailed('Send failed', undefined, new Date());
      mockRepository.update.mockResolvedValue(failedNotification);

      const result = await useCase.execute(baseRequest);

      expect(result.failedCount).toBe(1);
      expect(result.processedCount).toBe(0);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle notification with FAILED status', async () => {
      const notificationRequest: NotificationRequest = {
        channel: NotificationChannel.SMS,
        recipient: '+15551234567',
        recipientType: RecipientType.PHONE,
        body: 'Test Body',
      };

      const notification = EntityFactory.createNotification({
        notificationId: 'notif-123',
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.SMS,
        recipient: '+15551234567',
        recipientType: RecipientType.PHONE,
        body: 'Test Body',
      });

      mockRepository.findByEventId.mockResolvedValue(null);
      mockEventProcessor.processEvent.mockResolvedValue([notificationRequest]);
      mockRepository.create.mockResolvedValue(notification);
      mockDeliveryService.sendNotification.mockRejectedValue(new Error('Send failed'));
      const failedNotification = notification.markAsFailed('Send failed', undefined, new Date());
      mockRepository.update.mockResolvedValue(failedNotification);

      const result = await useCase.execute(baseRequest);

      expect(result.failedCount).toBe(1);
      expect(result.processedCount).toBe(0);
    });

    it('should render email template for EMAIL channel', async () => {
      const notificationRequest: NotificationRequest = {
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test Subject',
        body: 'Test Body',
      };

      mockRepository.findByEventId.mockResolvedValue(null);
      mockEventProcessor.processEvent.mockResolvedValue([notificationRequest]);
      const createdNotification = EntityFactory.createNotification({
        notificationId: 'notif-123',
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test Subject',
        body: 'Test Body',
      });
      mockRepository.create.mockResolvedValue(createdNotification);
      mockTemplateService.renderEmailTemplate.mockResolvedValue({
        subject: 'Rendered Subject',
        htmlBody: '<html>Rendered</html>',
        textBody: 'Rendered Text',
      });
      mockDeliveryService.sendNotification.mockResolvedValue({
        messageId: 'msg-123',
        sentAt: new Date(),
      });
      const sentNotification = createdNotification.markAsSent(new Date()).updateProviderInfo('msg-123', { sentAt: new Date().toISOString() });
      mockRepository.update.mockResolvedValue(sentNotification);

      await useCase.execute(baseRequest);

      expect(mockTemplateService.renderEmailTemplate).toHaveBeenCalled();
    });

    it('should handle multiple notification requests', async () => {
      const notificationRequests: NotificationRequest[] = [
        {
          channel: NotificationChannel.EMAIL,
          recipient: 'test1@example.com',
          recipientType: RecipientType.EMAIL,
          subject: 'Test 1',
          body: 'Body 1',
        },
        {
          channel: NotificationChannel.SMS,
          recipient: '+15551234567',
          recipientType: RecipientType.PHONE,
          body: 'Body 2',
        },
      ];

      mockRepository.findByEventId.mockResolvedValue(null);
      mockEventProcessor.processEvent.mockResolvedValue(notificationRequests);
      const createdNotification = EntityFactory.createNotification({
        notificationId: 'notif-123',
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.EMAIL,
        recipient: 'test1@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test 1',
        body: 'Body 1',
      });
      mockRepository.create.mockResolvedValue(createdNotification);
      mockTemplateService.renderEmailTemplate.mockResolvedValue({
        subject: 'Test 1',
        htmlBody: '<html>Body 1</html>',
        textBody: 'Body 1',
      });
      mockDeliveryService.sendNotification.mockResolvedValue({
        messageId: 'msg-123',
        sentAt: new Date(),
      });
      const sentNotification = createdNotification.markAsSent(new Date()).updateProviderInfo('msg-123', { sentAt: new Date().toISOString() });
      mockRepository.update.mockResolvedValue(sentNotification);

      const result = await useCase.execute(baseRequest);

      expect(result.processedCount).toBeGreaterThan(0);
    });

    it('should propagate errors from event processor', async () => {
      const error = new Error('Event processing failed');
      mockRepository.findByEventId.mockResolvedValue(null);
      mockEventProcessor.processEvent.mockRejectedValue(error);

      await expect(useCase.execute(baseRequest)).rejects.toThrow('Event processing failed');
    });

    it('should handle errors during notification creation', async () => {
      const notificationRequest: NotificationRequest = {
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test Subject',
        body: 'Test Body',
      };

      mockRepository.findByEventId.mockResolvedValue(null);
      mockEventProcessor.processEvent.mockResolvedValue([notificationRequest]);
      mockRepository.create.mockRejectedValue(new Error('Create failed'));

      const result = await useCase.execute(baseRequest);

      expect(result.failedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('should extract metadata from event request', async () => {
      const notificationRequest: NotificationRequest = {
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const requestWithMetadata: ProcessNotificationRequest = {
        ...baseRequest,
        metadata: {
          userId: 'user-123',
          envelopeId: 'env-123',
          signerId: 'signer-123',
        },
      };

      mockRepository.findByEventId.mockResolvedValue(null);
      mockEventProcessor.processEvent.mockResolvedValue([notificationRequest]);
      const createdNotification = EntityFactory.createNotification({
        notificationId: 'notif-123',
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test Subject',
        body: 'Test Body',
      });
      mockRepository.create.mockResolvedValue(createdNotification);
      mockTemplateService.renderEmailTemplate.mockResolvedValue({
        subject: 'Test Subject',
        htmlBody: '<html>Test</html>',
        textBody: 'Test Body',
      });
      mockDeliveryService.sendNotification.mockResolvedValue({
        messageId: 'msg-123',
        sentAt: new Date(),
      });
      const sentNotification = createdNotification.markAsSent(new Date()).updateProviderInfo('msg-123', { sentAt: new Date().toISOString() });
      mockRepository.update.mockResolvedValue(sentNotification);

      await useCase.execute(requestWithMetadata);

      expect(mockRepository.create).toHaveBeenCalled();
    });
  });
});

