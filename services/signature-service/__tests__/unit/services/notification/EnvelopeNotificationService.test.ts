/**
 * @fileoverview EnvelopeNotificationService.test.ts - Unit tests for EnvelopeNotificationService
 * @summary Tests for EnvelopeNotificationService notification operations
 * @description Tests all EnvelopeNotificationService methods including invitation notifications,
 * reminder notifications, and event publishing with comprehensive coverage.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { generateTestIpAddress } from '../../../integration/helpers/testHelpers';
import { EnvelopeNotificationService } from '../../../../src/services/notification/EnvelopeNotificationService';
import { IntegrationEventFactory } from '../../../../src/infrastructure/factories/events/IntegrationEventFactory';
import { IntegrationEventPublisher } from '@lawprotect/shared-ts';
import { SignatureEnvelope } from '../../../../src/domain/entities/SignatureEnvelope';
import { EnvelopeSigner } from '../../../../src/domain/entities/EnvelopeSigner';

// Mock the shared-ts modules
jest.mock('@lawprotect/shared-ts', () => ({
  nowIso: jest.fn(() => '2024-01-01T10:00:00Z'),
  NetworkSecurityContext: jest.fn()
}));

describe('EnvelopeNotificationService', () => {
  let envelopeNotificationService: EnvelopeNotificationService;
  let mockEventFactory: jest.Mocked<IntegrationEventFactory>;
  let mockEventPublisher: jest.Mocked<IntegrationEventPublisher>;
  let mockEnvelope: SignatureEnvelope;
  let mockSigners: EnvelopeSigner[];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mocks
    mockEventFactory = {
      envelopeInvitation: jest.fn(),
      viewerInvitation: jest.fn(),
      signerDeclined: jest.fn(),
      envelopeCancelled: jest.fn(),
      reminderNotification: jest.fn()
    } as any;

    mockEventPublisher = {
      publish: jest.fn()
    } as any;

    // Create test envelope
    mockEnvelope = {
      getId: () => ({ getValue: () => 'test-envelope-id' }),
      getTitle: () => 'Test Envelope',
      getStatus: () => ({ toString: () => 'DRAFT' })
    } as any;

    // Create test signers
    mockSigners = [
      {
        getId: () => ({ getValue: () => 'test-signer-id-1' }),
        getEmail: () => 'signer1@example.com',
        getFullName: () => 'Signer One'
      },
      {
        getId: () => ({ getValue: () => 'test-signer-id-2' }),
        getEmail: () => 'signer2@example.com',
        getFullName: () => 'Signer Two'
      }
    ] as any[];

    // Create service instance
    envelopeNotificationService = new EnvelopeNotificationService(
      mockEventFactory,
      mockEventPublisher
    );
  });

  describe('sendSignerInvitations', () => {
    it('should send invitations to all target signers', async () => {
      const mockEvent = { name: 'ENVELOPE_INVITATION', payload: {} } as any;
      mockEventFactory.envelopeInvitation.mockReturnValue(mockEvent);
      mockEventPublisher.publish.mockResolvedValue(undefined);

      await envelopeNotificationService.sendSignerInvitations(
        mockEnvelope,
        mockSigners
      );

      expect(mockEventFactory.envelopeInvitation).toHaveBeenCalledTimes(2);
      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(2);
    });

    it('should send invitations with custom tokens', async () => {
      const tokens = new Map([
        [mockSigners[0].getId().getValue(), 'token1'],
        [mockSigners[1].getId().getValue(), 'token2']
      ]);
      const mockEvent = { name: 'ENVELOPE_INVITATION', payload: {} } as any;
      mockEventFactory.envelopeInvitation.mockReturnValue(mockEvent);
      mockEventPublisher.publish.mockResolvedValue(undefined);

      await envelopeNotificationService.sendSignerInvitations(
        mockEnvelope,
        mockSigners,
        tokens
      );

      expect(mockEventFactory.envelopeInvitation).toHaveBeenCalledTimes(2);
      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(2);
    });

    it('should send invitations with custom message', async () => {
      const customMessage = 'Custom invitation message';
      const mockEvent = { name: 'ENVELOPE_INVITATION', payload: {} } as any;
      mockEventFactory.envelopeInvitation.mockReturnValue(mockEvent);
      mockEventPublisher.publish.mockResolvedValue(undefined);

      await envelopeNotificationService.sendSignerInvitations(
        mockEnvelope,
        mockSigners,
        undefined,
        customMessage
      );

      expect(mockEventFactory.envelopeInvitation).toHaveBeenCalledTimes(2);
      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(2);
    });

    it('should handle empty signers list', async () => {
      await envelopeNotificationService.sendSignerInvitations(
        mockEnvelope,
        []
      );

      expect(mockEventFactory.envelopeInvitation).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });

    it('should handle event publishing errors', async () => {
      const error = new Error('Event publishing failed');
      mockEventFactory.envelopeInvitation.mockReturnValue({ name: 'ENVELOPE_INVITATION', payload: {} } as any);
      mockEventPublisher.publish.mockRejectedValue(error);

      await expect(envelopeNotificationService.sendSignerInvitations(
        mockEnvelope,
        mockSigners
      )).rejects.toThrow('Event publishing failed');
    });
  });

  describe('sendViewerInvitation', () => {
    it('should send viewer invitation successfully', async () => {
      const mockEvent = { name: 'VIEWER_INVITATION', payload: {} } as any;
      mockEventFactory.viewerInvitation.mockReturnValue(mockEvent);
      mockEventPublisher.publish.mockResolvedValue(undefined);

      await envelopeNotificationService.sendViewerInvitation(
        mockEnvelope,
        'viewer@example.com',
        'Viewer Name',
        'viewer-token',
        new Date('2024-12-31T23:59:59Z')
      );

      expect(mockEventFactory.viewerInvitation).toHaveBeenCalledWith({
        envelope: mockEnvelope,
        email: 'viewer@example.com',
        fullName: 'Viewer Name',
        message: expect.any(String),
        token: 'viewer-token',
        expiresAtISO: '2024-12-31T23:59:59.000Z',
        sentAtISO: '2024-01-01T10:00:00Z'
      });
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(mockEvent, expect.any(String));
    });

    it('should send viewer invitation with custom message', async () => {
      const customMessage = 'Custom viewer message';
      const mockEvent = { name: 'VIEWER_INVITATION', payload: {} } as any;
      mockEventFactory.viewerInvitation.mockReturnValue(mockEvent);
      mockEventPublisher.publish.mockResolvedValue(undefined);

      await envelopeNotificationService.sendViewerInvitation(
        mockEnvelope,
        'viewer@example.com',
        'Viewer Name',
        'viewer-token',
        new Date('2024-12-31T23:59:59Z'),
        customMessage
      );

      expect(mockEventFactory.viewerInvitation).toHaveBeenCalledWith({
        envelope: mockEnvelope,
        email: 'viewer@example.com',
        fullName: 'Viewer Name',
        message: customMessage,
        token: 'viewer-token',
        expiresAtISO: '2024-12-31T23:59:59.000Z',
        sentAtISO: '2024-01-01T10:00:00Z'
      });
    });
  });

  describe('publishSignerDeclined', () => {
    it('should publish signer declined notification', async () => {
      const mockEvent = { name: 'SIGNER_DECLINED', payload: {} } as any;
      mockEventFactory.signerDeclined.mockReturnValue(mockEvent);
      mockEventPublisher.publish.mockResolvedValue(undefined);

      await envelopeNotificationService.publishSignerDeclined(
        mockEnvelope,
        mockSigners[0],
        'Not interested'
      );

      expect(mockEventFactory.signerDeclined).toHaveBeenCalledWith({
        envelope: mockEnvelope,
        signer: mockSigners[0],
        reason: 'Not interested',
        whenISO: '2024-01-01T10:00:00Z',
        ipAddress: undefined,
        userAgent: undefined,
        country: undefined
      });
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(mockEvent, expect.any(String));
    });

    it('should publish signer declined with security context', async () => {
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'TestAgent/1.0',
        country: 'US'
      };
      const mockEvent = { name: 'SIGNER_DECLINED', payload: {} } as any;
      mockEventFactory.signerDeclined.mockReturnValue(mockEvent);
      mockEventPublisher.publish.mockResolvedValue(undefined);

      await envelopeNotificationService.publishSignerDeclined(
        mockEnvelope,
        mockSigners[0],
        'Not interested',
        securityContext
      );

      expect(mockEventFactory.signerDeclined).toHaveBeenCalledWith({
        envelope: mockEnvelope,
        signer: mockSigners[0],
        reason: 'Not interested',
        whenISO: '2024-01-01T10:00:00Z',
        ipAddress: expect.any(String),
        userAgent: 'TestAgent/1.0',
        country: 'US'
      });
    });
  });

  describe('publishEnvelopeCancelled', () => {
    it('should publish envelope cancelled notification', async () => {
      const mockEvent = { name: 'ENVELOPE_CANCELLED', payload: {} } as any;
      mockEventFactory.envelopeCancelled.mockReturnValue(mockEvent);
      mockEventPublisher.publish.mockResolvedValue(undefined);

      await envelopeNotificationService.publishEnvelopeCancelled(
        mockEnvelope,
        'user123'
      );

      expect(mockEventFactory.envelopeCancelled).toHaveBeenCalledWith({
        envelope: mockEnvelope,
        cancelledByUserId: 'user123',
        whenISO: '2024-01-01T10:00:00Z',
        ipAddress: undefined,
        userAgent: undefined,
        country: undefined
      });
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(mockEvent, expect.any(String));
    });

    it('should publish envelope cancelled with security context', async () => {
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'TestAgent/1.0',
        country: 'US'
      };
      const mockEvent = { name: 'ENVELOPE_CANCELLED', payload: {} } as any;
      mockEventFactory.envelopeCancelled.mockReturnValue(mockEvent);
      mockEventPublisher.publish.mockResolvedValue(undefined);

      await envelopeNotificationService.publishEnvelopeCancelled(
        mockEnvelope,
        'user123',
        securityContext
      );

      expect(mockEventFactory.envelopeCancelled).toHaveBeenCalledWith({
        envelope: mockEnvelope,
        cancelledByUserId: 'user123',
        whenISO: '2024-01-01T10:00:00Z',
        ipAddress: expect.any(String),
        userAgent: 'TestAgent/1.0',
        country: 'US'
      });
    });
  });

  describe('publishReminder', () => {
    it('should publish reminder notification', async () => {
      const mockEvent = { name: 'REMINDER_NOTIFICATION', payload: {} } as any;
      mockEventFactory.reminderNotification.mockReturnValue(mockEvent);
      mockEventPublisher.publish.mockResolvedValue(undefined);

      await envelopeNotificationService.publishReminder(
        { getValue: () => 'test-envelope-id' } as any,
        { getValue: () => 'test-signer-id' } as any,
        'Please sign the document',
        1
      );

      expect(mockEventFactory.reminderNotification).toHaveBeenCalledWith({
        envelopeId: expect.any(String),
        signerId: expect.any(String),
        message: 'Please sign the document',
        reminderCount: 1,
        whenISO: '2024-01-01T10:00:00Z'
      });
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(mockEvent, expect.any(String));
    });

    it('should publish reminder with default message when none provided', async () => {
      const mockEvent = { name: 'REMINDER_NOTIFICATION', payload: {} } as any;
      mockEventFactory.reminderNotification.mockReturnValue(mockEvent);
      mockEventPublisher.publish.mockResolvedValue(undefined);

      await envelopeNotificationService.publishReminder(
        { getValue: () => 'test-envelope-id' } as any,
        { getValue: () => 'test-signer-id' } as any,
        undefined,
        2
      );

      expect(mockEventFactory.reminderNotification).toHaveBeenCalledWith({
        envelopeId: expect.any(String),
        signerId: expect.any(String),
        message: expect.any(String),
        reminderCount: 2,
        whenISO: '2024-01-01T10:00:00Z'
      });
    });
  });
});