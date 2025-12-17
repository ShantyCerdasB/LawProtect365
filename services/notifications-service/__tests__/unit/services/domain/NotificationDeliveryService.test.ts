/**
 * @fileoverview NotificationDeliveryService Tests - Unit tests for NotificationDeliveryService
 * @summary Tests for notification delivery coordination across channels
 * @description Comprehensive test suite for NotificationDeliveryService covering all delivery
 * channels (email, SMS, push), feature flags, error handling, and channel coordination.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { NotificationDeliveryService } from '../../../../src/services/domain/NotificationDeliveryService';
import { NotificationChannel } from '@prisma/client';
import { channelDisabled, invalidChannel } from '../../../../src/notification-errors';
import { BadRequestError, UnprocessableEntityError } from '@lawprotect/shared-ts';
import { DEFAULT_NOTIFICATION_SUBJECT } from '../../../../src/domain/constants';

describe('NotificationDeliveryService', () => {
  let service: NotificationDeliveryService;
  let mockEmailService: any;
  let mockSmsService: any;
  let mockPushNotificationService: any;
  let mockConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEmailService = {
      sendEmail: jest.fn()
    };

    mockSmsService = {
      sendSms: jest.fn()
    };

    mockPushNotificationService = {
      sendPush: jest.fn()
    };

    mockConfig = {
      features: {
        enableEmail: true,
        enableSms: true,
        enablePush: true
      }
    };

    service = new NotificationDeliveryService(
      mockEmailService,
      mockSmsService,
      mockPushNotificationService,
      mockConfig
    );
  });

  describe('sendNotification', () => {
    it('sends email notification when channel is EMAIL', async () => {
      const recipient = 'test@example.com';
      const subject = 'Test Subject';
      const body = 'Test Body';
      const htmlBody = '<p>Test Body</p>';

      mockEmailService.sendEmail.mockResolvedValue({
        messageId: 'email-123',
        sentAt: new Date()
      });

      const result = await service.sendNotification(
        NotificationChannel.EMAIL,
        recipient,
        subject,
        body,
        htmlBody
      );

      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: recipient,
        subject,
        body,
        htmlBody
      });
      expect(result.messageId).toBe('email-123');
      expect(result.sentAt).toBeInstanceOf(Date);
    });

    it('sends SMS notification when channel is SMS', async () => {
      const recipient = '+1234567890';
      const body = 'Test SMS';

      mockSmsService.sendSms.mockResolvedValue({
        messageId: 'sms-123',
        sentAt: new Date()
      });

      const result = await service.sendNotification(
        NotificationChannel.SMS,
        recipient,
        undefined,
        body
      );

      expect(mockSmsService.sendSms).toHaveBeenCalledWith({
        phoneNumber: recipient,
        message: body
      });
      expect(result.messageId).toBe('sms-123');
    });

    it('sends push notification when channel is PUSH', async () => {
      const recipient = 'device-token-123';
      const subject = 'Push Title';
      const body = 'Push Body';
      const metadata = { key: 'value' };

      mockPushNotificationService.sendPush.mockResolvedValue({
        messageId: 'push-123',
        sentAt: new Date()
      });

      const result = await service.sendNotification(
        NotificationChannel.PUSH,
        recipient,
        subject,
        body,
        undefined,
        metadata
      );

      expect(mockPushNotificationService.sendPush).toHaveBeenCalledWith({
        deviceToken: recipient,
        title: subject,
        body,
        data: metadata
      });
      expect(result.messageId).toBe('push-123');
    });

    it('throws invalidChannel for unsupported channel', async () => {
      await expect(
        service.sendNotification(
          'UNSUPPORTED' as NotificationChannel,
          'recipient',
          undefined,
          'body'
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('throws channelDisabled when email is disabled', async () => {
      mockConfig.features.enableEmail = false;

      await expect(
        service.sendNotification(
          NotificationChannel.EMAIL,
          'test@example.com',
          'Subject',
          'Body'
        )
      ).rejects.toThrow(UnprocessableEntityError);
    });

    it('throws channelDisabled when SMS is disabled', async () => {
      mockConfig.features.enableSms = false;

      await expect(
        service.sendNotification(
          NotificationChannel.SMS,
          '+1234567890',
          undefined,
          'Body'
        )
      ).rejects.toThrow(UnprocessableEntityError);
    });

    it('throws channelDisabled when push is disabled', async () => {
      mockConfig.features.enablePush = false;

      await expect(
        service.sendNotification(
          NotificationChannel.PUSH,
          'device-token',
          'Title',
          'Body'
        )
      ).rejects.toThrow(UnprocessableEntityError);
    });

    it('uses default subject when subject is undefined for email', async () => {
      const recipient = 'test@example.com';
      const body = 'Test Body';

      mockEmailService.sendEmail.mockResolvedValue({
        messageId: 'email-123',
        sentAt: new Date()
      });

      await service.sendNotification(
        NotificationChannel.EMAIL,
        recipient,
        undefined,
        body
      );

      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: recipient,
        subject: DEFAULT_NOTIFICATION_SUBJECT,
        body,
        htmlBody: undefined
      });
    });

    it('uses default subject when subject is undefined for push', async () => {
      const recipient = 'device-token';
      const body = 'Push Body';

      mockPushNotificationService.sendPush.mockResolvedValue({
        messageId: 'push-123',
        sentAt: new Date()
      });

      await service.sendNotification(
        NotificationChannel.PUSH,
        recipient,
        undefined,
        body
      );

      expect(mockPushNotificationService.sendPush).toHaveBeenCalledWith({
        deviceToken: recipient,
        title: DEFAULT_NOTIFICATION_SUBJECT,
        body,
        data: undefined
      });
    });
  });
});

