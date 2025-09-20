/**
 * @fileoverview ConsentEventService unit tests
 * @summary Tests for consent-specific domain event publishing
 * @description Comprehensive unit tests for ConsentEventService covering
 * all event publishing methods and error scenarios.
 */

import { ConsentEventService } from '@/services/events/ConsentEventService';
import { ConsentEventTypes } from '@/domain/enums/ConsentEventTypes';
import { OutboxRepository } from '@lawprotect/shared-ts';
import type { DomainEvent } from '@lawprotect/shared-ts';

describe('ConsentEventService', () => {
  let consentEventService: ConsentEventService;
  let mockOutboxRepository: jest.Mocked<OutboxRepository>;

  beforeEach(() => {
    // Mock OutboxRepository
    mockOutboxRepository = {
      save: jest.fn(),
      pullPending: jest.fn(),
      markDispatched: jest.fn(),
      markFailed: jest.fn(),
      countByStatus: jest.fn(),
      getById: jest.fn(),
      list: jest.fn()
    } as any;

    // Create service instance
    consentEventService = new ConsentEventService({
      outboxRepository: mockOutboxRepository,
      serviceName: 'signature-service',
      defaultTraceId: 'test-trace-id'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('publishModuleEvent', () => {
    it('should publish a module-specific event', async () => {
      const mockEvent: DomainEvent = {
        id: 'event-123',
        type: 'consent.module_event',
        payload: { test: 'data' },
        occurredAt: '2023-01-01T00:00:00.000Z'
      };
      const traceId = 'custom-trace-id';

      // Mock the publishDomainEvent method
      const publishDomainEventSpy = jest.spyOn(consentEventService, 'publishDomainEvent')
        .mockImplementation(jest.fn());

      await consentEventService.publishModuleEvent(mockEvent, traceId);

      expect(publishDomainEventSpy).toHaveBeenCalledWith(mockEvent, traceId);
    });

    it('should publish a module-specific event without traceId', async () => {
      const mockEvent: DomainEvent = {
        id: 'event-123',
        type: 'consent.module_event',
        payload: { test: 'data' },
        occurredAt: '2023-01-01T00:00:00.000Z'
      };

      // Mock the publishDomainEvent method
      const publishDomainEventSpy = jest.spyOn(consentEventService, 'publishDomainEvent')
        .mockImplementation(jest.fn());

      await consentEventService.publishModuleEvent(mockEvent);

      expect(publishDomainEventSpy).toHaveBeenCalledWith(mockEvent, undefined);
    });
  });

  describe('publishConsentGiven', () => {
    it('should publish consent given event with correct payload', async () => {
      const consentId = 'consent-123';
      const signerId = 'signer-456';
      const envelopeId = 'envelope-789';
      const userId = 'user-abc';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(consentEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await consentEventService.publishConsentGiven(consentId, signerId, envelopeId, userId);

      expect(publishEventSpy).toHaveBeenCalledWith(ConsentEventTypes.GIVEN, {
        consentId,
        signerId,
        envelopeId,
        userId,
        timestamp: expect.any(String)
      });
    });

    it('should handle different consent data', async () => {
      const testCases = [
        { consentId: 'consent-1', signerId: 'signer-1', envelopeId: 'envelope-1', userId: 'user-1' },
        { consentId: 'consent-2', signerId: 'signer-2', envelopeId: 'envelope-2', userId: 'user-2' },
        { consentId: 'consent-3', signerId: 'signer-3', envelopeId: 'envelope-3', userId: 'user-3' }
      ];
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(consentEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      for (const testCase of testCases) {
        await consentEventService.publishConsentGiven(
          testCase.consentId,
          testCase.signerId,
          testCase.envelopeId,
          testCase.userId
        );

        expect(publishEventSpy).toHaveBeenCalledWith(ConsentEventTypes.GIVEN, {
          consentId: testCase.consentId,
          signerId: testCase.signerId,
          envelopeId: testCase.envelopeId,
          userId: testCase.userId,
          timestamp: expect.any(String)
        });
      }
    });

    it('should generate timestamp correctly', async () => {
      const consentId = 'consent-123';
      const signerId = 'signer-456';
      const envelopeId = 'envelope-789';
      const userId = 'user-abc';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(consentEventService, 'publishEvent')
        .mockImplementation(jest.fn());
      const beforeTime = new Date();

      await consentEventService.publishConsentGiven(consentId, signerId, envelopeId, userId);

      const afterTime = new Date();

      expect(publishEventSpy).toHaveBeenCalledWith(ConsentEventTypes.GIVEN, {
        consentId,
        signerId,
        envelopeId,
        userId,
        timestamp: expect.any(String)
      });

      // Check that timestamp is within expected range
      const call = publishEventSpy.mock.calls[0];
      const payload = call[1] as Record<string, unknown>;
      const timestamp = new Date(payload.timestamp as string);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('publishConsentRevoked', () => {
    it('should publish consent revoked event with correct payload', async () => {
      const consentId = 'consent-123';
      const signerId = 'signer-456';
      const envelopeId = 'envelope-789';
      const userId = 'user-abc';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(consentEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await consentEventService.publishConsentRevoked(consentId, signerId, envelopeId, userId);

      expect(publishEventSpy).toHaveBeenCalledWith(ConsentEventTypes.REVOKED, {
        consentId,
        signerId,
        envelopeId,
        userId,
        timestamp: expect.any(String)
      });
    });

    it('should handle different consent data', async () => {
      const testCases = [
        { consentId: 'consent-1', signerId: 'signer-1', envelopeId: 'envelope-1', userId: 'user-1' },
        { consentId: 'consent-2', signerId: 'signer-2', envelopeId: 'envelope-2', userId: 'user-2' },
        { consentId: 'consent-3', signerId: 'signer-3', envelopeId: 'envelope-3', userId: 'user-3' }
      ];
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(consentEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      for (const testCase of testCases) {
        await consentEventService.publishConsentRevoked(
          testCase.consentId,
          testCase.signerId,
          testCase.envelopeId,
          testCase.userId
        );

        expect(publishEventSpy).toHaveBeenCalledWith(ConsentEventTypes.REVOKED, {
          consentId: testCase.consentId,
          signerId: testCase.signerId,
          envelopeId: testCase.envelopeId,
          userId: testCase.userId,
          timestamp: expect.any(String)
        });
      }
    });

    it('should generate timestamp correctly', async () => {
      const consentId = 'consent-123';
      const signerId = 'signer-456';
      const envelopeId = 'envelope-789';
      const userId = 'user-abc';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(consentEventService, 'publishEvent')
        .mockImplementation(jest.fn());
      const beforeTime = new Date();

      await consentEventService.publishConsentRevoked(consentId, signerId, envelopeId, userId);

      const afterTime = new Date();

      expect(publishEventSpy).toHaveBeenCalledWith(ConsentEventTypes.REVOKED, {
        consentId,
        signerId,
        envelopeId,
        userId,
        timestamp: expect.any(String)
      });

      // Check that timestamp is within expected range
      const call = publishEventSpy.mock.calls[0];
      const payload = call[1] as Record<string, unknown>;
      const timestamp = new Date(payload.timestamp as string);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from publishEvent in publishConsentGiven', async () => {
      const consentId = 'consent-123';
      const signerId = 'signer-456';
      const envelopeId = 'envelope-789';
      const userId = 'user-abc';
      const error = new Error('Publish failed');
      
      // Mock the publishEvent method to throw an error
      const publishEventSpy = jest.spyOn(consentEventService, 'publishEvent')
        .mockRejectedValueOnce(error);

      await expect(
        consentEventService.publishConsentGiven(consentId, signerId, envelopeId, userId)
      ).rejects.toThrow('Publish failed');

      expect(publishEventSpy).toHaveBeenCalled();
    });

    it('should propagate errors from publishEvent in publishConsentRevoked', async () => {
      const consentId = 'consent-123';
      const signerId = 'signer-456';
      const envelopeId = 'envelope-789';
      const userId = 'user-abc';
      const error = new Error('Publish failed');
      
      // Mock the publishEvent method to throw an error
      const publishEventSpy = jest.spyOn(consentEventService, 'publishEvent')
        .mockRejectedValueOnce(error);

      await expect(
        consentEventService.publishConsentRevoked(consentId, signerId, envelopeId, userId)
      ).rejects.toThrow('Publish failed');

      expect(publishEventSpy).toHaveBeenCalled();
    });

    it('should propagate errors from publishDomainEvent', async () => {
      const mockEvent: DomainEvent = {
        id: 'event-123',
        type: 'consent.module_event',
        payload: { test: 'data' },
        occurredAt: '2023-01-01T00:00:00.000Z'
      };
      const error = new Error('Domain event publish failed');
      
      // Mock the publishDomainEvent method to throw an error
      const publishDomainEventSpy = jest.spyOn(consentEventService, 'publishDomainEvent')
        .mockRejectedValueOnce(error);

      await expect(
        consentEventService.publishModuleEvent(mockEvent)
      ).rejects.toThrow('Domain event publish failed');

      expect(publishDomainEventSpy).toHaveBeenCalled();
    });
  });

  describe('Event type consistency', () => {
    it('should use consistent event type naming', async () => {
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(consentEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      // Test all event types follow the pattern
      await consentEventService.publishConsentGiven('consent-1', 'signer-1', 'envelope-1', 'user-1');
      expect(publishEventSpy).toHaveBeenCalledWith(ConsentEventTypes.GIVEN, expect.any(Object));

      await consentEventService.publishConsentRevoked('consent-2', 'signer-2', 'envelope-2', 'user-2');
      expect(publishEventSpy).toHaveBeenCalledWith(ConsentEventTypes.REVOKED, expect.any(Object));
    });
  });

  describe('Payload structure', () => {
    it('should maintain consistent payload structure for consent given', async () => {
      const consentId = 'consent-123';
      const signerId = 'signer-456';
      const envelopeId = 'envelope-789';
      const userId = 'user-abc';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(consentEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await consentEventService.publishConsentGiven(consentId, signerId, envelopeId, userId);

      const call = publishEventSpy.mock.calls[0];
      const payload = call[1] as Record<string, unknown>;

      expect(payload).toHaveProperty('consentId', consentId);
      expect(payload).toHaveProperty('signerId', signerId);
      expect(payload).toHaveProperty('envelopeId', envelopeId);
      expect(payload).toHaveProperty('userId', userId);
      expect(payload).toHaveProperty('timestamp');
      expect(typeof payload.timestamp).toBe('string');
    });

    it('should maintain consistent payload structure for consent revoked', async () => {
      const consentId = 'consent-123';
      const signerId = 'signer-456';
      const envelopeId = 'envelope-789';
      const userId = 'user-abc';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(consentEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await consentEventService.publishConsentRevoked(consentId, signerId, envelopeId, userId);

      const call = publishEventSpy.mock.calls[0];
      const payload = call[1] as Record<string, unknown>;

      expect(payload).toHaveProperty('consentId', consentId);
      expect(payload).toHaveProperty('signerId', signerId);
      expect(payload).toHaveProperty('envelopeId', envelopeId);
      expect(payload).toHaveProperty('userId', userId);
      expect(payload).toHaveProperty('timestamp');
      expect(typeof payload.timestamp).toBe('string');
    });
  });

  describe('Service configuration', () => {
    it('should be properly configured with outbox repository', () => {
      expect(consentEventService).toBeDefined();
      expect(consentEventService).toBeInstanceOf(ConsentEventService);
    });

    it('should have access to publishEvent method', () => {
      expect(typeof consentEventService.publishEvent).toBe('function');
    });

    it('should have access to publishDomainEvent method', () => {
      expect(typeof consentEventService.publishDomainEvent).toBe('function');
    });

    it('should have access to publishModuleEvent method', () => {
      expect(typeof consentEventService.publishModuleEvent).toBe('function');
    });
  });
});
