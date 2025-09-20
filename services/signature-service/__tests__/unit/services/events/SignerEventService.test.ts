/**
 * @fileoverview SignerEventService unit tests
 * @summary Tests for signer-specific domain event publishing
 * @description Comprehensive unit tests for SignerEventService covering
 * all event publishing methods and error scenarios.
 */

import { SignerEventService } from '@/services/events/SignerEventService';
import { Signer } from '@/domain/entities/Signer';
import { SignerStatus } from '@/domain/enums/SignerStatus';
import { OutboxRepository } from '@lawprotect/shared-ts';
import type { DomainEvent } from '@lawprotect/shared-ts';

describe('SignerEventService', () => {
  let signerEventService: SignerEventService;
  let mockOutboxRepository: jest.Mocked<OutboxRepository>;
  let mockSigner: jest.Mocked<Signer>;

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
    signerEventService = new SignerEventService({
      outboxRepository: mockOutboxRepository,
      serviceName: 'signature-service',
      defaultTraceId: 'test-trace-id'
    });

    // Mock Signer entity
    mockSigner = {
      getId: jest.fn().mockReturnValue({ getValue: () => 'signer-123' }),
      getEnvelopeId: jest.fn().mockReturnValue('envelope-456'),
      getEmail: jest.fn().mockReturnValue({ getValue: () => 'signer@example.com' }),
      getFullName: jest.fn().mockReturnValue('John Doe'),
      getStatus: jest.fn().mockReturnValue(SignerStatus.PENDING),
      getOrder: jest.fn().mockReturnValue(1),
      getInvitationToken: jest.fn().mockReturnValue('invitation-token-abc')
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('publishModuleEvent', () => {
    it('should publish a module-specific event', async () => {
      const mockEvent: DomainEvent = {
        id: 'event-123',
        type: 'signer.module_event',
        payload: { test: 'data' },
        occurredAt: '2023-01-01T00:00:00.000Z'
      };
      const traceId = 'custom-trace-id';

      // Mock the publishDomainEvent method
      const publishDomainEventSpy = jest.spyOn(signerEventService, 'publishDomainEvent')
        .mockImplementation(jest.fn());

      await signerEventService.publishModuleEvent(mockEvent, traceId);

      expect(publishDomainEventSpy).toHaveBeenCalledWith(mockEvent, traceId);
    });

    it('should publish a module-specific event without traceId', async () => {
      const mockEvent: DomainEvent = {
        id: 'event-123',
        type: 'signer.module_event',
        payload: { test: 'data' },
        occurredAt: '2023-01-01T00:00:00.000Z'
      };

      // Mock the publishDomainEvent method
      const publishDomainEventSpy = jest.spyOn(signerEventService, 'publishDomainEvent')
        .mockImplementation(jest.fn());

      await signerEventService.publishModuleEvent(mockEvent);

      expect(publishDomainEventSpy).toHaveBeenCalledWith(mockEvent, undefined);
    });
  });

  describe('publishSignerCreated', () => {
    it('should publish signer created event with correct payload', async () => {
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signerEventService.publishSignerCreated(mockSigner, userId);

      expect(publishEventSpy).toHaveBeenCalledWith('signer.created', {
        signerId: 'signer-123',
        envelopeId: 'envelope-456',
        email: 'signer@example.com',
        fullName: 'John Doe',
        status: SignerStatus.PENDING,
        order: 1,
        invitationToken: 'invitation-token-abc',
        createdAt: expect.any(String),
        userId: 'user-123'
      });
    });

    it('should call signer entity methods correctly', async () => {
      const userId = 'user-123';

      // Mock the publishEvent method
      jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signerEventService.publishSignerCreated(mockSigner, userId);

      expect(mockSigner.getId).toHaveBeenCalled();
      expect(mockSigner.getEnvelopeId).toHaveBeenCalled();
      expect(mockSigner.getEmail).toHaveBeenCalled();
      expect(mockSigner.getFullName).toHaveBeenCalled();
      expect(mockSigner.getStatus).toHaveBeenCalled();
      expect(mockSigner.getOrder).toHaveBeenCalled();
      expect(mockSigner.getInvitationToken).toHaveBeenCalled();
    });
  });

  describe('publishSignerUpdated', () => {
    it('should publish signer updated event with correct payload', async () => {
      const userId = 'user-123';
      const changes = { status: SignerStatus.SIGNED };
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signerEventService.publishSignerUpdated(mockSigner, userId, changes);

      expect(publishEventSpy).toHaveBeenCalledWith('signer.updated', {
        signerId: 'signer-123',
        envelopeId: 'envelope-456',
        email: 'signer@example.com',
        fullName: 'John Doe',
        status: SignerStatus.PENDING,
        order: 1,
        changes,
        updatedAt: expect.any(String),
        userId: 'user-123'
      });
    });

    it('should handle empty changes object', async () => {
      const userId = 'user-123';
      const changes = {};
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signerEventService.publishSignerUpdated(mockSigner, userId, changes);

      expect(publishEventSpy).toHaveBeenCalledWith('signer.updated', {
        signerId: 'signer-123',
        envelopeId: 'envelope-456',
        email: 'signer@example.com',
        fullName: 'John Doe',
        status: SignerStatus.PENDING,
        order: 1,
        changes: {},
        updatedAt: expect.any(String),
        userId: 'user-123'
      });
    });
  });

  describe('publishSignerStatusChanged', () => {
    it('should publish signer status changed event with correct payload', async () => {
      const oldStatus = SignerStatus.PENDING;
      const newStatus = SignerStatus.SIGNED;
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signerEventService.publishSignerStatusChanged(
        mockSigner,
        oldStatus,
        newStatus,
        userId
      );

      expect(publishEventSpy).toHaveBeenCalledWith('signer.status_changed', {
        signerId: 'signer-123',
        envelopeId: 'envelope-456',
        email: 'signer@example.com',
        fullName: 'John Doe',
        oldStatus,
        newStatus,
        changedAt: expect.any(String),
        userId: 'user-123'
      });
    });

    it('should handle all signer status transitions', async () => {
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const statusTransitions = [
        [SignerStatus.PENDING, SignerStatus.SIGNED],
        [SignerStatus.SIGNED, SignerStatus.DECLINED],
        [SignerStatus.DECLINED, SignerStatus.PENDING]
      ];

      for (const [oldStatus, newStatus] of statusTransitions) {
        await signerEventService.publishSignerStatusChanged(
          mockSigner,
          oldStatus,
          newStatus,
          userId
        );

        expect(publishEventSpy).toHaveBeenCalledWith('signer.status_changed', {
          signerId: 'signer-123',
          envelopeId: 'envelope-456',
          email: 'signer@example.com',
          fullName: 'John Doe',
          oldStatus,
          newStatus,
          changedAt: expect.any(String),
          userId: 'user-123'
        });
      }
    });
  });

  describe('publishSignerDeleted', () => {
    it('should publish signer deleted event with correct payload', async () => {
      const signerId = 'signer-123';
      const envelopeId = 'envelope-456';
      const email = 'signer@example.com';
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signerEventService.publishSignerDeleted(
        signerId,
        envelopeId,
        email,
        userId
      );

      expect(publishEventSpy).toHaveBeenCalledWith('signer.deleted', {
        signerId,
        envelopeId,
        email,
        deletedAt: expect.any(String),
        userId
      });
    });

    it('should handle different signer data', async () => {
      const testCases = [
        { signerId: 'signer-1', envelopeId: 'env-1', email: 'signer1@example.com' },
        { signerId: 'signer-2', envelopeId: 'env-2', email: 'signer2@example.com' },
        { signerId: 'signer-3', envelopeId: 'env-3', email: 'signer3@example.com' }
      ];
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      for (const testCase of testCases) {
        await signerEventService.publishSignerDeleted(
          testCase.signerId,
          testCase.envelopeId,
          testCase.email,
          userId
        );

        expect(publishEventSpy).toHaveBeenCalledWith('signer.deleted', {
          signerId: testCase.signerId,
          envelopeId: testCase.envelopeId,
          email: testCase.email,
          deletedAt: expect.any(String),
          userId
        });
      }
    });
  });

  describe('publishSignerInvited', () => {
    it('should publish signer invited event with correct payload', async () => {
      const invitationToken = 'new-invitation-token-xyz';
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signerEventService.publishSignerInvited(mockSigner, invitationToken, userId);

      expect(publishEventSpy).toHaveBeenCalledWith('signer.invited', {
        signerId: 'signer-123',
        envelopeId: 'envelope-456',
        email: 'signer@example.com',
        fullName: 'John Doe',
        invitationToken,
        invitedAt: expect.any(String),
        userId: 'user-123'
      });
    });

    it('should handle different invitation tokens', async () => {
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const invitationTokens = [
        'token-abc-123',
        'token-def-456',
        'token-ghi-789'
      ];

      for (const invitationToken of invitationTokens) {
        await signerEventService.publishSignerInvited(mockSigner, invitationToken, userId);

        expect(publishEventSpy).toHaveBeenCalledWith('signer.invited', {
          signerId: 'signer-123',
          envelopeId: 'envelope-456',
          email: 'signer@example.com',
          fullName: 'John Doe',
          invitationToken,
          invitedAt: expect.any(String),
          userId: 'user-123'
        });
      }
    });
  });

  describe('publishSignerReminder', () => {
    it('should publish signer reminder event with correct payload', async () => {
      const userId = 'user-123';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signerEventService.publishSignerReminder(mockSigner, userId);

      expect(publishEventSpy).toHaveBeenCalledWith('signer.reminder', {
        signerId: 'signer-123',
        envelopeId: 'envelope-456',
        email: 'signer@example.com',
        fullName: 'John Doe',
        status: SignerStatus.PENDING,
        remindedAt: expect.any(String),
        userId: 'user-123'
      });
    });

    it('should call signer entity methods correctly', async () => {
      const userId = 'user-123';

      // Mock the publishEvent method
      jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signerEventService.publishSignerReminder(mockSigner, userId);

      expect(mockSigner.getId).toHaveBeenCalled();
      expect(mockSigner.getEnvelopeId).toHaveBeenCalled();
      expect(mockSigner.getEmail).toHaveBeenCalled();
      expect(mockSigner.getFullName).toHaveBeenCalled();
      expect(mockSigner.getStatus).toHaveBeenCalled();
    });
  });

  describe('publishSignerSigned', () => {
    it('should publish signer signed event with correct payload', async () => {
      const signedAt = new Date('2023-01-01T12:00:00.000Z');
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signerEventService.publishSignerSigned(mockSigner, signedAt);

      expect(publishEventSpy).toHaveBeenCalledWith('signer.signed', {
        signerId: 'signer-123',
        envelopeId: 'envelope-456',
        email: 'signer@example.com',
        fullName: 'John Doe',
        signedAt: '2023-01-01T12:00:00.000Z'
      });
    });

    it('should handle different signing times', async () => {
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const signingTimes = [
        new Date('2023-01-01T00:00:00.000Z'),
        new Date('2023-01-01T12:00:00.000Z'),
        new Date('2023-01-01T23:59:59.999Z')
      ];

      for (const signedAt of signingTimes) {
        await signerEventService.publishSignerSigned(mockSigner, signedAt);

        expect(publishEventSpy).toHaveBeenCalledWith('signer.signed', {
          signerId: 'signer-123',
          envelopeId: 'envelope-456',
          email: 'signer@example.com',
          fullName: 'John Doe',
          signedAt: signedAt.toISOString()
        });
      }
    });
  });

  describe('publishSignerDeclined', () => {
    it('should publish signer declined event with correct payload', async () => {
      const declinedAt = new Date('2023-01-01T12:00:00.000Z');
      const declineReason = 'Document not clear';
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signerEventService.publishSignerDeclined(mockSigner, declinedAt, declineReason);

      expect(publishEventSpy).toHaveBeenCalledWith('signer.declined', {
        signerId: 'signer-123',
        envelopeId: 'envelope-456',
        email: 'signer@example.com',
        fullName: 'John Doe',
        declinedAt: '2023-01-01T12:00:00.000Z',
        declineReason
      });
    });

    it('should handle signer declined without reason', async () => {
      const declinedAt = new Date('2023-01-01T12:00:00.000Z');
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      await signerEventService.publishSignerDeclined(mockSigner, declinedAt);

      expect(publishEventSpy).toHaveBeenCalledWith('signer.declined', {
        signerId: 'signer-123',
        envelopeId: 'envelope-456',
        email: 'signer@example.com',
        fullName: 'John Doe',
        declinedAt: '2023-01-01T12:00:00.000Z',
        declineReason: undefined
      });
    });

    it('should handle different decline reasons', async () => {
      const declinedAt = new Date('2023-01-01T12:00:00.000Z');
      
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      const declineReasons = [
        'Document not clear',
        'Terms not acceptable',
        'Wrong document',
        'Changed mind'
      ];

      for (const declineReason of declineReasons) {
        await signerEventService.publishSignerDeclined(mockSigner, declinedAt, declineReason);

        expect(publishEventSpy).toHaveBeenCalledWith('signer.declined', {
          signerId: 'signer-123',
          envelopeId: 'envelope-456',
          email: 'signer@example.com',
          fullName: 'John Doe',
          declinedAt: '2023-01-01T12:00:00.000Z',
          declineReason
        });
      }
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from publishEvent', async () => {
      const userId = 'user-123';
      const error = new Error('Publish failed');
      
      // Mock the publishEvent method to throw an error
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockRejectedValueOnce(error);

      await expect(
        signerEventService.publishSignerCreated(mockSigner, userId)
      ).rejects.toThrow('Publish failed');

      expect(publishEventSpy).toHaveBeenCalled();
    });

    it('should propagate errors from publishDomainEvent', async () => {
      const mockEvent: DomainEvent = {
        id: 'event-123',
        type: 'signer.module_event',
        payload: { test: 'data' },
        occurredAt: '2023-01-01T00:00:00.000Z'
      };
      const error = new Error('Domain event publish failed');
      
      // Mock the publishDomainEvent method to throw an error
      const publishDomainEventSpy = jest.spyOn(signerEventService, 'publishDomainEvent')
        .mockRejectedValueOnce(error);

      await expect(
        signerEventService.publishModuleEvent(mockEvent)
      ).rejects.toThrow('Domain event publish failed');

      expect(publishDomainEventSpy).toHaveBeenCalled();
    });
  });

  describe('Event type consistency', () => {
    it('should use consistent event type naming', async () => {
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());

      // Test all event types follow the pattern
      await signerEventService.publishSignerCreated(mockSigner, 'user-123');
      expect(publishEventSpy).toHaveBeenCalledWith('signer.created', expect.any(Object));

      await signerEventService.publishSignerUpdated(mockSigner, 'user-123', {});
      expect(publishEventSpy).toHaveBeenCalledWith('signer.updated', expect.any(Object));

      await signerEventService.publishSignerStatusChanged(
        mockSigner, SignerStatus.PENDING, SignerStatus.SIGNED, 'user-123'
      );
      expect(publishEventSpy).toHaveBeenCalledWith('signer.status_changed', expect.any(Object));

      await signerEventService.publishSignerDeleted('signer-1', 'env-1', 'email@example.com', 'user-123');
      expect(publishEventSpy).toHaveBeenCalledWith('signer.deleted', expect.any(Object));

      await signerEventService.publishSignerInvited(mockSigner, 'token', 'user-123');
      expect(publishEventSpy).toHaveBeenCalledWith('signer.invited', expect.any(Object));

      await signerEventService.publishSignerReminder(mockSigner, 'user-123');
      expect(publishEventSpy).toHaveBeenCalledWith('signer.reminder', expect.any(Object));

      await signerEventService.publishSignerSigned(mockSigner, new Date());
      expect(publishEventSpy).toHaveBeenCalledWith('signer.signed', expect.any(Object));

      await signerEventService.publishSignerDeclined(mockSigner, new Date(), 'reason');
      expect(publishEventSpy).toHaveBeenCalledWith('signer.declined', expect.any(Object));
    });
  });

  describe('Timestamp handling', () => {
    it('should generate consistent timestamps for all events', async () => {
      // Mock the publishEvent method
      const publishEventSpy = jest.spyOn(signerEventService, 'publishEvent')
        .mockImplementation(jest.fn());
      const beforeTime = new Date();

      await signerEventService.publishSignerCreated(mockSigner, 'user-123');
      await signerEventService.publishSignerReminder(mockSigner, 'user-123');

      const afterTime = new Date();

      // Check that timestamps are within expected range
      const calls = publishEventSpy.mock.calls;
      for (const call of calls) {
        const payload = call[1] as Record<string, unknown>;
        const timestamp = new Date((payload.createdAt || payload.remindedAt) as string);
        expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      }
    });
  });
});