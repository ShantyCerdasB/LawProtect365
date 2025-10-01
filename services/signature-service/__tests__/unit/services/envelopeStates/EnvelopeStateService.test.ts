/**
 * @fileoverview EnvelopeStateService.test.ts - Unit tests for EnvelopeStateService
 * @summary Comprehensive test suite for envelope state management operations
 * @description Tests all methods of EnvelopeStateService including sending, completing, declining envelopes, and error handling scenarios.
 */

import { jest } from '@jest/globals';
import { EnvelopeStateService } from '../../../../src/services/envelopeStates/EnvelopeStateService';
import { AuditEventType } from '../../../../src/domain/enums/AuditEventType';

// Mock all the problematic imports
jest.mock('../../../../src/repositories/SignatureEnvelopeRepository');
jest.mock('../../../../src/services/audit/AuditEventService');
jest.mock('../../../../src/domain/entities/SignatureEnvelope');
jest.mock('../../../../src/domain/value-objects/EnvelopeId');
jest.mock('../../../../src/domain/value-objects/SignerId');
jest.mock('../../../../src/signature-errors');

// Mock the shared-ts modules
jest.mock('@lawprotect/shared-ts', () => ({
  createNetworkSecurityContext: jest.fn(() => ({
    ipAddress: '192.168.1.1',
    userAgent: 'TestAgent/1.0',
    country: 'US'
  }))
}));

// Mock the signature-errors
jest.mock('../../../../src/signature-errors', () => ({
  envelopeNotFound: jest.fn((message: string) => new Error(`ENVELOPE_NOT_FOUND: ${message}`)),
  envelopeAccessDenied: jest.fn((message: string) => new Error(`ENVELOPE_ACCESS_DENIED: ${message}`)),
  invalidEnvelopeState: jest.fn((message: string) => new Error(`INVALID_ENVELOPE_STATE: ${message}`)),
  envelopeUpdateFailed: jest.fn((message: string) => new Error(`ENVELOPE_UPDATE_FAILED: ${message}`))
}));

