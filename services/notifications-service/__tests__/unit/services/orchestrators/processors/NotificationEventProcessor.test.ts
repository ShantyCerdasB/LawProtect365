/**
 * @fileoverview NotificationEventProcessor Tests - Unit tests for NotificationEventProcessor
 * @summary Tests for event processing using Strategy Pattern
 * @description Comprehensive test suite for NotificationEventProcessor covering event processing,
 * strategy delegation, and error handling.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { NotificationEventProcessor } from '../../../../../src/services/orchestrators/processors/NotificationEventProcessor';
import { StrategyRegistry } from '../../../../../src/domain/strategies';
import type { ProcessNotificationRequest, NotificationRequest } from '../../../../../src/domain/types/orchestrator';
import { eventTypeUnknown, eventValidationFailed } from '../../../../../src/notification-errors';
import { RecipientType } from '@prisma/client';

describe('NotificationEventProcessor', () => {
  let processor: NotificationEventProcessor;
  let mockStrategyRegistry: StrategyRegistry;
  let mockProcess: jest.MockedFunction<(eventType: string, source: string, payload: Record<string, unknown>, metadata?: Record<string, unknown>) => Promise<NotificationRequest[]>>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProcess = jest.fn<(eventType: string, source: string, payload: Record<string, unknown>, metadata?: Record<string, unknown>) => Promise<NotificationRequest[]>>();
    mockStrategyRegistry = {
      process: mockProcess,
    } as any;

    processor = new NotificationEventProcessor(mockStrategyRegistry);
  });

  describe('processEvent', () => {
    it('should process event and return notification requests', async () => {
      const request: ProcessNotificationRequest = {
        eventId: 'test-event-id-1',
        eventType: 'ENVELOPE_INVITATION',
        source: 'signature-service',
        payload: { envelopeId: 'test-envelope-id' },
        occurredAt: new Date(),
        metadata: { timestamp: new Date().toISOString() },
      };

      const expectedRequests: NotificationRequest[] = [
        {
          channel: 'EMAIL' as const,
          recipient: 'test@example.com',
          recipientType: RecipientType.EMAIL,
          subject: 'Test Subject',
          body: 'Test Body',
        },
      ];

      mockProcess.mockResolvedValue(expectedRequests);

      const result = await processor.processEvent(request);

      expect(result).toEqual(expectedRequests);
      expect(mockProcess).toHaveBeenCalledWith(
        request.eventType,
        request.source,
        request.payload,
        request.metadata
      );
    });

    it('should delegate to strategy registry with correct parameters', async () => {
      const request: ProcessNotificationRequest = {
        eventId: 'test-event-id-2',
        eventType: 'ENVELOPE_INVITATION',
        source: 'signature-service',
        payload: { envelopeId: 'test-envelope-id' },
        occurredAt: new Date(),
        metadata: { timestamp: new Date().toISOString() },
      };

      mockProcess.mockResolvedValue([]);

      await processor.processEvent(request);

      expect(mockProcess).toHaveBeenCalledTimes(1);
      expect(mockProcess).toHaveBeenCalledWith(
        'ENVELOPE_INVITATION',
        'signature-service',
        { envelopeId: 'test-envelope-id' },
        request.metadata
      );
    });

    it('should handle empty notification requests', async () => {
      const request: ProcessNotificationRequest = {
        eventId: 'test-event-id-3',
        eventType: 'ENVELOPE_INVITATION',
        source: 'signature-service',
        payload: {},
        occurredAt: new Date(),
        metadata: {},
      };

      mockProcess.mockResolvedValue([]);

      const result = await processor.processEvent(request);

      expect(result).toEqual([]);
      expect(mockProcess).toHaveBeenCalledWith(
        request.eventType,
        request.source,
        request.payload,
        request.metadata
      );
    });

    it('should handle multiple notification requests', async () => {
      const request: ProcessNotificationRequest = {
        eventId: 'test-event-id-4',
        eventType: 'ENVELOPE_INVITATION',
        source: 'signature-service',
        payload: { envelopeId: 'test-envelope-id' },
        occurredAt: new Date(),
        metadata: {},
      };

      const expectedRequests: NotificationRequest[] = [
        {
          channel: 'EMAIL' as const,
          recipient: 'test1@example.com',
          recipientType: RecipientType.EMAIL,
          subject: 'Test Subject 1',
          body: 'Test Body 1',
        },
        {
          channel: 'SMS' as const,
          recipient: '+1234567890',
          recipientType: RecipientType.PHONE,
          body: 'Test SMS',
        },
      ];

      mockProcess.mockResolvedValue(expectedRequests);

      const result = await processor.processEvent(request);

      expect(result).toEqual(expectedRequests);
      expect(result).toHaveLength(2);
    });

    it('should propagate errors from strategy registry', async () => {
      const request: ProcessNotificationRequest = {
        eventId: 'test-event-id-5',
        eventType: 'UNKNOWN_EVENT',
        source: 'unknown-service',
        payload: {},
        occurredAt: new Date(),
        metadata: {},
      };

      mockProcess.mockRejectedValue(eventTypeUnknown({ eventType: 'UNKNOWN_EVENT' }));

      await expect(processor.processEvent(request)).rejects.toThrow();
      expect(mockProcess).toHaveBeenCalledWith(
        request.eventType,
        request.source,
        request.payload,
        request.metadata
      );
    });

    it('should handle validation errors from strategy registry', async () => {
      const request: ProcessNotificationRequest = {
        eventId: 'test-event-id-6',
        eventType: 'ENVELOPE_INVITATION',
        source: 'signature-service',
        payload: { invalid: 'data' },
        occurredAt: new Date(),
        metadata: {},
      };

      mockProcess.mockRejectedValue(eventValidationFailed({ payload: request.payload }));

      await expect(processor.processEvent(request)).rejects.toThrow();
      expect(mockProcess).toHaveBeenCalledWith(
        request.eventType,
        request.source,
        request.payload,
        request.metadata
      );
    });

    it('should process different event types', async () => {
      const eventTypes = [
        'ENVELOPE_INVITATION',
        'DOCUMENT_VIEW_INVITATION',
        'SIGNER_DECLINED',
        'ENVELOPE_CANCELLED',
        'USER_REGISTERED',
      ];

      for (const eventType of eventTypes) {
        const request: ProcessNotificationRequest = {
          eventId: `test-event-id-${eventType}`,
          eventType,
          source: 'signature-service',
          payload: {},
          occurredAt: new Date(),
          metadata: {},
        };

        mockProcess.mockResolvedValue([]);

        await processor.processEvent(request);

        expect(mockProcess).toHaveBeenCalledWith(
          eventType,
          request.source,
          request.payload,
          request.metadata
        );
      }

      expect(mockProcess).toHaveBeenCalledTimes(eventTypes.length);
    });

    it('should process events from different sources', async () => {
      const sources = ['signature-service', 'auth-service'];

      for (const source of sources) {
        const request: ProcessNotificationRequest = {
          eventId: `test-event-id-${source}`,
          eventType: 'TEST_EVENT',
          source,
          payload: {},
          occurredAt: new Date(),
          metadata: {},
        };

        mockProcess.mockResolvedValue([]);

        await processor.processEvent(request);

        expect(mockProcess).toHaveBeenCalledWith(
          request.eventType,
          source,
          request.payload,
          request.metadata
        );
      }

      expect(mockProcess).toHaveBeenCalledTimes(sources.length);
    });
  });
});

