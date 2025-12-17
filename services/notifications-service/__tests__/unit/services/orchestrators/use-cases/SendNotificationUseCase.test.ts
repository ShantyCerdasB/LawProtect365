/**
 * @fileoverview SendNotificationUseCase Tests - Unit tests for SendNotificationUseCase
 * @summary Tests for single notification sending
 * @description Comprehensive test suite for SendNotificationUseCase covering notification creation,
 * template rendering, delivery, and error handling.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { SendNotificationUseCase } from '../../../../../src/services/orchestrators/use-cases/SendNotificationUseCase';
import type { NotificationRepository } from '../../../../../src/domain/types/repository';
import type { NotificationDeliveryService } from '../../../../../src/services/domain/NotificationDeliveryService';
import type { NotificationTemplateService } from '../../../../../src/services/domain/NotificationTemplateService';
import type { Logger } from '@lawprotect/shared-ts';
import type { NotificationRequest } from '../../../../../src/domain/types/orchestrator';
import { NotificationChannel, NotificationStatus, RecipientType } from '@prisma/client';
import { EntityFactory } from '../../../../../src/infrastructure/factories/EntityFactory';

describe('SendNotificationUseCase', () => {
  let useCase: SendNotificationUseCase;
  let mockRepository: jest.Mocked<NotificationRepository>;
  let mockDeliveryService: jest.Mocked<NotificationDeliveryService>;
  let mockTemplateService: jest.Mocked<NotificationTemplateService>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      create: jest.fn(),
      update: jest.fn(),
    } as any;

    mockDeliveryService = {
      sendNotification: jest.fn(),
    } as any;

    mockTemplateService = {
      renderEmailTemplate: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as any;

    useCase = new SendNotificationUseCase(
      mockRepository,
      mockDeliveryService,
      mockTemplateService,
      mockLogger
    );
  });

  describe('execute', () => {
    const baseRequest: NotificationRequest = {
      channel: NotificationChannel.EMAIL,
      recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
      subject: 'Test Subject',
      body: 'Test Body',
    };

    it('should send notification successfully', async () => {
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

      mockRepository.create.mockResolvedValue(notification);
      mockTemplateService.renderEmailTemplate.mockResolvedValue({
        subject: 'Test Subject',
        htmlBody: '<html>Test</html>',
        textBody: 'Test Body',
      });
      mockDeliveryService.sendNotification.mockResolvedValue({
        messageId: 'msg-123',
        sentAt: new Date(),
      });
      const sentNotification = notification.markAsSent(new Date()).updateProviderInfo('msg-123', { sentAt: new Date().toISOString() });
      mockRepository.update.mockResolvedValue(sentNotification);

      const result = await useCase.execute(baseRequest, 'event-123', 'ENVELOPE_INVITATION');

      expect(result.messageId).toBe('msg-123');
      expect(result.notification.getId().getValue()).toBe(sentNotification.getId().getValue());
      expect(result.notification.getStatus()).toBe(NotificationStatus.SENT);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should render email template for EMAIL channel', async () => {
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

      mockRepository.create.mockResolvedValue(notification);
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

      await useCase.execute(baseRequest, 'event-123', 'ENVELOPE_INVITATION', { language: 'en' });

      expect(mockTemplateService.renderEmailTemplate).toHaveBeenCalled();
    });

    it('should not render template for non-EMAIL channel', async () => {
      const smsRequest: NotificationRequest = {
        channel: NotificationChannel.SMS,
        recipient: '+1234567890',
        recipientType: RecipientType.PHONE,
        body: 'Test Body',
      };

      const notification = EntityFactory.createNotification({
        notificationId: 'notif-123',
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.SMS,
        recipient: '+1234567890',
        recipientType: RecipientType.PHONE,
        body: 'Test Body',
      });

      mockRepository.create.mockResolvedValue(notification);
      mockDeliveryService.sendNotification.mockResolvedValue({
        messageId: 'msg-123',
        sentAt: new Date(),
      });
      mockRepository.update.mockResolvedValue(notification);

      await useCase.execute(smsRequest, 'event-123', 'ENVELOPE_INVITATION');

      expect(mockTemplateService.renderEmailTemplate).not.toHaveBeenCalled();
    });

    it('should handle send failure', async () => {
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

      mockRepository.create.mockResolvedValue(notification);
      mockTemplateService.renderEmailTemplate.mockResolvedValue({
        subject: 'Test Subject',
        htmlBody: '<html>Test</html>',
        textBody: 'Test Body',
      });
      mockDeliveryService.sendNotification.mockRejectedValue(new Error('Send failed'));
      mockRepository.update.mockResolvedValue(notification);

      await expect(
        useCase.execute(baseRequest, 'event-123', 'ENVELOPE_INVITATION')
      ).rejects.toThrow('Send failed');

      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should extract metadata from parameters', async () => {
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

      const metadata = {
        userId: 'user-123',
        envelopeId: 'env-123',
        signerId: 'signer-123',
      };

      mockRepository.create.mockResolvedValue(notification);
      mockTemplateService.renderEmailTemplate.mockResolvedValue({
        subject: 'Test Subject',
        htmlBody: '<html>Test</html>',
        textBody: 'Test Body',
      });
      mockDeliveryService.sendNotification.mockResolvedValue({
        messageId: 'msg-123',
        sentAt: new Date(),
      });
      mockRepository.update.mockResolvedValue(notification);

      await useCase.execute(baseRequest, 'event-123', 'ENVELOPE_INVITATION', metadata);

      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should merge request metadata with event metadata', async () => {
      const requestWithMetadata: NotificationRequest = {
        ...baseRequest,
        metadata: { requestKey: 'requestValue' },
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

      mockRepository.create.mockResolvedValue(notification);
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

      await useCase.execute(requestWithMetadata, 'event-123', 'ENVELOPE_INVITATION', {
        eventKey: 'eventValue',
      });

      expect(mockDeliveryService.sendNotification).toHaveBeenCalled();
    });

    it('should handle error with error code', async () => {
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

      const error = new Error('Send failed');
      (error as any).code = 'ERROR_CODE';

      mockRepository.create.mockResolvedValue(notification);
      mockTemplateService.renderEmailTemplate.mockResolvedValue({
        subject: 'Test Subject',
        htmlBody: '<html>Test</html>',
        textBody: 'Test Body',
      });
      mockDeliveryService.sendNotification.mockRejectedValue(error);
      const failedNotification = notification.markAsFailed('Send failed', 'ERROR_CODE', new Date());
      mockRepository.update.mockResolvedValue(failedNotification);

      await expect(
        useCase.execute(baseRequest, 'event-123', 'ENVELOPE_INVITATION')
      ).rejects.toThrow('Send failed');

      expect(mockRepository.update).toHaveBeenCalled();
    });
  });
});

