/**
 * @fileoverview ApnsClient Tests - Unit tests for ApnsClient
 * @summary Tests for APNS client operations
 * @description Comprehensive test suite for ApnsClient covering
 * initialization, sending notifications, bulk operations, and error handling.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ApnsClient } from '../../../../../src/infrastructure/clients/apns/ApnsClient';
import type { ApnsNotification } from '../../../../../src/domain/types/push';
import { BadRequestError, InternalError } from '@lawprotect/shared-ts';

const mockSend = jest.fn() as jest.MockedFunction<any>;

jest.mock('apn', () => {
  return {
    Provider: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
    Notification: jest.fn().mockImplementation(() => ({})),
  };
});

describe('ApnsClient', () => {
  let client: ApnsClient;
  let getProviderSend: () => jest.MockedFunction<any>;
  const config = {
    keyId: 'key-id',
    teamId: 'team-id',
    key: 'key-content',
    bundleId: 'com.test.app',
    production: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const apn = require('apn');
    getProviderSend = () => {
      const providerInstance = apn.Provider.mock.results[apn.Provider.mock.results.length - 1]?.value;
      return providerInstance?.send;
    };
    const providerSend = getProviderSend();
    if (providerSend) {
      providerSend.mockClear();
      providerSend.mockResolvedValue({
        sent: [{ device: 'test-device' }],
        failed: [],
      });
    }
    client = new ApnsClient(config);
  });

  describe('constructor', () => {
    it('initializes APNS provider with config', () => {
      expect(client).toBeInstanceOf(ApnsClient);
    });

    it('throws error on initialization failure', () => {
      const apn = require('apn');
      apn.Provider.mockImplementationOnce(() => {
        throw new Error('Init failed');
      });
      expect(() => new ApnsClient(config)).toThrow(InternalError);
    });
  });

  describe('send', () => {
    it('sends notification successfully', async () => {
      const notification: ApnsNotification = {
        deviceToken: 'a'.repeat(64),
        aps: {
          alert: 'Test message',
        },
      };

      getProviderSend().mockResolvedValue({
        sent: [{ device: notification.deviceToken }],
        failed: [],
      });

      const result = await client.send(notification);

      expect(result.sent).toBe(true);
      expect(result.device).toBe(notification.deviceToken);
      expect(result.status).toBe('sent');
    });

    it('handles failed notification', async () => {
      const notification: ApnsNotification = {
        deviceToken: 'a'.repeat(64),
        aps: {
          alert: 'Test message',
        },
      };

      getProviderSend().mockResolvedValue({
        sent: [],
        failed: [{
          device: notification.deviceToken,
          response: {
            reason: 'BadDeviceToken',
          },
        }],
      });

      const result = await client.send(notification);

      expect(result.sent).toBe(false);
      expect(result.device).toBe(notification.deviceToken);
      expect(result.status).toBe('failed');
      expect(result.response?.reason).toBe('BadDeviceToken');
    });

    it('handles failed notification without response reason', async () => {
      const notification: ApnsNotification = {
        deviceToken: 'a'.repeat(64),
        aps: {
          alert: 'Test message',
        },
      };

      getProviderSend().mockResolvedValue({
        sent: [],
        failed: [{
          device: notification.deviceToken,
        }],
      });

      const result = await client.send(notification);

      expect(result.sent).toBe(false);
      expect(result.device).toBe(notification.deviceToken);
      expect(result.status).toBe('failed');
      expect(result.response?.reason).toBe('Unknown error');
    });

    it('throws error for empty device token', async () => {
      const notification: ApnsNotification = {
        deviceToken: '',
        aps: {
          alert: 'Test message',
        },
      };

      await expect(client.send(notification)).rejects.toThrow(BadRequestError);
    });

    it('throws error for whitespace-only device token', async () => {
      const notification: ApnsNotification = {
        deviceToken: '   ',
        aps: {
          alert: 'Test message',
        },
      };

      await expect(client.send(notification)).rejects.toThrow(BadRequestError);
    });

    it('handles APNS errors', async () => {
      const notification: ApnsNotification = {
        deviceToken: 'a'.repeat(64),
        aps: {
          alert: 'Test message',
        },
      };

      getProviderSend().mockRejectedValue(new Error('APNS error'));

      await expect(client.send(notification)).rejects.toThrow();
    });
  });

  describe('sendBulk', () => {
    it('sends bulk notifications', async () => {
      const notifications: ApnsNotification[] = [
        {
          deviceToken: 'a'.repeat(64),
          aps: { alert: 'Message 1' },
        },
        {
          deviceToken: 'b'.repeat(64),
          aps: { alert: 'Message 2' },
        },
      ];

      const providerSend = getProviderSend();
      providerSend
        .mockResolvedValueOnce({
          sent: [{ device: notifications[0].deviceToken }],
          failed: [],
        })
        .mockResolvedValueOnce({
          sent: [{ device: notifications[1].deviceToken }],
          failed: [],
        });

      const results = await client.sendBulk(notifications);

      expect(results).toHaveLength(2);
      expect(providerSend).toHaveBeenCalledTimes(2);
    });

    it('handles partial failures in bulk send', async () => {
      const notifications: ApnsNotification[] = [
        {
          deviceToken: 'a'.repeat(64),
          aps: { alert: 'Message 1' },
        },
        {
          deviceToken: 'b'.repeat(64),
          aps: { alert: 'Message 2' },
        },
      ];

      const providerSend = getProviderSend();
      providerSend
        .mockResolvedValueOnce({
          sent: [{ device: notifications[0].deviceToken }],
          failed: [],
        })
        .mockRejectedValueOnce(new Error('Send failed'));

      const results = await client.sendBulk(notifications);

      expect(results).toHaveLength(2);
      expect(results[0].sent).toBe(true);
      expect(results[1].sent).toBe(false);
      expect(results[1].status).toBe('failed');
    });
  });

  describe('buildApnsNotification', () => {
    it('builds notification with string alert', async () => {
      const notification: ApnsNotification = {
        deviceToken: 'a'.repeat(64),
        aps: {
          alert: 'Simple alert',
        },
      };

      const providerSend = getProviderSend();
      providerSend.mockResolvedValue({
        sent: [{ device: notification.deviceToken }],
        failed: [],
      });

      await client.send(notification);

      expect(providerSend).toHaveBeenCalled();
      const callArgs = providerSend.mock.calls[0] as any[];
      expect(callArgs[0].alert).toBe('Simple alert');
    });

    it('builds notification with alert object', async () => {
      const notification: ApnsNotification = {
        deviceToken: 'a'.repeat(64),
        aps: {
          alert: {
            title: 'Title',
            body: 'Body',
          },
        },
      };

      const providerSend = getProviderSend();
      providerSend.mockResolvedValue({
        sent: [{ device: notification.deviceToken }],
        failed: [],
      });

      await client.send(notification);

      expect(providerSend).toHaveBeenCalled();
      const callArgs = providerSend.mock.calls[0] as any[];
      expect(callArgs[0].alert).toEqual({ title: 'Title', body: 'Body' });
    });

    it('builds notification with badge', async () => {
      const notification: ApnsNotification = {
        deviceToken: 'a'.repeat(64),
        aps: {
          alert: 'Test',
          badge: 5,
        },
      };

      const providerSend = getProviderSend();
      providerSend.mockResolvedValue({
        sent: [{ device: notification.deviceToken }],
        failed: [],
      });

      await client.send(notification);

      expect(providerSend).toHaveBeenCalled();
      const callArgs = providerSend.mock.calls[0] as any[];
      expect(callArgs[0].badge).toBe(5);
    });

    it('builds notification with sound', async () => {
      const notification: ApnsNotification = {
        deviceToken: 'a'.repeat(64),
        aps: {
          alert: 'Test',
          sound: 'default',
        },
      };

      const providerSend = getProviderSend();
      providerSend.mockResolvedValue({
        sent: [{ device: notification.deviceToken }],
        failed: [],
      });

      await client.send(notification);

      expect(providerSend).toHaveBeenCalled();
      const callArgs = providerSend.mock.calls[0] as any[];
      expect(callArgs[0].sound).toBe('default');
    });

    it('builds notification with content-available', async () => {
      const notification: ApnsNotification = {
        deviceToken: 'a'.repeat(64),
        aps: {
          alert: 'Test',
          'content-available': 1,
        },
      };

      const providerSend = getProviderSend();
      providerSend.mockResolvedValue({
        sent: [{ device: notification.deviceToken }],
        failed: [],
      });

      await client.send(notification);

      expect(providerSend).toHaveBeenCalled();
      const callArgs = providerSend.mock.calls[0] as any[];
      expect(callArgs[0].contentAvailable).toBe(true);
    });

    it('builds notification with content-available 0', async () => {
      const notification: ApnsNotification = {
        deviceToken: 'a'.repeat(64),
        aps: {
          alert: 'Test',
          'content-available': 0,
        },
      };

      const providerSend = getProviderSend();
      providerSend.mockResolvedValue({
        sent: [{ device: notification.deviceToken }],
        failed: [],
      });

      await client.send(notification);

      expect(providerSend).toHaveBeenCalled();
      const callArgs = providerSend.mock.calls[0] as any[];
      expect(callArgs[0].contentAvailable).toBe(false);
    });

    it('builds notification with thread-id', async () => {
      const notification: ApnsNotification = {
        deviceToken: 'a'.repeat(64),
        aps: {
          alert: 'Test',
          'thread-id': 'thread-123',
        },
      };

      const providerSend = getProviderSend();
      providerSend.mockResolvedValue({
        sent: [{ device: notification.deviceToken }],
        failed: [],
      });

      await client.send(notification);

      expect(providerSend).toHaveBeenCalled();
      const callArgs = providerSend.mock.calls[0] as any[];
      expect(callArgs[0].threadId).toBe('thread-123');
    });

    it('builds notification with mutable-content', async () => {
      const notification: ApnsNotification = {
        deviceToken: 'a'.repeat(64),
        aps: {
          alert: 'Test',
          'mutable-content': 1,
        },
      };

      const providerSend = getProviderSend();
      providerSend.mockResolvedValue({
        sent: [{ device: notification.deviceToken }],
        failed: [],
      });

      await client.send(notification);

      expect(providerSend).toHaveBeenCalled();
      const callArgs = providerSend.mock.calls[0] as any[];
      expect(callArgs[0].mutableContent).toBe(true);
    });

    it('builds notification with mutable-content 0', async () => {
      const notification: ApnsNotification = {
        deviceToken: 'a'.repeat(64),
        aps: {
          alert: 'Test',
          'mutable-content': 0,
        },
      };

      const providerSend = getProviderSend();
      providerSend.mockResolvedValue({
        sent: [{ device: notification.deviceToken }],
        failed: [],
      });

      await client.send(notification);

      expect(providerSend).toHaveBeenCalled();
      const callArgs = providerSend.mock.calls[0] as any[];
      expect(callArgs[0].mutableContent).toBe(false);
    });

    it('builds notification with data payload', async () => {
      const notification: ApnsNotification = {
        deviceToken: 'a'.repeat(64),
        aps: {
          alert: 'Test',
        },
        data: {
          key1: 'value1',
          key2: 'value2',
        },
      };

      const providerSend = getProviderSend();
      providerSend.mockResolvedValue({
        sent: [{ device: notification.deviceToken }],
        failed: [],
      });

      await client.send(notification);

      expect(providerSend).toHaveBeenCalled();
      const callArgs = providerSend.mock.calls[0] as any[];
      expect(callArgs[0].payload).toEqual(notification.data);
    });

    it('builds notification with topic', async () => {
      const notification: ApnsNotification = {
        deviceToken: 'a'.repeat(64),
        aps: {
          alert: 'Test',
        },
      };

      const providerSend = getProviderSend();
      providerSend.mockResolvedValue({
        sent: [{ device: notification.deviceToken }],
        failed: [],
      });

      await client.send(notification);

      expect(providerSend).toHaveBeenCalled();
      const callArgs = providerSend.mock.calls[0] as any[];
      expect(callArgs[0].topic).toBe(config.bundleId);
    });
  });
});

