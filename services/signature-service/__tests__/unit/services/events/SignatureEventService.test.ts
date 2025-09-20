/**
 * @fileoverview SignatureEventService unit tests
 * @summary Tests for signature-specific domain event publishing
 * @description Comprehensive unit tests for SignatureEventService covering
 * all event publishing methods and error scenarios.
 */

import { SignatureEventService } from '@/services/events/SignatureEventService';
import { Signature } from '@/domain/entities/Signature';
import { SignatureStatus } from '@/domain/enums/SignatureStatus';
import { OutboxRepository } from '@lawprotect/shared-ts';
import type { DomainEvent } from '@lawprotect/shared-ts';

describe('SignatureEventService', () => {
  let signatureEventService: SignatureEventService;
  let mockOutboxRepository: jest.Mocked<OutboxRepository>;
  let mockSignature: jest.Mocked<Signature>;

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
    signatureEventService = new SignatureEventService({
      outboxRepository: mockOutboxRepository,
      serviceName: 'signature-service',
      defaultTraceId: 'test-trace-id'
    });

    // Mock Signature entity
    mockSignature = {
      getId: jest.fn().mockReturnValue({ getValue: () => 'signature-123' }),
      getEnvelopeId: jest.fn().mockReturnValue('envelope-456'),
      getSignerId: jest.fn().mockReturnValue('signer-789'),
      getDocumentHash: jest.fn().mockReturnValue('doc-hash-abc'),
      getSignatureHash: jest.fn().mockReturnValue('sig-hash-def'),
      getS3Key: jest.fn().mockReturnValue('s3-key-ghi'),
      getKmsKeyId: jest.fn().mockReturnValue('kms-key-jkl'),
      getAlgorithm: jest.fn().mockReturnValue('RSA_SHA256'),
      getStatus: jest.fn().mockReturnValue(SignatureStatus.SIGNED),
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
        type: 'signature.module_event',
        payload: { test: 'data' },
        occurredAt: '2023-01-01T00:00:00.000Z'
      };
      const traceId = 'custom-trace-id';

      // Mock the publishDomainEvent method
      const publishDomainEventSpy = jest.spyOn(signatureEventService, 'publishDomainEvent')
        .mockImplementation(jest.fn());

      await signatureEventService.publishModuleEvent(mockEvent, traceId);

      expect(publishDomainEventSpy).toHaveBeenCalledWith(mockEvent, traceId);
    });

    it('should publish a module-specific event without traceId', async () => {
      const mockEvent: DomainEvent = {
        id: 'event-123',
        type: 'signature.module_event',
        payload: { test: 'data' },
        occurredAt: '2023-01-01T00:00:00.000Z'
      };

      // Mock the publishDomainEvent method
      const publishDomainEventSpy = jest.spyOn(signatureEventService, 'publishDomainEvent')
        .mockImplementation(jest.fn());

      await signatureEventService.publishModuleEvent(mockEvent);

      expect(publishDomainEventSpy).toHaveBeenCalledWith(mockEvent, undefined);
    });
  });

  describe('publishSignatureCreated', () => {
    it('should publish signature created event with correct payload', async () => {
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signatureEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signatureEventService.publishSignatureCreated(mockSignature, userId);

      expect(publishEventSpy).toHaveBeenCalledWith('signature.created', {
        signatureId: 'signature-123',
        envelopeId: 'envelope-456',
        signerId: 'signer-789',
        documentHash: 'doc-hash-abc',
        signatureHash: 'sig-hash-def',
        s3Key: 's3-key-ghi',
        kmsKeyId: 'kms-key-jkl',
        algorithm: 'RSA_SHA256',
        status: SignatureStatus.SIGNED,
        timestamp: '2023-01-01T00:00:00.000Z',
        createdAt: expect.any(String),
        userId: 'user-123'
      });
    });

    it('should call signature entity methods correctly', async () => {
      const userId = 'user-123';

      // Mock the publishEvent method
      jest.spyOn(signatureEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signatureEventService.publishSignatureCreated(mockSignature, userId);

      expect(mockSignature.getId).toHaveBeenCalled();
      expect(mockSignature.getEnvelopeId).toHaveBeenCalled();
      expect(mockSignature.getSignerId).toHaveBeenCalled();
      expect(mockSignature.getDocumentHash).toHaveBeenCalled();
      expect(mockSignature.getSignatureHash).toHaveBeenCalled();
      expect(mockSignature.getS3Key).toHaveBeenCalled();
      expect(mockSignature.getKmsKeyId).toHaveBeenCalled();
      expect(mockSignature.getAlgorithm).toHaveBeenCalled();
      expect(mockSignature.getStatus).toHaveBeenCalled();
      expect(mockSignature.getTimestamp).toHaveBeenCalled();
    });
  });

  describe('publishSignatureUpdated', () => {
    it('should publish signature updated event with correct payload', async () => {
      const userId = 'user-123';
      const changes = { status: SignatureStatus.SIGNED };
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signatureEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signatureEventService.publishSignatureUpdated(mockSignature, userId, changes);

      expect(publishEventSpy).toHaveBeenCalledWith('signature.updated', {
        signatureId: 'signature-123',
        envelopeId: 'envelope-456',
        signerId: 'signer-789',
        status: SignatureStatus.SIGNED,
        changes,
        updatedAt: expect.any(String),
        userId: 'user-123'
      });
    });

    it('should handle empty changes object', async () => {
      const userId = 'user-123';
      const changes = {};
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signatureEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signatureEventService.publishSignatureUpdated(mockSignature, userId, changes);

      expect(publishEventSpy).toHaveBeenCalledWith('signature.updated', {
        signatureId: 'signature-123',
        envelopeId: 'envelope-456',
        signerId: 'signer-789',
        status: SignatureStatus.SIGNED,
        changes: {},
        updatedAt: expect.any(String),
        userId: 'user-123'
      });
    });
  });

  describe('publishSignatureStatusChanged', () => {
    it('should publish signature status changed event with correct payload', async () => {
      const oldStatus = SignatureStatus.PENDING;
      const newStatus = SignatureStatus.SIGNED;
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signatureEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signatureEventService.publishSignatureStatusChanged(
        mockSignature,
        oldStatus,
        newStatus,
        userId
      );

      expect(publishEventSpy).toHaveBeenCalledWith('signature.status_changed', {
        signatureId: 'signature-123',
        envelopeId: 'envelope-456',
        signerId: 'signer-789',
        oldStatus,
        newStatus,
        changedAt: expect.any(String),
        userId: 'user-123'
      });
    });

    it('should handle all signature status transitions', async () => {
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signatureEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const statusTransitions = [
        [SignatureStatus.PENDING, SignatureStatus.SIGNED],
        [SignatureStatus.SIGNED, SignatureStatus.FAILED],
        [SignatureStatus.FAILED, SignatureStatus.PENDING]
      ];

      for (const [oldStatus, newStatus] of statusTransitions) {
        await signatureEventService.publishSignatureStatusChanged(
          mockSignature,
          oldStatus,
          newStatus,
          userId
        );

        expect(publishEventSpy).toHaveBeenCalledWith('signature.status_changed', {
          signatureId: 'signature-123',
          envelopeId: 'envelope-456',
          signerId: 'signer-789',
          oldStatus,
          newStatus,
          changedAt: expect.any(String),
          userId: 'user-123'
        });
      }
    });
  });

  describe('publishSignatureDeleted', () => {
    it('should publish signature deleted event with correct payload', async () => {
      const signatureId = 'signature-123';
      const envelopeId = 'envelope-456';
      const signerId = 'signer-789';
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signatureEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signatureEventService.publishSignatureDeleted(
        signatureId,
        envelopeId,
        signerId,
        userId
      );

      expect(publishEventSpy).toHaveBeenCalledWith('signature.deleted', {
        signatureId,
        envelopeId,
        signerId,
        deletedAt: expect.any(String),
        userId
      });
    });

    it('should handle different signature IDs', async () => {
      const testCases = [
        { signatureId: 'sig-1', envelopeId: 'env-1', signerId: 'signer-1' },
        { signatureId: 'sig-2', envelopeId: 'env-2', signerId: 'signer-2' },
        { signatureId: 'sig-3', envelopeId: 'env-3', signerId: 'signer-3' }
      ];
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signatureEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      for (const testCase of testCases) {
        await signatureEventService.publishSignatureDeleted(
          testCase.signatureId,
          testCase.envelopeId,
          testCase.signerId,
          userId
        );

        expect(publishEventSpy).toHaveBeenCalledWith('signature.deleted', {
          signatureId: testCase.signatureId,
          envelopeId: testCase.envelopeId,
          signerId: testCase.signerId,
          deletedAt: expect.any(String),
          userId
        });
      }
    });
  });

  describe('publishSignatureCompleted', () => {
    it('should publish signature completed event with correct payload', async () => {
      const completedAt = new Date('2023-01-01T12:00:00.000Z');
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signatureEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signatureEventService.publishSignatureCompleted(mockSignature, completedAt);

      expect(publishEventSpy).toHaveBeenCalledWith('signature.completed', {
        signatureId: 'signature-123',
        envelopeId: 'envelope-456',
        signerId: 'signer-789',
        documentHash: 'doc-hash-abc',
        signatureHash: 'sig-hash-def',
        s3Key: 's3-key-ghi',
        algorithm: 'RSA_SHA256',
        completedAt: '2023-01-01T12:00:00.000Z'
      });
    });

    it('should handle different completion times', async () => {
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signatureEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const completionTimes = [
        new Date('2023-01-01T00:00:00.000Z'),
        new Date('2023-01-01T12:00:00.000Z'),
        new Date('2023-01-01T23:59:59.999Z')
      ];

      for (const completedAt of completionTimes) {
        await signatureEventService.publishSignatureCompleted(mockSignature, completedAt);

        expect(publishEventSpy).toHaveBeenCalledWith('signature.completed', {
          signatureId: 'signature-123',
          envelopeId: 'envelope-456',
          signerId: 'signer-789',
          documentHash: 'doc-hash-abc',
          signatureHash: 'sig-hash-def',
          s3Key: 's3-key-ghi',
          algorithm: 'RSA_SHA256',
          completedAt: completedAt.toISOString()
        });
      }
    });
  });

  describe('publishSignatureFailed', () => {
    it('should publish signature failed event with correct payload', async () => {
      const failedAt = new Date('2023-01-01T12:00:00.000Z');
      const errorMessage = 'Signature validation failed';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signatureEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signatureEventService.publishSignatureFailed(mockSignature, failedAt, errorMessage);

      expect(publishEventSpy).toHaveBeenCalledWith('signature.failed', {
        signatureId: 'signature-123',
        envelopeId: 'envelope-456',
        signerId: 'signer-789',
        documentHash: 'doc-hash-abc',
        algorithm: 'RSA_SHA256',
        failedAt: '2023-01-01T12:00:00.000Z',
        errorMessage
      });
    });

    it('should handle different error messages', async () => {
      const failedAt = new Date('2023-01-01T12:00:00.000Z');
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signatureEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const errorMessages = [
        'Invalid signature format',
        'Certificate expired',
        'Document tampered',
        'Network timeout'
      ];

      for (const errorMessage of errorMessages) {
        await signatureEventService.publishSignatureFailed(mockSignature, failedAt, errorMessage);

        expect(publishEventSpy).toHaveBeenCalledWith('signature.failed', {
          signatureId: 'signature-123',
          envelopeId: 'envelope-456',
          signerId: 'signer-789',
          documentHash: 'doc-hash-abc',
          algorithm: 'RSA_SHA256',
          failedAt: '2023-01-01T12:00:00.000Z',
          errorMessage
        });
      }
    });
  });

  describe('publishSignatureValidated', () => {
    it('should publish signature validated event with correct payload', async () => {
      const validatedAt = new Date('2023-01-01T12:00:00.000Z');
      const validationResult = { isValid: true, confidence: 0.95 };
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signatureEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signatureEventService.publishSignatureValidated(
        mockSignature,
        validatedAt,
        validationResult
      );

      expect(publishEventSpy).toHaveBeenCalledWith('signature.validated', {
        signatureId: 'signature-123',
        envelopeId: 'envelope-456',
        signerId: 'signer-789',
        documentHash: 'doc-hash-abc',
        signatureHash: 'sig-hash-def',
        algorithm: 'RSA_SHA256',
        validatedAt: '2023-01-01T12:00:00.000Z',
        validationResult
      });
    });

    it('should handle different validation results', async () => {
      const validatedAt = new Date('2023-01-01T12:00:00.000Z');
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signatureEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const validationResults = [
        { isValid: true, confidence: 0.95 },
        { isValid: false, confidence: 0.2, reason: 'Invalid certificate' },
        { isValid: true, confidence: 0.8, warnings: ['Low resolution'] }
      ];

      for (const validationResult of validationResults) {
        await signatureEventService.publishSignatureValidated(
          mockSignature,
          validatedAt,
          validationResult
        );

        expect(publishEventSpy).toHaveBeenCalledWith('signature.validated', {
          signatureId: 'signature-123',
          envelopeId: 'envelope-456',
          signerId: 'signer-789',
          documentHash: 'doc-hash-abc',
          signatureHash: 'sig-hash-def',
          algorithm: 'RSA_SHA256',
          validatedAt: '2023-01-01T12:00:00.000Z',
          validationResult
        });
      }
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from publishEvent', async () => {
      const userId = 'user-123';
      const error = new Error('Publish failed');
      
      // Mock the publishEvent method to throw an error
      const publishEventSpy = jest.spyOn(signatureEventService, 'publishEvent')
        .mockRejectedValueOnce(error);

      await expect(
        signatureEventService.publishSignatureCreated(mockSignature, userId)
      ).rejects.toThrow('Publish failed');

      expect(publishEventSpy).toHaveBeenCalled();
    });

    it('should propagate errors from publishDomainEvent', async () => {
      const mockEvent: DomainEvent = {
        id: 'event-123',
        type: 'signature.module_event',
        payload: { test: 'data' },
        occurredAt: '2023-01-01T00:00:00.000Z'
      };
      const error = new Error('Domain event publish failed');
      
      // Mock the publishDomainEvent method to throw an error
      const publishDomainEventSpy = jest.spyOn(signatureEventService, 'publishDomainEvent')
        .mockRejectedValueOnce(error);

      await expect(
        signatureEventService.publishModuleEvent(mockEvent)
      ).rejects.toThrow('Domain event publish failed');

      expect(publishDomainEventSpy).toHaveBeenCalled();
    });
  });

  describe('Event type consistency', () => {
    it('should use consistent event type naming', async () => {
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signatureEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      // Test all event types follow the pattern
      await signatureEventService.publishSignatureCreated(mockSignature, 'user-123');
      expect(publishEventSpy).toHaveBeenCalledWith('signature.created', expect.any(Object));

      await signatureEventService.publishSignatureUpdated(mockSignature, 'user-123', {});
      expect(publishEventSpy).toHaveBeenCalledWith('signature.updated', expect.any(Object));

      await signatureEventService.publishSignatureStatusChanged(
        mockSignature, SignatureStatus.PENDING, SignatureStatus.SIGNED, 'user-123'
      );
      expect(publishEventSpy).toHaveBeenCalledWith('signature.status_changed', expect.any(Object));

      await signatureEventService.publishSignatureDeleted('sig-1', 'env-1', 'signer-1', 'user-123');
      expect(publishEventSpy).toHaveBeenCalledWith('signature.deleted', expect.any(Object));

      await signatureEventService.publishSignatureCompleted(mockSignature, new Date());
      expect(publishEventSpy).toHaveBeenCalledWith('signature.completed', expect.any(Object));

      await signatureEventService.publishSignatureFailed(mockSignature, new Date(), 'error');
      expect(publishEventSpy).toHaveBeenCalledWith('signature.failed', expect.any(Object));

      await signatureEventService.publishSignatureValidated(mockSignature, new Date(), {});
      expect(publishEventSpy).toHaveBeenCalledWith('signature.validated', expect.any(Object));
    });
  });
});