describe('EnvelopeStateService', () => {
  let envelopeStateService: EnvelopeStateService;
  let mockSignatureEnvelopeRepository: any;
  let mockAuditEventService: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock repositories
    mockSignatureEnvelopeRepository = {
      getWithSigners: jest.fn(),
      update: jest.fn(),
      completeEnvelope: jest.fn()
    };

    mockAuditEventService = {
      create: jest.fn()
    };

    // Create service instance
    envelopeStateService = new EnvelopeStateService(
      mockSignatureEnvelopeRepository,
      mockAuditEventService
    );
  });

  describe('sendEnvelope', () => {
    const mockEnvelopeId = { getValue: () => 'test-envelope-id' };
    const mockUserId = 'test-user-id';

    const mockEnvelope = {
      getCreatedBy: () => mockUserId,
      isInFinalState: () => false,
      hasExternalSigners: () => true,
      validateExternalSigners: jest.fn(),
      getStatus: () => ({ isDraft: () => true }),
      send: jest.fn(),
      getTitle: () => 'Test Envelope',
      getSigners: () => [{ id: 'signer1' }, { id: 'signer2' }],
      getSentAt: () => new Date('2024-01-01T10:00:00Z')
    };

    it('should send envelope successfully', async () => {
      const mockUpdatedEnvelope = { ...mockEnvelope };
      
      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(mockEnvelope);
      mockSignatureEnvelopeRepository.update.mockResolvedValue(mockUpdatedEnvelope);
      mockAuditEventService.create.mockResolvedValue({} as any);

      const result = await envelopeStateService.sendEnvelope(mockEnvelopeId as any, mockUserId);

      expect(result).toBe(mockUpdatedEnvelope);
      expect(mockEnvelope.send).toHaveBeenCalled();
      expect(mockSignatureEnvelopeRepository.update).toHaveBeenCalledWith(mockEnvelopeId, mockEnvelope);
      expect(mockAuditEventService.create).toHaveBeenCalledWith({
        envelopeId: 'test-envelope-id',
        signerId: undefined,
        eventType: AuditEventType.ENVELOPE_SENT,
        description: 'Envelope "Test Envelope" sent for signature',
        userId: mockUserId,
        userEmail: undefined,
        networkContext: expect.any(Object),
        metadata: {
          envelopeId: 'test-envelope-id',
          title: 'Test Envelope',
          sentAt: expect.any(String),
          signerCount: 2
        }
      });
    });

    it('should throw error when envelope not found', async () => {
      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(null);

      await expect(
        envelopeStateService.sendEnvelope(mockEnvelopeId as any, mockUserId)
      ).rejects.toThrow('ENVELOPE_NOT_FOUND: Envelope with ID test-envelope-id not found');
    });

    it('should throw error when user is not the creator', async () => {
      const mockEnvelopeWithDifferentCreator = {
        ...mockEnvelope,
        getCreatedBy: () => 'different-user-id'
      };

      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(mockEnvelopeWithDifferentCreator);

      await expect(
        envelopeStateService.sendEnvelope(mockEnvelopeId as any, mockUserId)
      ).rejects.toThrow('ENVELOPE_ACCESS_DENIED: Only envelope owner can send envelope');
    });

    it('should throw error when envelope is in final state', async () => {
      const mockEnvelopeInFinalState = {
        ...mockEnvelope,
        isInFinalState: () => true
      };

      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(mockEnvelopeInFinalState);

      await expect(
        envelopeStateService.sendEnvelope(mockEnvelopeId as any, mockUserId)
      ).rejects.toThrow('INVALID_ENVELOPE_STATE: Cannot send envelope in final state');
    });

    it('should throw error when envelope has no external signers', async () => {
      const mockEnvelopeWithoutExternalSigners = {
        ...mockEnvelope,
        hasExternalSigners: () => false
      };

      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(mockEnvelopeWithoutExternalSigners);

      await expect(
        envelopeStateService.sendEnvelope(mockEnvelopeId as any, mockUserId)
      ).rejects.toThrow('INVALID_ENVELOPE_STATE: Envelope must have at least one external signer');
    });

    it('should throw error when external signers validation fails', async () => {
      mockEnvelope.validateExternalSigners.mockImplementation(() => {
        throw new Error('External signers validation failed');
      });

      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(mockEnvelope);

      await expect(
        envelopeStateService.sendEnvelope(mockEnvelopeId as any, mockUserId)
      ).rejects.toThrow('ENVELOPE_UPDATE_FAILED: Failed to send envelope test-envelope-id: External signers validation failed');
    });

    it('should return envelope without updating if not in draft state', async () => {
      const mockEnvelopeNotDraft = {
        ...mockEnvelope,
        getStatus: () => ({ isDraft: () => false }),
        validateExternalSigners: jest.fn()
      };

      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(mockEnvelopeNotDraft);

      const result = await envelopeStateService.sendEnvelope(mockEnvelopeId as any, mockUserId);

      expect(result).toBe(mockEnvelopeNotDraft);
      expect(mockEnvelopeNotDraft.send).not.toHaveBeenCalled();
      expect(mockSignatureEnvelopeRepository.update).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      mockSignatureEnvelopeRepository.getWithSigners.mockRejectedValue(new Error('Database error'));

      await expect(
        envelopeStateService.sendEnvelope(mockEnvelopeId as any, mockUserId)
      ).rejects.toThrow('ENVELOPE_UPDATE_FAILED: Failed to send envelope test-envelope-id: Database error');
    });
  });

  describe('completeEnvelope', () => {
    const mockEnvelopeId = { getValue: () => 'test-envelope-id' };
    const mockUserId = 'test-user-id';

    const mockCompletedEnvelope = {
      getTitle: () => 'Test Envelope',
      getCompletedAt: () => new Date('2024-01-01T10:00:00Z')
    };

    it('should complete envelope successfully', async () => {
      mockSignatureEnvelopeRepository.completeEnvelope.mockResolvedValue(mockCompletedEnvelope);
      mockAuditEventService.create.mockResolvedValue({} as any);

      const result = await envelopeStateService.completeEnvelope(mockEnvelopeId as any, mockUserId);

      expect(result).toBe(mockCompletedEnvelope);
      expect(mockSignatureEnvelopeRepository.completeEnvelope).toHaveBeenCalledWith(mockEnvelopeId);
      expect(mockAuditEventService.create).toHaveBeenCalledWith({
        envelopeId: 'test-envelope-id',
        signerId: undefined,
        eventType: AuditEventType.ENVELOPE_COMPLETED,
        description: 'Envelope "Test Envelope" completed - all signers have signed',
        userId: mockUserId,
        userEmail: undefined,
        networkContext: expect.any(Object),
        metadata: {
          envelopeId: 'test-envelope-id',
          completedAt: expect.any(String)
        }
      });
    });

    it('should handle repository errors', async () => {
      mockSignatureEnvelopeRepository.completeEnvelope.mockRejectedValue(new Error('Database error'));

      await expect(
        envelopeStateService.completeEnvelope(mockEnvelopeId as any, mockUserId)
      ).rejects.toThrow('ENVELOPE_UPDATE_FAILED: Failed to complete envelope test-envelope-id: Database error');
    });
  });

  describe('updateEnvelopeStatusAfterDecline', () => {
    const mockEnvelopeId = { getValue: () => 'test-envelope-id' };
    const mockDeclinedBySignerId = { getValue: () => 'test-signer-id' };
    const mockDeclineReason = 'Not interested';
    const mockUserId = 'test-user-id';

    const mockEnvelope = {
      setDeclinedInfo: jest.fn(),
      getDeclinedAt: () => new Date('2024-01-01T10:00:00Z')
    };

    it('should update envelope status after decline successfully', async () => {
      const mockUpdatedEnvelope = { ...mockEnvelope };
      
      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(mockEnvelope);
      mockSignatureEnvelopeRepository.update.mockResolvedValue(mockUpdatedEnvelope);
      mockAuditEventService.create.mockResolvedValue({} as any);

      const result = await envelopeStateService.updateEnvelopeStatusAfterDecline(
        mockEnvelopeId as any,
        mockDeclinedBySignerId as any,
        mockDeclineReason,
        mockUserId
      );

      expect(result).toBe(mockUpdatedEnvelope);
      expect(mockEnvelope.setDeclinedInfo).toHaveBeenCalledWith('test-signer-id', mockDeclineReason);
      expect(mockSignatureEnvelopeRepository.update).toHaveBeenCalledWith(mockEnvelopeId, mockEnvelope);
      expect(mockAuditEventService.create).toHaveBeenCalledWith({
        envelopeId: 'test-envelope-id',
        signerId: 'test-signer-id',
        eventType: AuditEventType.ENVELOPE_DECLINED,
        description: 'Envelope declined by signer test-signer-id',
        userId: mockUserId,
        userEmail: undefined,
        networkContext: expect.any(Object),
        metadata: {
          envelopeId: 'test-envelope-id',
          declinedBySignerId: 'test-signer-id',
          declineReason: mockDeclineReason,
          declinedAt: expect.any(String)
        }
      });
    });

    it('should throw error when envelope not found', async () => {
      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(null);

      await expect(
        envelopeStateService.updateEnvelopeStatusAfterDecline(
          mockEnvelopeId as any,
          mockDeclinedBySignerId as any,
          mockDeclineReason,
          mockUserId
        )
      ).rejects.toThrow('ENVELOPE_NOT_FOUND: Envelope with ID test-envelope-id not found');
    });

    it('should handle repository errors', async () => {
      mockSignatureEnvelopeRepository.getWithSigners.mockRejectedValue(new Error('Database error'));

      await expect(
        envelopeStateService.updateEnvelopeStatusAfterDecline(
          mockEnvelopeId as any,
          mockDeclinedBySignerId as any,
          mockDeclineReason,
          mockUserId
        )
      ).rejects.toThrow('ENVELOPE_UPDATE_FAILED: Failed to update envelope status after decline test-envelope-id: ENVELOPE_NOT_FOUND: Failed to get envelope with signers test-envelope-id: Database error');
    });

    it('should handle update errors', async () => {
      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(mockEnvelope);
      mockSignatureEnvelopeRepository.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        envelopeStateService.updateEnvelopeStatusAfterDecline(
          mockEnvelopeId as any,
          mockDeclinedBySignerId as any,
          mockDeclineReason,
          mockUserId
        )
      ).rejects.toThrow('ENVELOPE_UPDATE_FAILED: Failed to update envelope status after decline test-envelope-id: Update failed');
    });
  });

  describe('getEnvelopeWithSigners', () => {
    const mockEnvelopeId = { getValue: () => 'test-envelope-id' };

    it('should get envelope with signers successfully', async () => {
      const mockEnvelopeWithSigners = {
        getCreatedBy: () => 'test-user-id',
        isInFinalState: () => false,
        hasExternalSigners: () => true,
        validateExternalSigners: jest.fn(),
        getStatus: () => ({ isDraft: () => true }),
        send: jest.fn(),
        getTitle: () => 'Test Envelope',
        getSigners: () => [{ id: 'signer1' }],
        getSentAt: () => new Date('2024-01-01T10:00:00Z')
      };
      
      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(mockEnvelopeWithSigners);
      mockSignatureEnvelopeRepository.update.mockResolvedValue(mockEnvelopeWithSigners);
      mockAuditEventService.create.mockResolvedValue({} as any);

      // This is a private method, so we test it indirectly through public methods
      const result = await envelopeStateService.sendEnvelope(mockEnvelopeId as any, 'test-user-id');

      expect(mockSignatureEnvelopeRepository.getWithSigners).toHaveBeenCalledWith(mockEnvelopeId);
    });

    it('should handle errors when getting envelope with signers', async () => {
      mockSignatureEnvelopeRepository.getWithSigners.mockRejectedValue(new Error('Database error'));

      await expect(
        envelopeStateService.sendEnvelope(mockEnvelopeId as any, 'test-user-id')
      ).rejects.toThrow('ENVELOPE_UPDATE_FAILED: Failed to send envelope test-envelope-id: Database error');
    });
  });
});
