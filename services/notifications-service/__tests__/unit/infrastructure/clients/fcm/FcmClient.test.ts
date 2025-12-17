/**
 * @fileoverview FcmClient Tests - Unit tests for FcmClient
 * @summary Tests for FCM client operations
 * @description Comprehensive test suite for FcmClient covering
 * initialization, sending messages, bulk operations, and error handling.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { FcmClient } from '../../../../../src/infrastructure/clients/fcm/FcmClient';
import type { FcmMessage } from '../../../../../src/domain/types/push';
import { BadRequestError, InternalError } from '@lawprotect/shared-ts';

jest.mock('firebase-admin', () => {
  const mockMessaging = {
    send: jest.fn(),
  };
  return {
    credential: {
      cert: jest.fn(() => ({})),
    },
    apps: [],
    initializeApp: jest.fn(),
    messaging: jest.fn(() => mockMessaging),
  };
});

describe('FcmClient', () => {
  let client: FcmClient;
  const serviceAccountKey = JSON.stringify({
    type: 'service_account',
    project_id: 'test-project',
  });

  beforeEach(() => {
    jest.clearAllMocks();
    client = new FcmClient(serviceAccountKey, 'test-project');
  });

  describe('constructor', () => {
    it('initializes FCM with string serviceAccountKey', () => {
      expect(client).toBeInstanceOf(FcmClient);
    });

    it('initializes FCM with object serviceAccountKey', () => {
      const keyObject = { type: 'service_account' };
      const newClient = new FcmClient(keyObject, 'test-project');
      expect(newClient).toBeInstanceOf(FcmClient);
    });

    it('throws error on initialization failure', () => {
      const admin = require('firebase-admin');
      admin.credential.cert.mockImplementationOnce(() => {
        throw new Error('Init failed');
      });
      expect(() => new FcmClient(serviceAccountKey, 'test-project')).toThrow(InternalError);
    });
  });

  describe('send', () => {
    it('sends message successfully', async () => {
      const message: FcmMessage = {
        token: 'fcm-token-123',
        notification: {
          title: 'Test Title',
          body: 'Test Body',
        },
      };

      const admin = require('firebase-admin');
      const mockMessaging = admin.messaging();
      mockMessaging.send.mockResolvedValue('message-id-123');

      const result = await client.send(message);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('message-id-123');
    });

    it('sends message with data', async () => {
      const message: FcmMessage = {
        token: 'fcm-token-123',
        data: {
          key1: 'value1',
          key2: '123',
        },
      };

      const admin = require('firebase-admin');
      const mockMessaging = admin.messaging();
      mockMessaging.send.mockResolvedValue('message-id-123');

      const result = await client.send(message);

      expect(result.success).toBe(true);
    });

    it('throws error for empty device token', async () => {
      const message: FcmMessage = {
        token: '',
        notification: {
          title: 'Test',
          body: 'Test body',
        },
      };

      await expect(client.send(message)).rejects.toThrow(BadRequestError);
    });

    it('throws error for whitespace-only device token', async () => {
      const message: FcmMessage = {
        token: '   ',
        notification: {
          title: 'Test',
          body: 'Test body',
        },
      };

      await expect(client.send(message)).rejects.toThrow(BadRequestError);
    });

    it('handles FCM errors', async () => {
      const message: FcmMessage = {
        token: 'fcm-token-123',
        notification: {
          title: 'Test',
          body: 'Test body',
        },
      };

      const admin = require('firebase-admin');
      const mockMessaging = admin.messaging();
      mockMessaging.send.mockRejectedValue(new Error('FCM error'));

      await expect(client.send(message)).rejects.toThrow();
    });
  });

  describe('sendBulk', () => {
    it('sends bulk messages', async () => {
      const messages: FcmMessage[] = [
        {
          token: 'token-1',
          notification: { title: 'Message 1', body: 'Body 1' },
        },
        {
          token: 'token-2',
          notification: { title: 'Message 2', body: 'Body 2' },
        },
      ];

      const admin = require('firebase-admin');
      const mockMessaging = admin.messaging();
      mockMessaging.send.mockResolvedValue('message-id');

      const results = await client.sendBulk(messages);

      expect(results).toHaveLength(2);
      expect(mockMessaging.send).toHaveBeenCalledTimes(2);
    });

    it('handles partial failures in bulk send', async () => {
      const messages: FcmMessage[] = [
        {
          token: 'token-1',
          notification: { title: 'Message 1', body: 'Body 1' },
        },
        {
          token: 'token-2',
          notification: { title: 'Message 2', body: 'Body 2' },
        },
      ];

      const admin = require('firebase-admin');
      const mockMessaging = admin.messaging();
      mockMessaging.send
        .mockResolvedValueOnce('message-id-1')
        .mockRejectedValueOnce(new Error('Send failed'));

      const results = await client.sendBulk(messages);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });
});

