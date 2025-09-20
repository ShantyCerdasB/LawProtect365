/**
 * @fileoverview AuditService unit tests
 * @summary Tests for audit business logic operations
 * @description Comprehensive unit tests for AuditService covering
 * all business logic methods and error scenarios.
 */

import { AuditService } from '@/services/AuditService';
import { AuditRepository } from '@/repositories/AuditRepository';
import { AuditEvent } from '@/domain/types/audit/AuditEvent';
import { AuditEventType } from '@/domain/enums/AuditEventType';
import { CreateAuditEventRequest } from '@/domain/types/audit/CreateAuditEventRequest';
import { NotFoundError, BadRequestError, ErrorCodes } from '@lawprotect/shared-ts';

describe('AuditService', () => {
  let auditService: AuditService;
  let mockAuditRepository: jest.Mocked<AuditRepository>;
  let mockAuditEvent: jest.Mocked<AuditEvent>;

  beforeEach(() => {
    // Mock AuditRepository
    mockAuditRepository = {
      create: jest.fn(),
      getById: jest.fn(),
      listByEnvelope: jest.fn(),
      listByUser: jest.fn(),
      listByEventType: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    // Create service instance
    auditService = new AuditService(mockAuditRepository);

    // Mock AuditEvent
    mockAuditEvent = {
      getId: jest.fn().mockReturnValue({ getValue: () => 'audit-event-123' }),
      getType: jest.fn().mockReturnValue(AuditEventType.ENVELOPE_CREATED),
      getEnvelopeId: jest.fn().mockReturnValue('envelope-456'),
      getUserId: jest.fn().mockReturnValue('user-789'),
      getDescription: jest.fn().mockReturnValue('Test audit event'),
      getTimestamp: jest.fn().mockReturnValue({ toISOString: () => '2023-01-01T00:00:00.000Z' }),
      getMetadata: jest.fn().mockReturnValue({ action: 'create' })
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should create audit event successfully', async () => {
      const request: CreateAuditEventRequest = {
        type: AuditEventType.ENVELOPE_CREATED,
        envelopeId: 'envelope-123',
        userId: 'user-456',
        description: 'Envelope created',
        metadata: { action: 'create' }
      };

      mockAuditRepository.create.mockResolvedValue(mockAuditEvent);

      const result = await auditService.createEvent(request);

      expect(mockAuditRepository.create).toHaveBeenCalledWith(request);
      expect(result).toBe(mockAuditEvent);
    });

    it('should validate required fields and throw BadRequestError for missing type', async () => {
      const request: CreateAuditEventRequest = {
        type: undefined as any,
        envelopeId: 'envelope-123',
        userId: 'user-456',
        description: 'Envelope created'
      };

      await expect(auditService.createEvent(request)).rejects.toThrow(BadRequestError);
      await expect(auditService.createEvent(request)).rejects.toThrow('Audit event type is required');
      expect(mockAuditRepository.create).not.toHaveBeenCalled();
    });

    it('should validate required fields and throw BadRequestError for missing envelopeId', async () => {
      const request: CreateAuditEventRequest = {
        type: AuditEventType.ENVELOPE_CREATED,
        envelopeId: '',
        userId: 'user-456',
        description: 'Envelope created'
      };

      await expect(auditService.createEvent(request)).rejects.toThrow(BadRequestError);
      await expect(auditService.createEvent(request)).rejects.toThrow('Envelope ID is required');
      expect(mockAuditRepository.create).not.toHaveBeenCalled();
    });

    it('should validate required fields and throw BadRequestError for whitespace-only envelopeId', async () => {
      const request: CreateAuditEventRequest = {
        type: AuditEventType.ENVELOPE_CREATED,
        envelopeId: '   ',
        userId: 'user-456',
        description: 'Envelope created'
      };

      await expect(auditService.createEvent(request)).rejects.toThrow(BadRequestError);
      await expect(auditService.createEvent(request)).rejects.toThrow('Envelope ID is required');
      expect(mockAuditRepository.create).not.toHaveBeenCalled();
    });

    it('should validate required fields and throw BadRequestError for missing description', async () => {
      const request: CreateAuditEventRequest = {
        type: AuditEventType.ENVELOPE_CREATED,
        envelopeId: 'envelope-123',
        userId: 'user-456',
        description: ''
      };

      await expect(auditService.createEvent(request)).rejects.toThrow(BadRequestError);
      await expect(auditService.createEvent(request)).rejects.toThrow('Description is required');
      expect(mockAuditRepository.create).not.toHaveBeenCalled();
    });

    it('should validate required fields and throw BadRequestError for whitespace-only description', async () => {
      const request: CreateAuditEventRequest = {
        type: AuditEventType.ENVELOPE_CREATED,
        envelopeId: 'envelope-123',
        userId: 'user-456',
        description: '   '
      };

      await expect(auditService.createEvent(request)).rejects.toThrow(BadRequestError);
      await expect(auditService.createEvent(request)).rejects.toThrow('Description is required');
      expect(mockAuditRepository.create).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const request: CreateAuditEventRequest = {
        type: AuditEventType.ENVELOPE_CREATED,
        envelopeId: 'envelope-123',
        userId: 'user-456',
        description: 'Envelope created'
      };

      const error = new Error('Repository error');
      mockAuditRepository.create.mockRejectedValue(error);

      await expect(auditService.createEvent(request)).rejects.toThrow('Repository error');
    });
  });

  describe('getAuditEvent', () => {
    it('should return audit event when found', async () => {
      const auditEventId = 'audit-event-123';
      mockAuditRepository.getById.mockResolvedValue(mockAuditEvent);

      const result = await auditService.getAuditEvent(auditEventId);

      expect(mockAuditRepository.getById).toHaveBeenCalledWith(auditEventId);
      expect(result).toBe(mockAuditEvent);
    });

    it('should throw NotFoundError when audit event not found', async () => {
      const auditEventId = 'non-existent-id';
      mockAuditRepository.getById.mockResolvedValue(null);

      await expect(auditService.getAuditEvent(auditEventId)).rejects.toThrow(NotFoundError);
      await expect(auditService.getAuditEvent(auditEventId)).rejects.toThrow(
        `Audit event with ID ${auditEventId} not found`
      );
      expect(mockAuditRepository.getById).toHaveBeenCalledWith(auditEventId);
    });

    it('should handle repository errors', async () => {
      const auditEventId = 'audit-event-123';
      const error = new Error('Repository error');
      mockAuditRepository.getById.mockRejectedValue(error);

      await expect(auditService.getAuditEvent(auditEventId)).rejects.toThrow('Repository error');
    });
  });

  describe('getAuditTrail', () => {
    it('should return audit trail with default limit', async () => {
      const envelopeId = 'envelope-123';
      const mockResult = { items: [mockAuditEvent], hasNext: false };
      mockAuditRepository.listByEnvelope.mockResolvedValue(mockResult);

      const result = await auditService.getAuditTrail(envelopeId);

      expect(mockAuditRepository.listByEnvelope).toHaveBeenCalledWith(envelopeId, 25, undefined);
      expect(result).toBe(mockResult);
    });

    it('should return audit trail with custom limit and cursor', async () => {
      const envelopeId = 'envelope-123';
      const limit = 50;
      const cursor = 'cursor-123';
      const mockResult = { items: [mockAuditEvent], hasNext: true, nextCursor: 'next-cursor' };
      mockAuditRepository.listByEnvelope.mockResolvedValue(mockResult);

      const result = await auditService.getAuditTrail(envelopeId, limit, cursor);

      expect(mockAuditRepository.listByEnvelope).toHaveBeenCalledWith(envelopeId, limit, cursor);
      expect(result).toBe(mockResult);
    });

    it('should handle repository errors', async () => {
      const envelopeId = 'envelope-123';
      const error = new Error('Repository error');
      mockAuditRepository.listByEnvelope.mockRejectedValue(error);

      await expect(auditService.getAuditTrail(envelopeId)).rejects.toThrow('Repository error');
    });
  });

  describe('getUserAuditTrail', () => {
    it('should return user audit trail with default limit', async () => {
      const userId = 'user-123';
      const mockResult = { items: [mockAuditEvent], hasNext: false };
      mockAuditRepository.listByUser.mockResolvedValue(mockResult);

      const result = await auditService.getUserAuditTrail(userId);

      expect(mockAuditRepository.listByUser).toHaveBeenCalledWith(userId, 25, undefined);
      expect(result).toBe(mockResult);
    });

    it('should return user audit trail with custom limit and cursor', async () => {
      const userId = 'user-123';
      const limit = 100;
      const cursor = 'cursor-456';
      const mockResult = { items: [mockAuditEvent], hasNext: true, nextCursor: 'next-cursor' };
      mockAuditRepository.listByUser.mockResolvedValue(mockResult);

      const result = await auditService.getUserAuditTrail(userId, limit, cursor);

      expect(mockAuditRepository.listByUser).toHaveBeenCalledWith(userId, limit, cursor);
      expect(result).toBe(mockResult);
    });

    it('should handle repository errors', async () => {
      const userId = 'user-123';
      const error = new Error('Repository error');
      mockAuditRepository.listByUser.mockRejectedValue(error);

      await expect(auditService.getUserAuditTrail(userId)).rejects.toThrow('Repository error');
    });
  });

  describe('getAuditEventsByType', () => {
    it('should return audit events by type with default limit', async () => {
      const eventType = AuditEventType.ENVELOPE_CREATED;
      const mockResult = { items: [mockAuditEvent], hasNext: false };
      mockAuditRepository.listByEventType.mockResolvedValue(mockResult);

      const result = await auditService.getAuditEventsByType(eventType);

      expect(mockAuditRepository.listByEventType).toHaveBeenCalledWith(eventType, 25, undefined);
      expect(result).toBe(mockResult);
    });

    it('should return audit events by type with custom limit and cursor', async () => {
      const eventType = AuditEventType.SIGNER_ADDED;
      const limit = 75;
      const cursor = 'cursor-789';
      const mockResult = { items: [mockAuditEvent], hasNext: true, nextCursor: 'next-cursor' };
      mockAuditRepository.listByEventType.mockResolvedValue(mockResult);

      const result = await auditService.getAuditEventsByType(eventType, limit, cursor);

      expect(mockAuditRepository.listByEventType).toHaveBeenCalledWith(eventType, limit, cursor);
      expect(result).toBe(mockResult);
    });

    it('should handle all audit event types', async () => {
      const eventTypes = [
        AuditEventType.ENVELOPE_CREATED,
        AuditEventType.SIGNER_ADDED,
        AuditEventType.SIGNATURE_CREATED,
        AuditEventType.CONSENT_GIVEN,
        AuditEventType.DOCUMENT_ACCESSED
      ];
      const mockResult = { items: [mockAuditEvent], hasNext: false };
      mockAuditRepository.listByEventType.mockResolvedValue(mockResult);

      for (const eventType of eventTypes) {
        await auditService.getAuditEventsByType(eventType);
        expect(mockAuditRepository.listByEventType).toHaveBeenCalledWith(eventType, 25, undefined);
      }
    });

    it('should handle repository errors', async () => {
      const eventType = AuditEventType.ENVELOPE_CREATED;
      const error = new Error('Repository error');
      mockAuditRepository.listByEventType.mockRejectedValue(error);

      await expect(auditService.getAuditEventsByType(eventType)).rejects.toThrow('Repository error');
    });
  });

  describe('Error handling', () => {
    it('should propagate repository errors in createEvent', async () => {
      const request: CreateAuditEventRequest = {
        type: AuditEventType.ENVELOPE_CREATED,
        envelopeId: 'envelope-123',
        userId: 'user-456',
        description: 'Envelope created'
      };

      const error = new Error('Database connection failed');
      mockAuditRepository.create.mockRejectedValue(error);

      await expect(auditService.createEvent(request)).rejects.toThrow('Database connection failed');
    });

    it('should handle validation errors with correct error codes', async () => {
      const request: CreateAuditEventRequest = {
        type: undefined as any,
        envelopeId: 'envelope-123',
        userId: 'user-456',
        description: 'Envelope created'
      };

      try {
        await auditService.createEvent(request);
        fail('Expected BadRequestError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
        expect((error as BadRequestError).code).toBe(ErrorCodes.COMMON_BAD_REQUEST);
      }
    });
  });

  describe('Service configuration', () => {
    it('should be properly configured with audit repository', () => {
      expect(auditService).toBeDefined();
      expect(auditService).toBeInstanceOf(AuditService);
    });

    it('should have access to all required methods', () => {
      expect(typeof auditService.createEvent).toBe('function');
      expect(typeof auditService.getAuditEvent).toBe('function');
      expect(typeof auditService.getAuditTrail).toBe('function');
      expect(typeof auditService.getUserAuditTrail).toBe('function');
      expect(typeof auditService.getAuditEventsByType).toBe('function');
    });
  });

  describe('Pagination handling', () => {
    it('should handle pagination with different limit values', async () => {
      const envelopeId = 'envelope-123';
      const limits = [1, 10, 25, 50, 100];
      const mockResult = { items: [mockAuditEvent], hasNext: false };
      mockAuditRepository.listByEnvelope.mockResolvedValue(mockResult);

      for (const limit of limits) {
        await auditService.getAuditTrail(envelopeId, limit);
        expect(mockAuditRepository.listByEnvelope).toHaveBeenCalledWith(envelopeId, limit, undefined);
      }
    });

    it('should handle pagination with cursor values', async () => {
      const envelopeId = 'envelope-123';
      const cursors = [undefined, 'cursor-1', 'cursor-2', 'cursor-3'];
      const mockResult = { items: [mockAuditEvent], hasNext: false };
      mockAuditRepository.listByEnvelope.mockResolvedValue(mockResult);

      for (const cursor of cursors) {
        await auditService.getAuditTrail(envelopeId, 25, cursor);
        expect(mockAuditRepository.listByEnvelope).toHaveBeenCalledWith(envelopeId, 25, cursor);
      }
    });
  });
});
