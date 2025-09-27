/**
 * @fileoverview Unit tests for AuditEventService
 * @summary Tests for audit event service business logic
 * @description Comprehensive test suite for AuditEventService covering all business logic,
 * event creation, and service coordination for audit trail management.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AuditEventService } from '../../../src/services/audit/AuditEventService';
import { SignatureAuditEventRepository } from '../../../src/repositories/SignatureAuditEventRepository';
import { SignatureAuditEvent } from '../../../src/domain/entities/SignatureAuditEvent';
import { AuditEventType } from '../../../src/domain/enums/AuditEventType';
import { TestUtils } from '../../helpers/testUtils';
import { 
  auditEventEntity,
  signerEventEntity,
  envelopeEventEntity 
} from '../../helpers/builders/signatureAuditEvent';

// Mock the repository
const mockRepository = {
  create: jest.fn(),
  getByEnvelope: jest.fn()
} as any;

describe('AuditEventService', () => {
  let service: AuditEventService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuditEventService(mockRepository);
  });

  describe('createSignerEvent', () => {
    it('should create signer event with network context', async () => {
      const config = {
        envelopeId: TestUtils.generateUuid(),
        signerId: TestUtils.generateUuid(),
        eventType: AuditEventType.SIGNER_ADDED,
        description: 'Signer added to envelope',
        userId: TestUtils.generateUuid(),
        userEmail: 'signer@example.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        country: 'US',
        metadata: { source: 'test' }
      };

      const expectedEvent = signerEventEntity();
      mockRepository.create.mockResolvedValue(expectedEvent);

      const result = await service.createSignerEvent(config);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          getEventType: expect.any(Function),
          getDescription: expect.any(Function),
          getNetworkContext: expect.any(Function)
        })
      );

      // Verify the created event has correct properties
      const createdEvent = mockRepository.create.mock.calls[0][0];
      expect(createdEvent.getEventType()).toBe(AuditEventType.SIGNER_ADDED);
      expect(createdEvent.getDescription()).toBe('Signer added to envelope');
      expect(createdEvent.getNetworkContext()).toEqual({
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        country: 'US'
      });

      expect(result).toBe(expectedEvent);
    });

    it('should handle signer event without network context', async () => {
      const config = {
        envelopeId: TestUtils.generateUuid(),
        signerId: TestUtils.generateUuid(),
        eventType: AuditEventType.SIGNER_SIGNED,
        description: 'Document signed',
        userId: TestUtils.generateUuid(),
        ipAddress: undefined,
        userAgent: undefined,
        country: undefined
      };

      const expectedEvent = signerEventEntity();
      mockRepository.create.mockResolvedValue(expectedEvent);

      const result = await service.createSignerEvent(config);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          getEventType: expect.any(Function),
          getDescription: expect.any(Function)
        })
      );

      expect(result).toBe(expectedEvent);
    });

    it('should throw error when repository fails', async () => {
      const config = {
        envelopeId: TestUtils.generateUuid(),
        signerId: TestUtils.generateUuid(),
        eventType: AuditEventType.SIGNER_ADDED,
        description: 'Signer added',
        userId: TestUtils.generateUuid(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        country: 'US'
      };

      const error = new Error('Repository error');
      mockRepository.create.mockRejectedValue(error);

      await expect(service.createSignerEvent(config)).rejects.toThrow('Repository error');
    });
  });

  describe('create', () => {
    it('should create audit event from request using createFromPrimitives', async () => {
      const request = {
        envelopeId: TestUtils.generateUuid(),
        signerId: TestUtils.generateUuid(),
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Envelope created successfully',
        userId: TestUtils.generateUuid(),
        userEmail: 'user@example.com',
        networkContext: {
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
          country: 'US'
        },
        metadata: { source: 'web' }
      };

      const expectedEvent = envelopeEventEntity();
      mockRepository.create.mockResolvedValue(expectedEvent);

      const result = await service.create(request);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          getEventType: expect.any(Function),
          getDescription: expect.any(Function)
        })
      );

      expect(result).toBe(expectedEvent);
    });

    it('should handle request without optional fields', async () => {
      const request = {
        envelopeId: TestUtils.generateUuid(),
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Envelope created',
        signerId: undefined,
        userId: undefined,
        userEmail: undefined,
        networkContext: undefined,
        metadata: undefined
      };

      const expectedEvent = envelopeEventEntity();
      mockRepository.create.mockResolvedValue(expectedEvent);

      const result = await service.create(request);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          getEventType: expect.any(Function),
          getDescription: expect.any(Function)
        })
      );

      expect(result).toBe(expectedEvent);
    });

    it('should throw error when validation fails', async () => {
      const request = {
        envelopeId: 'invalid-uuid',
        eventType: AuditEventType.SIGNER_ADDED,
        description: 'Signer added',
        signerId: 'invalid-uuid',
        userId: TestUtils.generateUuid(),
        networkContext: undefined
      };

      await expect(service.create(request)).rejects.toThrow('Audit event creation failed');
    });

    it('should throw error when repository fails', async () => {
      const request = {
        envelopeId: TestUtils.generateUuid(),
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Envelope created',
        userId: TestUtils.generateUuid(),
        networkContext: undefined
      };

      const error = new Error('Repository error');
      mockRepository.create.mockRejectedValue(error);

      await expect(service.create(request)).rejects.toThrow('Audit event creation failed');
    });
  });

  describe('getByEnvelope', () => {
    it('should retrieve all audit events for envelope', async () => {
      const envelopeId = TestUtils.generateUuid();
      const expectedEvents = [
        auditEventEntity({ eventType: AuditEventType.ENVELOPE_CREATED }),
        signerEventEntity({ eventType: AuditEventType.SIGNER_ADDED }),
        signerEventEntity({ eventType: AuditEventType.SIGNER_SIGNED })
      ];

      mockRepository.getByEnvelope.mockResolvedValue(expectedEvents);

      const result = await service.getByEnvelope(envelopeId);

      expect(mockRepository.getByEnvelope).toHaveBeenCalledWith(envelopeId);
      expect(result).toBe(expectedEvents);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no events found', async () => {
      const envelopeId = TestUtils.generateUuid();
      mockRepository.getByEnvelope.mockResolvedValue([]);

      const result = await service.getByEnvelope(envelopeId);

      expect(mockRepository.getByEnvelope).toHaveBeenCalledWith(envelopeId);
      expect(result).toEqual([]);
    });

    it('should throw error when repository fails', async () => {
      const envelopeId = TestUtils.generateUuid();
      const error = new Error('Repository error');
      mockRepository.getByEnvelope.mockRejectedValue(error);

      await expect(service.getByEnvelope(envelopeId)).rejects.toThrow('Repository error');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-Error objects in catch blocks', async () => {
      const config = {
        envelopeId: TestUtils.generateUuid(),
        signerId: TestUtils.generateUuid(),
        eventType: AuditEventType.SIGNER_ADDED,
        description: 'Signer added',
        userId: TestUtils.generateUuid(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        country: 'US'
      };

      // Mock repository to throw a non-Error object
      mockRepository.create.mockRejectedValue('String error');

      await expect(service.createSignerEvent(config)).rejects.toBe('String error');
    });

    it('should handle complex error objects', async () => {
      const request = {
        envelopeId: TestUtils.generateUuid(),
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Envelope created',
        userId: TestUtils.generateUuid(),
        networkContext: undefined
      };

      const complexError = {
        message: 'Complex error',
        code: 'ERR_001',
        details: { field: 'envelopeId' }
      };

      mockRepository.create.mockRejectedValue(complexError);

      await expect(service.create(request)).rejects.toThrow('Audit event creation failed');
    });
  });

  describe('Integration with Entity Methods', () => {
    it('should use entity create method for signer events', async () => {
      const config = {
        envelopeId: TestUtils.generateUuid(),
        signerId: TestUtils.generateUuid(),
        eventType: AuditEventType.SIGNER_ADDED,
        description: 'Signer added',
        userId: TestUtils.generateUuid(),
        userEmail: 'signer@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        country: 'US'
      };

      const expectedEvent = signerEventEntity();
      mockRepository.create.mockResolvedValue(expectedEvent);

      await service.createSignerEvent(config);

      // Verify that the entity was created with proper Value Objects
      const createdEvent = mockRepository.create.mock.calls[0][0];
      expect(createdEvent.getEnvelopeId()).toBeInstanceOf(Object); // EnvelopeId VO
      expect(createdEvent.getSignerId()).toBeInstanceOf(Object); // SignerId VO
      expect(createdEvent.getEventType()).toBe(AuditEventType.SIGNER_ADDED);
      expect(createdEvent.getDescription()).toBe('Signer added');
    });

    it('should use entity createFromPrimitives method for general events', async () => {
      const request = {
        envelopeId: TestUtils.generateUuid(),
        signerId: TestUtils.generateUuid(),
        eventType: AuditEventType.SIGNER_SIGNED,
        description: 'Document signed',
        userId: TestUtils.generateUuid(),
        userEmail: 'signer@example.com',
        networkContext: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          country: 'US'
        },
        metadata: { source: 'test' }
      };

      const expectedEvent = signerEventEntity();
      mockRepository.create.mockResolvedValue(expectedEvent);

      await service.create(request);

      // Verify that the entity was created using createFromPrimitives
      const createdEvent = mockRepository.create.mock.calls[0][0];
      expect(createdEvent.getEventType()).toBe(AuditEventType.SIGNER_SIGNED);
      expect(createdEvent.getDescription()).toBe('Document signed');
      expect(createdEvent.getNetworkContext()).toEqual({
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        country: 'US'
      });
    });
  });
});
