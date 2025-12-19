/**
 * @fileoverview NotificationOrchestrator Tests - Unit tests for NotificationOrchestrator
 * @summary Tests for orchestrator delegation to use cases
 * @description Comprehensive test suite for NotificationOrchestrator covering all methods
 * that delegate to use cases, ensuring proper delegation without business logic.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { NotificationOrchestrator } from '../../../../src/services/orchestrators/NotificationOrchestrator';
import type { NotificationOrchestratorDependencies } from '../../../../src/domain/types/orchestrator';
import type { ProcessNotificationRequest, NotificationRequest } from '../../../../src/domain/types/orchestrator';
import { RecipientType } from '@prisma/client';

describe('NotificationOrchestrator', () => {
  let orchestrator: NotificationOrchestrator;
  let mockDependencies: NotificationOrchestratorDependencies;
  let mockProcessNotificationUseCase: { execute: jest.MockedFunction<(request: ProcessNotificationRequest) => Promise<any>> };
  let mockSendNotificationUseCase: { execute: jest.MockedFunction<(request: NotificationRequest, eventId: string, eventType: string, metadata?: Record<string, unknown>) => Promise<any>> };
  let mockRetryNotificationUseCase: { execute: jest.MockedFunction<(notificationId: string) => Promise<any>> };

  beforeEach(() => {
    jest.clearAllMocks();

    mockProcessNotificationUseCase = {
      execute: jest.fn(),
    };

    mockSendNotificationUseCase = {
      execute: jest.fn(),
    };

    mockRetryNotificationUseCase = {
      execute: jest.fn(),
    };

    mockDependencies = {
      processNotificationUseCase: mockProcessNotificationUseCase as any,
      sendNotificationUseCase: mockSendNotificationUseCase as any,
      retryNotificationUseCase: mockRetryNotificationUseCase as any,
    };

    orchestrator = new NotificationOrchestrator(mockDependencies);
  });

  describe('processNotification', () => {
    it('should delegate to processNotificationUseCase', async () => {
      const request: ProcessNotificationRequest = {
        eventId: 'test-event-id',
        eventType: 'ENVELOPE_INVITATION',
        source: 'signature-service',
        payload: { envelopeId: 'test-envelope-id' },
        occurredAt: new Date(),
        metadata: {},
      };

      const expectedResult = {
        processedCount: 1,
        failedCount: 0,
        errors: [],
      };

      mockProcessNotificationUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.processNotification(request);

      expect(result).toEqual(expectedResult);
      expect(mockProcessNotificationUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockProcessNotificationUseCase.execute).toHaveBeenCalledWith(request);
    });

    it('should propagate errors from processNotificationUseCase', async () => {
      const request: ProcessNotificationRequest = {
        eventId: 'test-event-id',
        eventType: 'ENVELOPE_INVITATION',
        source: 'signature-service',
        payload: {},
        occurredAt: new Date(),
        metadata: {},
      };

      const error = new Error('Use case error');
      mockProcessNotificationUseCase.execute.mockRejectedValue(error);

      await expect(orchestrator.processNotification(request)).rejects.toThrow('Use case error');
      expect(mockProcessNotificationUseCase.execute).toHaveBeenCalledWith(request);
    });
  });

  describe('sendNotification', () => {
    it('should delegate to sendNotificationUseCase', async () => {
      const request: NotificationRequest = {
        channel: 'EMAIL' as const,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const eventId = 'test-event-id';
      const eventType = 'ENVELOPE_INVITATION';
      const metadata = { key: 'value' };

      const expectedResult = {
        messageId: 'msg-123',
        sentAt: new Date(),
      };

      mockSendNotificationUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.sendNotification(request, eventId, eventType, metadata);

      expect(result).toEqual(expectedResult);
      expect(mockSendNotificationUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockSendNotificationUseCase.execute).toHaveBeenCalledWith(request, eventId, eventType, metadata);
    });

    it('should delegate to sendNotificationUseCase without metadata', async () => {
      const request: NotificationRequest = {
        channel: 'SMS' as const,
        recipient: '+1234567890',
        recipientType: RecipientType.PHONE,
        body: 'Test SMS',
      };

      const eventId = 'test-event-id';
      const eventType = 'ENVELOPE_INVITATION';

      const expectedResult = {
        messageId: 'msg-456',
        sentAt: new Date(),
      };

      mockSendNotificationUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.sendNotification(request, eventId, eventType);

      expect(result).toEqual(expectedResult);
      expect(mockSendNotificationUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockSendNotificationUseCase.execute).toHaveBeenCalledWith(request, eventId, eventType, undefined);
    });

    it('should propagate errors from sendNotificationUseCase', async () => {
      const request: NotificationRequest = {
        channel: 'EMAIL' as const,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const error = new Error('Send error');
      mockSendNotificationUseCase.execute.mockRejectedValue(error);

      await expect(orchestrator.sendNotification(request, 'event-id', 'event-type')).rejects.toThrow('Send error');
    });
  });

  describe('retryNotification', () => {
    it('should delegate to retryNotificationUseCase', async () => {
      const notificationId = 'notification-123';

      const expectedResult = {
        messageId: 'msg-789',
        sentAt: new Date(),
      };

      mockRetryNotificationUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.retryNotification(notificationId);

      expect(result).toEqual(expectedResult);
      expect(mockRetryNotificationUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockRetryNotificationUseCase.execute).toHaveBeenCalledWith(notificationId);
    });

    it('should propagate errors from retryNotificationUseCase', async () => {
      const notificationId = 'notification-123';
      const error = new Error('Retry error');
      mockRetryNotificationUseCase.execute.mockRejectedValue(error);

      await expect(orchestrator.retryNotification(notificationId)).rejects.toThrow('Retry error');
      expect(mockRetryNotificationUseCase.execute).toHaveBeenCalledWith(notificationId);
    });
  });
});



