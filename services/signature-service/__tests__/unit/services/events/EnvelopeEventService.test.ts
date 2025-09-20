/**
 * @fileoverview EnvelopeEventService unit tests
 * @summary Tests for envelope-specific domain event publishing
 * @description Comprehensive unit tests for EnvelopeEventService covering
 * all event publishing methods and error scenarios.
 */

import { EnvelopeEventService } from '@/services/events/EnvelopeEventService';
import { Envelope } from '@/domain/entities/Envelope';
import { EnvelopeStatus } from '@/domain/enums/EnvelopeStatus';
import { EnvelopeEventTypes } from '@/domain/enums/EnvelopeEventTypes';
import { OutboxRepository } from '@lawprotect/shared-ts';
import type { DomainEvent } from '@lawprotect/shared-ts';

describe('EnvelopeEventService', () => {
  let envelopeEventService: EnvelopeEventService;
  let mockOutboxRepository: jest.Mocked<OutboxRepository>;
  let mockEnvelope: jest.Mocked<Envelope>;

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
    envelopeEventService = new EnvelopeEventService({
      outboxRepository: mockOutboxRepository,
      serviceName: 'signature-service',
      defaultTraceId: 'test-trace-id'
    });

    // Mock Envelope entity
    mockEnvelope = {
      getId: jest.fn().mockReturnValue({ getValue: () => 'envelope-123' }),
      getStatus: jest.fn().mockReturnValue(EnvelopeStatus.DRAFT),
      getOwnerId: jest.fn().mockReturnValue('owner-456'),
      getDocumentId: jest.fn().mockReturnValue('document-789'),
      getCreatedAt: jest.fn().mockReturnValue({ toISOString: () => '2023-01-01T00:00:00.000Z' }),
      getUpdatedAt: jest.fn().mockReturnValue({ toISOString: () => '2023-01-01T12:00:00.000Z' }),
      getMetadata: jest.fn().mockReturnValue({
        title: 'Test Envelope',
        description: 'Test Description',
        expiresAt: new Date('2023-12-31T23:59:59.000Z')
      })
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('publishModuleEvent', () => {
    it('should publish a module-specific event', async () => {
      const mockEvent: DomainEvent = {
        id: 'event-123',
        type: 'envelope.module_event',
        payload: { test: 'data' },
        occurredAt: '2023-01-01T00:00:00.000Z'
      };
      const traceId = 'custom-trace-id';

      // Mock the publishDomainEvent method
      const publishDomainEventSpy = jest.spyOn(envelopeEventService, 'publishDomainEvent')
        .mockImplementation(jest.fn());

      await envelopeEventService.publishModuleEvent(mockEvent, traceId);

      expect(publishDomainEventSpy).toHaveBeenCalledWith(mockEvent, traceId);
    });

    it('should publish a module-specific event without traceId', async () => {
      const mockEvent: DomainEvent = {
        id: 'event-123',
        type: 'envelope.module_event',
        payload: { test: 'data' },
        occurredAt: '2023-01-01T00:00:00.000Z'
      };

      // Mock the publishDomainEvent method
      const publishDomainEventSpy = jest.spyOn(envelopeEventService, 'publishDomainEvent')
        .mockImplementation(jest.fn());

      await envelopeEventService.publishModuleEvent(mockEvent);

      expect(publishDomainEventSpy).toHaveBeenCalledWith(mockEvent, undefined);
    });
  });

  describe('publishEnvelopeCreated', () => {
    it('should publish envelope created event with correct payload', async () => {
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await envelopeEventService.publishEnvelopeCreated(mockEnvelope, userId);

      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.CREATED, {
        envelopeId: 'envelope-123',
        title: 'Test Envelope',
        description: 'Test Description',
        status: EnvelopeStatus.DRAFT,
        ownerId: 'owner-456',
        documentId: 'document-789',
        expiresAt: '2023-12-31T23:59:59.000Z',
        createdAt: '2023-01-01T00:00:00.000Z',
        userId: 'user-123'
      });
    });

    it('should call envelope entity methods correctly', async () => {
      const userId = 'user-123';

      // Mock the publishEvent method
      jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await envelopeEventService.publishEnvelopeCreated(mockEnvelope, userId);

      expect(mockEnvelope.getId).toHaveBeenCalled();
      expect(mockEnvelope.getStatus).toHaveBeenCalled();
      expect(mockEnvelope.getOwnerId).toHaveBeenCalled();
      expect(mockEnvelope.getDocumentId).toHaveBeenCalled();
      expect(mockEnvelope.getCreatedAt).toHaveBeenCalled();
      expect(mockEnvelope.getMetadata).toHaveBeenCalled();
    });

    it('should handle envelope without expiration date', async () => {
      const userId = 'user-123';
      const envelopeWithoutExpiry = {
        ...mockEnvelope,
        getMetadata: jest.fn().mockReturnValue({
          title: 'Test Envelope',
          description: 'Test Description',
          expiresAt: undefined
        })
      };

      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await envelopeEventService.publishEnvelopeCreated(envelopeWithoutExpiry as any, userId);

      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.CREATED, {
        envelopeId: 'envelope-123',
        title: 'Test Envelope',
        description: 'Test Description',
        status: EnvelopeStatus.DRAFT,
        ownerId: 'owner-456',
        documentId: 'document-789',
        expiresAt: undefined,
        createdAt: '2023-01-01T00:00:00.000Z',
        userId: 'user-123'
      });
    });
  });

  describe('publishEnvelopeUpdated', () => {
    it('should publish envelope updated event with correct payload', async () => {
      const userId = 'user-123';
      const changes = { status: EnvelopeStatus.SENT };
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await envelopeEventService.publishEnvelopeUpdated(mockEnvelope, userId, changes);

      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.UPDATED, {
        envelopeId: 'envelope-123',
        title: 'Test Envelope',
        description: 'Test Description',
        status: EnvelopeStatus.DRAFT,
        ownerId: 'owner-456',
        changes,
        updatedAt: '2023-01-01T12:00:00.000Z',
        userId: 'user-123'
      });
    });

    it('should handle empty changes object', async () => {
      const userId = 'user-123';
      const changes = {};
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await envelopeEventService.publishEnvelopeUpdated(mockEnvelope, userId, changes);

      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.UPDATED, {
        envelopeId: 'envelope-123',
        title: 'Test Envelope',
        description: 'Test Description',
        status: EnvelopeStatus.DRAFT,
        ownerId: 'owner-456',
        changes: {},
        updatedAt: '2023-01-01T12:00:00.000Z',
        userId: 'user-123'
      });
    });
  });

  describe('publishEnvelopeStatusChanged', () => {
    it('should publish envelope status changed event with correct payload', async () => {
      const oldStatus = EnvelopeStatus.DRAFT;
      const newStatus = EnvelopeStatus.SENT;
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await envelopeEventService.publishEnvelopeStatusChanged(
        mockEnvelope,
        oldStatus,
        newStatus,
        userId
      );

      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.STATUS_CHANGED, {
        envelopeId: 'envelope-123',
        title: 'Test Envelope',
        ownerId: 'owner-456',
        oldStatus,
        newStatus,
        changedAt: expect.any(String),
        userId: 'user-123'
      });
    });

    it('should handle all envelope status transitions', async () => {
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const statusTransitions = [
        [EnvelopeStatus.DRAFT, EnvelopeStatus.SENT],
        [EnvelopeStatus.SENT, EnvelopeStatus.IN_PROGRESS],
        [EnvelopeStatus.IN_PROGRESS, EnvelopeStatus.COMPLETED],
        [EnvelopeStatus.COMPLETED, EnvelopeStatus.CANCELLED]
      ];

      for (const [oldStatus, newStatus] of statusTransitions) {
        await envelopeEventService.publishEnvelopeStatusChanged(
          mockEnvelope,
          oldStatus,
          newStatus,
          userId
        );

        expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.STATUS_CHANGED, {
          envelopeId: 'envelope-123',
          title: 'Test Envelope',
          ownerId: 'owner-456',
          oldStatus,
          newStatus,
          changedAt: expect.any(String),
          userId: 'user-123'
        });
      }
    });
  });

  describe('publishEnvelopeDeleted', () => {
    it('should publish envelope deleted event with correct payload', async () => {
      const envelopeId = 'envelope-123';
      const title = 'Test Envelope';
      const ownerId = 'owner-456';
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await envelopeEventService.publishEnvelopeDeleted(
        envelopeId,
        title,
        ownerId,
        userId
      );

      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.DELETED, {
        envelopeId,
        title,
        ownerId,
        deletedAt: expect.any(String),
        userId
      });
    });

    it('should handle different envelope data', async () => {
      const testCases = [
        { envelopeId: 'env-1', title: 'Envelope 1', ownerId: 'owner-1' },
        { envelopeId: 'env-2', title: 'Envelope 2', ownerId: 'owner-2' },
        { envelopeId: 'env-3', title: 'Envelope 3', ownerId: 'owner-3' }
      ];
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      for (const testCase of testCases) {
        await envelopeEventService.publishEnvelopeDeleted(
          testCase.envelopeId,
          testCase.title,
          testCase.ownerId,
          userId
        );

        expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.DELETED, {
          envelopeId: testCase.envelopeId,
          title: testCase.title,
          ownerId: testCase.ownerId,
          deletedAt: expect.any(String),
          userId
        });
      }
    });
  });

  describe('publishEnvelopeExpired', () => {
    it('should publish envelope expired event with correct payload', async () => {
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await envelopeEventService.publishEnvelopeExpired(mockEnvelope);

      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.EXPIRED, {
        envelopeId: 'envelope-123',
        title: 'Test Envelope',
        ownerId: 'owner-456',
        expiresAt: '2023-12-31T23:59:59.000Z',
        expiredAt: expect.any(String)
      });
    });

    it('should handle envelope without expiration date', async () => {
      const envelopeWithoutExpiry = {
        ...mockEnvelope,
        getMetadata: jest.fn().mockReturnValue({
          title: 'Test Envelope',
          expiresAt: undefined
        })
      };

      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await envelopeEventService.publishEnvelopeExpired(envelopeWithoutExpiry as any);

      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.EXPIRED, {
        envelopeId: 'envelope-123',
        title: 'Test Envelope',
        ownerId: 'owner-456',
        expiresAt: undefined,
        expiredAt: expect.any(String)
      });
    });
  });

  describe('publishEnvelopeCompleted', () => {
    it('should publish envelope completed event with correct payload', async () => {
      const completedAt = new Date('2023-01-01T12:00:00.000Z');
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await envelopeEventService.publishEnvelopeCompleted(mockEnvelope, completedAt);

      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.COMPLETED, {
        envelopeId: 'envelope-123',
        title: 'Test Envelope',
        ownerId: 'owner-456',
        completedAt: '2023-01-01T12:00:00.000Z'
      });
    });

    it('should handle different completion times', async () => {
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const completionTimes = [
        new Date('2023-01-01T00:00:00.000Z'),
        new Date('2023-01-01T12:00:00.000Z'),
        new Date('2023-01-01T23:59:59.999Z')
      ];

      for (const completedAt of completionTimes) {
        await envelopeEventService.publishEnvelopeCompleted(mockEnvelope, completedAt);

        expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.COMPLETED, {
          envelopeId: 'envelope-123',
          title: 'Test Envelope',
          ownerId: 'owner-456',
          completedAt: completedAt.toISOString()
        });
      }
    });
  });

  describe('publishEnvelopeCancelled', () => {
    it('should publish envelope cancelled event with correct payload', async () => {
      const cancelledAt = new Date('2023-01-01T12:00:00.000Z');
      const reason = 'User requested cancellation';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await envelopeEventService.publishEnvelopeCancelled(mockEnvelope, cancelledAt, reason);

      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.CANCELLED, {
        envelopeId: 'envelope-123',
        title: 'Test Envelope',
        ownerId: 'owner-456',
        cancelledAt: '2023-01-01T12:00:00.000Z',
        reason
      });
    });

    it('should handle envelope cancelled without reason', async () => {
      const cancelledAt = new Date('2023-01-01T12:00:00.000Z');
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await envelopeEventService.publishEnvelopeCancelled(mockEnvelope, cancelledAt);

      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.CANCELLED, {
        envelopeId: 'envelope-123',
        title: 'Test Envelope',
        ownerId: 'owner-456',
        cancelledAt: '2023-01-01T12:00:00.000Z',
        reason: undefined
      });
    });

    it('should handle different cancellation reasons', async () => {
      const cancelledAt = new Date('2023-01-01T12:00:00.000Z');
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const cancellationReasons = [
        'User requested cancellation',
        'Document expired',
        'Legal compliance issue',
        'Technical error'
      ];

      for (const reason of cancellationReasons) {
        await envelopeEventService.publishEnvelopeCancelled(mockEnvelope, cancelledAt, reason);

        expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.CANCELLED, {
          envelopeId: 'envelope-123',
          title: 'Test Envelope',
          ownerId: 'owner-456',
          cancelledAt: '2023-01-01T12:00:00.000Z',
          reason
        });
      }
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from publishEvent', async () => {
      const userId = 'user-123';
      const error = new Error('Publish failed');
      
      // Mock the publishEvent method to throw an error
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockRejectedValueOnce(error);

      await expect(
        envelopeEventService.publishEnvelopeCreated(mockEnvelope, userId)
      ).rejects.toThrow('Publish failed');

      expect(publishEventSpy).toHaveBeenCalled();
    });

    it('should propagate errors from publishDomainEvent', async () => {
      const mockEvent: DomainEvent = {
        id: 'event-123',
        type: 'envelope.module_event',
        payload: { test: 'data' },
        occurredAt: '2023-01-01T00:00:00.000Z'
      };
      const error = new Error('Domain event publish failed');
      
      // Mock the publishDomainEvent method to throw an error
      const publishDomainEventSpy = jest.spyOn(envelopeEventService, 'publishDomainEvent')
        .mockRejectedValueOnce(error);

      await expect(
        envelopeEventService.publishModuleEvent(mockEvent)
      ).rejects.toThrow('Domain event publish failed');

      expect(publishDomainEventSpy).toHaveBeenCalled();
    });
  });

  describe('Event type consistency', () => {
    it('should use consistent event type naming', async () => {
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      // Test all event types follow the pattern
      await envelopeEventService.publishEnvelopeCreated(mockEnvelope, 'user-123');
      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.CREATED, expect.any(Object));

      await envelopeEventService.publishEnvelopeUpdated(mockEnvelope, 'user-123', {});
      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.UPDATED, expect.any(Object));

      await envelopeEventService.publishEnvelopeStatusChanged(
        mockEnvelope, EnvelopeStatus.DRAFT, EnvelopeStatus.SENT, 'user-123'
      );
      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.STATUS_CHANGED, expect.any(Object));

      await envelopeEventService.publishEnvelopeDeleted('env-1', 'title', 'owner-1', 'user-123');
      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.DELETED, expect.any(Object));

      await envelopeEventService.publishEnvelopeExpired(mockEnvelope);
      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.EXPIRED, expect.any(Object));

      await envelopeEventService.publishEnvelopeCompleted(mockEnvelope, new Date());
      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.COMPLETED, expect.any(Object));

      await envelopeEventService.publishEnvelopeCancelled(mockEnvelope, new Date(), 'reason');
      expect(publishEventSpy).toHaveBeenCalledWith(EnvelopeEventTypes.CANCELLED, expect.any(Object));
    });
  });

  describe('Timestamp handling', () => {
    it('should generate consistent timestamps for all events', async () => {
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(envelopeEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await envelopeEventService.publishEnvelopeCreated(mockEnvelope, 'user-123');
      await envelopeEventService.publishEnvelopeStatusChanged(
        mockEnvelope, EnvelopeStatus.DRAFT, EnvelopeStatus.SENT, 'user-123'
      );

      // Check that timestamps are properly formatted
      const calls = publishEventSpy.mock.calls;
      for (const call of calls) {
        const payload = call[1] as Record<string, unknown>;
        const timestamp = payload.createdAt || payload.changedAt;
        expect(timestamp).toBeDefined();
        expect(typeof timestamp).toBe('string');
        expect(new Date(timestamp as string)).toBeInstanceOf(Date);
      }
    });
  });
});
