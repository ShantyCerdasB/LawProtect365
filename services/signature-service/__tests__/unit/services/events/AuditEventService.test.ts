/**
 * @fileoverview AuditEventService unit tests
 * @summary Tests for audit-specific domain event publishing
 * @description Comprehensive unit tests for AuditEventService covering
 * all event publishing methods and error scenarios.
 */

import { AuditEventService } from '@/services/events/AuditEventService';
import { AuditEvent } from '@/domain/entities/AuditEvent';
import { AuditEventTypes } from '@/domain/enums/AuditEventTypes';
import { OutboxRepository } from '@lawprotect/shared-ts';
import type { DomainEvent } from '@lawprotect/shared-ts';

describe('AuditEventService', () => {
  let auditEventService: AuditEventService;
  let mockOutboxRepository: jest.Mocked<OutboxRepository>;
  let mockAuditEvent: jest.Mocked<AuditEvent>;

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
    auditEventService = new AuditEventService({
      outboxRepository: mockOutboxRepository,
      serviceName: 'signature-service',
      defaultTraceId: 'test-trace-id'
    });

    // Mock AuditEvent entity
    mockAuditEvent = {
      getId: jest.fn().mockReturnValue({ getValue: () => 'audit-event-123' }),
      getType: jest.fn().mockReturnValue('ENVELOPE_CREATED'),
      getEntityId: jest.fn().mockReturnValue('entity-456'),
      getEntityType: jest.fn().mockReturnValue('envelope'),
      getUserId: jest.fn().mockReturnValue('user-789'),
      getMetadata: jest.fn().mockReturnValue({ action: 'create', source: 'api' }),
      getTimestamp: jest.fn().mockReturnValue({ toISOString: () => '2023-01-01T00:00:00.000Z' })
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('publishModuleEvent', () => {
    it('should publish a module-specific event', async () => {
      const mockEvent: DomainEvent = {
        id: 'event-123',
        type: 'audit.module_event',
        payload: { test: 'data' },
        occurredAt: '2023-01-01T00:00:00.000Z'
      };
      const traceId = 'custom-trace-id';

      // Mock the publishDomainEvent method
      const publishDomainEventSpy = jest.spyOn(auditEventService, 'publishDomainEvent')
        .mockImplementation(jest.fn());

      await auditEventService.publishModuleEvent(mockEvent, traceId);

      expect(publishDomainEventSpy).toHaveBeenCalledWith(mockEvent, traceId);
    });

    it('should publish a module-specific event without traceId', async () => {
      const mockEvent: DomainEvent = {
        id: 'event-123',
        type: 'audit.module_event',
        payload: { test: 'data' },
        occurredAt: '2023-01-01T00:00:00.000Z'
      };

      // Mock the publishDomainEvent method
      const publishDomainEventSpy = jest.spyOn(auditEventService, 'publishDomainEvent')
        .mockImplementation(jest.fn());

      await auditEventService.publishModuleEvent(mockEvent);

      expect(publishDomainEventSpy).toHaveBeenCalledWith(mockEvent, undefined);
    });
  });

  describe('publishAuditEventCreated', () => {
    it('should publish audit event created with correct payload', async () => {
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(auditEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await auditEventService.publishAuditEventCreated(mockAuditEvent);

      expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.EVENT_CREATED, {
        auditEventId: 'audit-event-123',
        type: 'ENVELOPE_CREATED',
        entityId: 'entity-456',
        entityType: 'envelope',
        userId: 'user-789',
        metadata: { action: 'create', source: 'api' },
        timestamp: '2023-01-01T00:00:00.000Z'
      });
    });

    it('should call audit event entity methods correctly', async () => {
      // Mock the publishEvent method
      jest.spyOn(auditEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await auditEventService.publishAuditEventCreated(mockAuditEvent);

      expect(mockAuditEvent.getId).toHaveBeenCalled();
      expect(mockAuditEvent.getType).toHaveBeenCalled();
      expect(mockAuditEvent.getEntityId).toHaveBeenCalled();
      expect(mockAuditEvent.getEntityType).toHaveBeenCalled();
      expect(mockAuditEvent.getUserId).toHaveBeenCalled();
      expect(mockAuditEvent.getMetadata).toHaveBeenCalled();
      expect(mockAuditEvent.getTimestamp).toHaveBeenCalled();
    });

    it('should handle different audit event types', async () => {
      const auditEventTypes = [
        'ENVELOPE_CREATED',
        'SIGNER_ADDED',
        'SIGNATURE_COMPLETED',
        'DOCUMENT_ACCESSED'
      ];

      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(auditEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      for (const eventType of auditEventTypes) {
        const auditEvent = {
          ...mockAuditEvent,
          getType: jest.fn().mockReturnValue(eventType)
        };

        await auditEventService.publishAuditEventCreated(auditEvent as any);

        expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.EVENT_CREATED, {
          auditEventId: 'audit-event-123',
          type: eventType,
          entityId: 'entity-456',
          entityType: 'envelope',
          userId: 'user-789',
          metadata: { action: 'create', source: 'api' },
          timestamp: '2023-01-01T00:00:00.000Z'
        });
      }
    });
  });

  describe('publishAuditTrailAccessed', () => {
    it('should publish audit trail accessed event with correct payload', async () => {
      const entityId = 'entity-123';
      const entityType = 'envelope';
      const userId = 'user-456';
      const accessedAt = new Date('2023-01-01T12:00:00.000Z');
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(auditEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await auditEventService.publishAuditTrailAccessed(entityId, entityType, userId, accessedAt);

      expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.TRAIL_ACCESSED, {
        entityId,
        entityType,
        userId,
        accessedAt: '2023-01-01T12:00:00.000Z'
      });
    });

    it('should handle different entity types', async () => {
      const entityTypes = ['envelope', 'signer', 'signature', 'document'];
      const entityId = 'entity-123';
      const userId = 'user-456';
      const accessedAt = new Date('2023-01-01T12:00:00.000Z');
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(auditEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      for (const entityType of entityTypes) {
        await auditEventService.publishAuditTrailAccessed(entityId, entityType, userId, accessedAt);

        expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.TRAIL_ACCESSED, {
          entityId,
          entityType,
          userId,
          accessedAt: '2023-01-01T12:00:00.000Z'
        });
      }
    });

    it('should handle different access times', async () => {
      const entityId = 'entity-123';
      const entityType = 'envelope';
      const userId = 'user-456';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(auditEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const accessTimes = [
        new Date('2023-01-01T00:00:00.000Z'),
        new Date('2023-01-01T12:00:00.000Z'),
        new Date('2023-01-01T23:59:59.999Z')
      ];

      for (const accessedAt of accessTimes) {
        await auditEventService.publishAuditTrailAccessed(entityId, entityType, userId, accessedAt);

        expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.TRAIL_ACCESSED, {
          entityId,
          entityType,
          userId,
          accessedAt: accessedAt.toISOString()
        });
      }
    });
  });

  describe('publishAuditEventExported', () => {
    it('should publish audit event exported with correct payload', async () => {
      const entityId = 'entity-123';
      const entityType = 'envelope';
      const userId = 'user-456';
      const exportedAt = new Date('2023-01-01T12:00:00.000Z');
      const exportFormat = 'CSV';
      const eventCount = 150;
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(auditEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await auditEventService.publishAuditEventExported(
        entityId,
        entityType,
        userId,
        exportedAt,
        exportFormat,
        eventCount
      );

      expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.EVENTS_EXPORTED, {
        entityId,
        entityType,
        userId,
        exportedAt: '2023-01-01T12:00:00.000Z',
        exportFormat,
        eventCount
      });
    });

    it('should handle different export formats', async () => {
      const entityId = 'entity-123';
      const entityType = 'envelope';
      const userId = 'user-456';
      const exportedAt = new Date('2023-01-01T12:00:00.000Z');
      const eventCount = 100;
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(auditEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const exportFormats = ['CSV', 'JSON', 'XML', 'PDF'];

      for (const exportFormat of exportFormats) {
        await auditEventService.publishAuditEventExported(
          entityId,
          entityType,
          userId,
          exportedAt,
          exportFormat,
          eventCount
        );

        expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.EVENTS_EXPORTED, {
          entityId,
          entityType,
          userId,
          exportedAt: '2023-01-01T12:00:00.000Z',
          exportFormat,
          eventCount
        });
      }
    });

    it('should handle different event counts', async () => {
      const entityId = 'entity-123';
      const entityType = 'envelope';
      const userId = 'user-456';
      const exportedAt = new Date('2023-01-01T12:00:00.000Z');
      const exportFormat = 'CSV';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(auditEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const eventCounts = [0, 1, 100, 1000, 10000];

      for (const eventCount of eventCounts) {
        await auditEventService.publishAuditEventExported(
          entityId,
          entityType,
          userId,
          exportedAt,
          exportFormat,
          eventCount
        );

        expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.EVENTS_EXPORTED, {
          entityId,
          entityType,
          userId,
          exportedAt: '2023-01-01T12:00:00.000Z',
          exportFormat,
          eventCount
        });
      }
    });
  });

  describe('publishAuditEventDeleted', () => {
    it('should publish audit event deleted with correct payload', async () => {
      const auditEventId = 'audit-event-123';
      const entityId = 'entity-456';
      const entityType = 'envelope';
      const userId = 'user-789';
      const deletedAt = new Date('2023-01-01T12:00:00.000Z');
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(auditEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await auditEventService.publishAuditEventDeleted(
        auditEventId,
        entityId,
        entityType,
        userId,
        deletedAt
      );

      expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.EVENT_DELETED, {
        auditEventId,
        entityId,
        entityType,
        userId,
        deletedAt: '2023-01-01T12:00:00.000Z'
      });
    });

    it('should handle different deletion times', async () => {
      const auditEventId = 'audit-event-123';
      const entityId = 'entity-456';
      const entityType = 'envelope';
      const userId = 'user-789';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(auditEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const deletionTimes = [
        new Date('2023-01-01T00:00:00.000Z'),
        new Date('2023-01-01T12:00:00.000Z'),
        new Date('2023-01-01T23:59:59.999Z')
      ];

      for (const deletedAt of deletionTimes) {
        await auditEventService.publishAuditEventDeleted(
          auditEventId,
          entityId,
          entityType,
          userId,
          deletedAt
        );

        expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.EVENT_DELETED, {
          auditEventId,
          entityId,
          entityType,
          userId,
          deletedAt: deletedAt.toISOString()
        });
      }
    });
  });

  describe('publishAuditEventsCleanedUp', () => {
    it('should publish audit events cleaned up with correct payload', async () => {
      const cleanedUpCount = 500;
      const olderThanDate = new Date('2022-01-01T00:00:00.000Z');
      const cleanedUpAt = new Date('2023-01-01T12:00:00.000Z');
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(auditEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await auditEventService.publishAuditEventsCleanedUp(
        cleanedUpCount,
        olderThanDate,
        cleanedUpAt
      );

      expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.EVENTS_CLEANED_UP, {
        cleanedUpCount,
        olderThanDate: '2022-01-01T00:00:00.000Z',
        cleanedUpAt: '2023-01-01T12:00:00.000Z'
      });
    });

    it('should handle different cleanup counts', async () => {
      const olderThanDate = new Date('2022-01-01T00:00:00.000Z');
      const cleanedUpAt = new Date('2023-01-01T12:00:00.000Z');
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(auditEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const cleanupCounts = [0, 1, 100, 1000, 10000];

      for (const cleanedUpCount of cleanupCounts) {
        await auditEventService.publishAuditEventsCleanedUp(
          cleanedUpCount,
          olderThanDate,
          cleanedUpAt
        );

        expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.EVENTS_CLEANED_UP, {
          cleanedUpCount,
          olderThanDate: '2022-01-01T00:00:00.000Z',
          cleanedUpAt: '2023-01-01T12:00:00.000Z'
        });
      }
    });

    it('should handle different date thresholds', async () => {
      const cleanedUpCount = 100;
      const cleanedUpAt = new Date('2023-01-01T12:00:00.000Z');
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(auditEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const dateThresholds = [
        new Date('2022-01-01T00:00:00.000Z'),
        new Date('2022-06-01T00:00:00.000Z'),
        new Date('2022-12-31T23:59:59.999Z')
      ];

      for (const olderThanDate of dateThresholds) {
        await auditEventService.publishAuditEventsCleanedUp(
          cleanedUpCount,
          olderThanDate,
          cleanedUpAt
        );

        expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.EVENTS_CLEANED_UP, {
          cleanedUpCount,
          olderThanDate: olderThanDate.toISOString(),
          cleanedUpAt: '2023-01-01T12:00:00.000Z'
        });
      }
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from publishEvent', async () => {
      const error = new Error('Publish failed');
      
      // Mock the publishEvent method to throw an error
      const publishEventSpy = jest.spyOn(auditEventService, 'publishEvent')
        .mockRejectedValueOnce(error);

      await expect(
        auditEventService.publishAuditEventCreated(mockAuditEvent)
      ).rejects.toThrow('Publish failed');

      expect(publishEventSpy).toHaveBeenCalled();
    });

    it('should propagate errors from publishDomainEvent', async () => {
      const mockEvent: DomainEvent = {
        id: 'event-123',
        type: 'audit.module_event',
        payload: { test: 'data' },
        occurredAt: '2023-01-01T00:00:00.000Z'
      };
      const error = new Error('Domain event publish failed');
      
      // Mock the publishDomainEvent method to throw an error
      const publishDomainEventSpy = jest.spyOn(auditEventService, 'publishDomainEvent')
        .mockRejectedValueOnce(error);

      await expect(
        auditEventService.publishModuleEvent(mockEvent)
      ).rejects.toThrow('Domain event publish failed');

      expect(publishDomainEventSpy).toHaveBeenCalled();
    });
  });

  describe('Event type consistency', () => {
    it('should use consistent event type naming', async () => {
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(auditEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      // Test all event types follow the pattern
      await auditEventService.publishAuditEventCreated(mockAuditEvent);
      expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.EVENT_CREATED, expect.any(Object));

      await auditEventService.publishAuditTrailAccessed('entity-1', 'envelope', 'user-1', new Date());
      expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.TRAIL_ACCESSED, expect.any(Object));

      await auditEventService.publishAuditEventExported('entity-1', 'envelope', 'user-1', new Date(), 'CSV', 100);
      expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.EVENTS_EXPORTED, expect.any(Object));

      await auditEventService.publishAuditEventDeleted('audit-1', 'entity-1', 'envelope', 'user-1', new Date());
      expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.EVENT_DELETED, expect.any(Object));

      await auditEventService.publishAuditEventsCleanedUp(100, new Date(), new Date());
      expect(publishEventSpy).toHaveBeenCalledWith(AuditEventTypes.EVENTS_CLEANED_UP, expect.any(Object));
    });
  });

  describe('Timestamp handling', () => {
    it('should handle timestamps correctly for all methods', async () => {
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(auditEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const testDate = new Date('2023-01-01T12:00:00.000Z');

      await auditEventService.publishAuditTrailAccessed('entity-1', 'envelope', 'user-1', testDate);
      await auditEventService.publishAuditEventExported('entity-1', 'envelope', 'user-1', testDate, 'CSV', 100);
      await auditEventService.publishAuditEventDeleted('audit-1', 'entity-1', 'envelope', 'user-1', testDate);
      await auditEventService.publishAuditEventsCleanedUp(100, testDate, testDate);

      const calls = publishEventSpy.mock.calls;
      for (const call of calls) {
        const payload = call[1] as Record<string, unknown>;
        const timestampFields = ['accessedAt', 'exportedAt', 'deletedAt', 'olderThanDate', 'cleanedUpAt'];
        
        for (const field of timestampFields) {
          if (payload[field]) {
            expect(payload[field]).toBe('2023-01-01T12:00:00.000Z');
          }
        }
      }
    });
  });
});
