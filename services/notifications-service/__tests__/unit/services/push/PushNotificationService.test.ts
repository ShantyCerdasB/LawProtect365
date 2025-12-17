/**
 * @fileoverview PushNotificationService Tests - Unit tests for PushNotificationService
 * @summary Tests for push notification sending operations
 * @description Comprehensive test suite for PushNotificationService covering FCM/APNS sending,
 * platform detection, validation, bulk operations, and error handling.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { PushNotificationService } from '../../../../src/services/push/PushNotificationService';
import type { SendPushRequest } from '../../../../src/domain/types/push';
import type { FcmClient } from '../../../../src/infrastructure/clients/fcm';
import type { ApnsClient } from '../../../../src/infrastructure/clients/apns';
import { Platform, PushPriority } from '../../../../src/domain/enums';
import { pushSendFailed } from '../../../../src/notification-errors';
import { ServiceUnavailableError } from '@lawprotect/shared-ts';

describe('PushNotificationService', () => {
  let service: PushNotificationService;
  let mockFcmClient: jest.Mocked<FcmClient>;
  let mockApnsClient: jest.Mocked<ApnsClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFcmClient = {
      send: jest.fn(),
    } as any;

    mockApnsClient = {
      send: jest.fn(),
    } as any;

    service = new PushNotificationService(mockFcmClient, mockApnsClient);
  });

  describe('sendPush', () => {
    it('should send push via FCM for Android device', async () => {
      const request: SendPushRequest = {
        deviceToken: 'fcm-token-android-' + 'a'.repeat(140),
        title: 'Test Title',
        body: 'Test Body',
      };

      mockFcmClient.send.mockResolvedValue({
        success: true,
        messageId: 'fcm-msg-123',
      });

      const result = await service.sendPush(request);

      expect(result.messageId).toBe('fcm-msg-123');
      expect(result.deviceToken).toBe(request.deviceToken);
      expect(mockFcmClient.send).toHaveBeenCalled();
    });

    it('should send push via APNS for iOS device', async () => {
      const request: SendPushRequest = {
        deviceToken: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        title: 'Test Title',
        body: 'Test Body',
      };

      mockApnsClient.send.mockResolvedValue({
        sent: true,
        device: request.deviceToken,
        response: { status: '200' },
      });

      const result = await service.sendPush(request);

      expect(result.messageId).toContain('apns-');
      expect(result.deviceToken).toBe(request.deviceToken);
      expect(mockApnsClient.send).toHaveBeenCalled();
    });

    it('should throw error when FCM client not configured', async () => {
      const serviceWithoutFcm = new PushNotificationService(undefined, mockApnsClient);
      const request: SendPushRequest = {
        deviceToken: 'fcm-token-android-' + 'a'.repeat(140),
        title: 'Test Title',
        body: 'Test Body',
      };

      await expect(serviceWithoutFcm.sendPush(request)).rejects.toThrow(ServiceUnavailableError);
    });

    it('should throw error when APNS client not configured', async () => {
      const serviceWithoutApns = new PushNotificationService(mockFcmClient, undefined);
      const request: SendPushRequest = {
        deviceToken: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        title: 'Test Title',
        body: 'Test Body',
      };

      await expect(serviceWithoutApns.sendPush(request)).rejects.toThrow(ServiceUnavailableError);
    });

    it('should handle FCM send failure', async () => {
      const request: SendPushRequest = {
        deviceToken: 'fcm-token-android-' + 'a'.repeat(140),
        title: 'Test Title',
        body: 'Test Body',
      };

      mockFcmClient.send.mockResolvedValue({
        messageId: 'failed-msg',
        success: false,
        error: { code: 'ERROR', message: 'FCM send failed' },
      });

      await expect(service.sendPush(request)).rejects.toThrow(ServiceUnavailableError);
    });

    it('should handle APNS send failure', async () => {
      const request: SendPushRequest = {
        deviceToken: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        title: 'Test Title',
        body: 'Test Body',
      };

      mockApnsClient.send.mockResolvedValue({
        sent: false,
        device: request.deviceToken,
        response: { status: '400', reason: 'BadDeviceToken' },
      });

      await expect(service.sendPush(request)).rejects.toThrow(ServiceUnavailableError);
    });

    it('should convert data to FCM format', async () => {
      const request: SendPushRequest = {
        deviceToken: 'fcm-token-android-' + 'a'.repeat(140),
        title: 'Test Title',
        body: 'Test Body',
        data: {
          key1: 'value1',
          key2: 123,
          key3: { nested: 'object' },
        },
      };

      mockFcmClient.send.mockResolvedValue({
        success: true,
        messageId: 'fcm-msg-123',
      });

      await service.sendPush(request);

      const sentMessage = mockFcmClient.send.mock.calls[0][0];
      expect(sentMessage.data).toBeDefined();
      expect(sentMessage.data?.key1).toBe('value1');
      expect(sentMessage.data?.key2).toBe('123');
    });

    it('should include priority in FCM message', async () => {
      const request: SendPushRequest = {
        deviceToken: 'fcm-token-android-' + 'a'.repeat(140),
        title: 'Test Title',
        body: 'Test Body',
        priority: PushPriority.HIGH,
      };

      mockFcmClient.send.mockResolvedValue({
        success: true,
        messageId: 'fcm-msg-123',
      });

      await service.sendPush(request);

      const sentMessage = mockFcmClient.send.mock.calls[0][0];
      expect(sentMessage.android?.priority).toBe('high');
    });

    it('should include badge and sound in APNS notification', async () => {
      const request: SendPushRequest = {
        deviceToken: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        title: 'Test Title',
        body: 'Test Body',
        badge: 5,
        sound: 'default',
      };

      mockApnsClient.send.mockResolvedValue({
        sent: true,
        device: request.deviceToken,
        response: { status: '200' },
      });

      await service.sendPush(request);

      const sentNotification = mockApnsClient.send.mock.calls[0][0];
      expect(sentNotification.aps.badge).toBe(5);
      expect(sentNotification.aps.sound).toBe('default');
    });

    it('should throw error for invalid device token', async () => {
      const request: SendPushRequest = {
        deviceToken: '',
        title: 'Test Title',
        body: 'Test Body',
      };

      await expect(service.sendPush(request)).rejects.toThrow();
    });

    it('should throw error for missing title', async () => {
      const request: SendPushRequest = {
        deviceToken: 'fcm-token-android-' + 'a'.repeat(140),
        title: '',
        body: 'Test Body',
      };

      await expect(service.sendPush(request)).rejects.toThrow();
    });

    it('should throw error for missing body', async () => {
      const request: SendPushRequest = {
        deviceToken: 'fcm-token-android-' + 'a'.repeat(140),
        title: 'Test Title',
        body: '',
      };

      await expect(service.sendPush(request)).rejects.toThrow();
    });
  });

  describe('sendBulkPush', () => {
    it('should send bulk push notifications', async () => {
      const requests: SendPushRequest[] = [
        {
          deviceToken: 'fcm-token-android-' + 'a'.repeat(140),
          title: 'Title 1',
          body: 'Body 1',
        },
        {
          deviceToken: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
          title: 'Title 2',
          body: 'Body 2',
        },
      ];

      mockFcmClient.send.mockResolvedValue({
        success: true,
        messageId: 'fcm-msg-1',
      });
      mockApnsClient.send.mockResolvedValue({
        sent: true,
        device: requests[1].deviceToken,
        response: { status: '200' },
      });

      const results = await service.sendBulkPush(requests);

      expect(results).toHaveLength(2);
      expect(results[0].messageId).toBe('fcm-msg-1');
    });

    it('should handle partial failures in bulk send', async () => {
      const requests: SendPushRequest[] = [
        {
          deviceToken: 'fcm-token-android-12345678901234567890123456789012345678901234567890123456789012345678901234567890',
          title: 'Title 1',
          body: 'Body 1',
        },
        {
          deviceToken: 'invalid-token',
          title: 'Title 2',
          body: 'Body 2',
        },
      ];

      mockFcmClient.send.mockResolvedValue({
        success: true,
        messageId: 'fcm-msg-1',
      });

      const results = await service.sendBulkPush(requests);

      expect(results).toHaveLength(2);
      expect(results[1].messageId).toContain('failed-');
    });

    it('should throw error for empty array', async () => {
      await expect(service.sendBulkPush([])).rejects.toThrow();
    });
  });
});

