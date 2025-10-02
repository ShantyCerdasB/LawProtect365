/**
 * @fileoverview EnvelopeAccessService Tests - Unit tests for envelope access validation
 * @summary Tests for EnvelopeAccessService covering all access validation operations
 * @description Comprehensive unit tests for EnvelopeAccessService including authenticated
 * user access, external user access, and invitation token validation with proper mocking.
 */

import { EnvelopeAccessService } from '@/services/envelopeAccess/EnvelopeAccessService';
import { SignatureEnvelopeRepository } from '@/repositories/SignatureEnvelopeRepository';
import { InvitationTokenService } from '@/services/invitationTokenService/InvitationTokenService';
import { TestUtils } from '../../../helpers/testUtils';

// Mock the dependencies
jest.mock('@/repositories/SignatureEnvelopeRepository');
jest.mock('@/services/invitationTokenService/InvitationTokenService');

describe('EnvelopeAccessService', () => {
  let service: EnvelopeAccessService;
  let mockSignatureEnvelopeRepository: jest.Mocked<SignatureEnvelopeRepository>;
  let mockInvitationTokenService: jest.Mocked<InvitationTokenService>;

  // Helper functions to reduce nesting
  const createMockEnvelope = (id: string = 'test-envelope-id', createdBy: string = 'test-user-id') => ({
    getId: jest.fn(() => ({ getValue: () => id })),
    getTitle: jest.fn(() => 'Test Envelope'),
    getCreatedBy: jest.fn(() => createdBy)
  });

  const createMockEnvelopeId = (id: string = 'test-envelope-id') => {
    const envelopeId = TestUtils.generateEnvelopeId();
    envelopeId.getValue = jest.fn(() => id);
    return envelopeId;
  };

  const createMockToken = (envelopeId: string = 'test-envelope-id') => ({
    getEnvelopeId: jest.fn(() => ({ getValue: () => envelopeId }))
  });

  beforeEach(() => {
    mockSignatureEnvelopeRepository = {
      findById: jest.fn(),
    } as any;

    mockInvitationTokenService = {
      validateInvitationToken: jest.fn(),
    } as any;

    service = new EnvelopeAccessService(
      mockSignatureEnvelopeRepository,
      mockInvitationTokenService
    );
  });

  describe('Validate Envelope Access - Success Cases', () => {
    it('should validate authenticated user access successfully', async () => {
      const envelopeId = createMockEnvelopeId();
      const userId = 'test-user-id';
      const mockEnvelope = createMockEnvelope();

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);

      const result = await service.validateEnvelopeAccess(envelopeId, userId);

      expect(result).toBe(mockEnvelope);
      expect(mockSignatureEnvelopeRepository.findById).toHaveBeenCalledWith(envelopeId);
    });

  });

  describe('Validate Envelope Access - Error Cases', () => {
    it('should handle envelope not found', async () => {
      const envelopeId = createMockEnvelopeId('non-existent-envelope');
      const userId = 'test-user-id';

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(null);

      await expect(service.validateEnvelopeAccess(envelopeId, userId))
        .rejects.toThrow();
    });

    it('should handle access denied for different user', async () => {
      const envelopeId = createMockEnvelopeId();
      const userId = 'different-user-id';
      const mockEnvelope = createMockEnvelope();

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);

      await expect(service.validateEnvelopeAccess(envelopeId, userId))
        .rejects.toThrow();
    });

    it('should handle repository errors', async () => {
      const envelopeId = createMockEnvelopeId();
      const userId = 'test-user-id';

      mockSignatureEnvelopeRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(service.validateEnvelopeAccess(envelopeId, userId))
        .rejects.toThrow();
    });
  });

  describe('Validate External User Access - Success Cases', () => {
    it('should validate external user access successfully', async () => {
      const envelopeId = createMockEnvelopeId();
      const invitationToken = 'test-token';
      const mockToken = createMockToken();
      const mockEnvelope = createMockEnvelope();

      mockInvitationTokenService.validateInvitationToken.mockResolvedValue(mockToken as any);
      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);

      const result = await service.validateExternalUserAccess(envelopeId, invitationToken);

      expect(result).toBe(mockEnvelope);
      expect(mockInvitationTokenService.validateInvitationToken).toHaveBeenCalledWith(invitationToken);
      expect(mockSignatureEnvelopeRepository.findById).toHaveBeenCalledWith(envelopeId);
    });
  });

  describe('Validate External User Access - Error Cases', () => {
    it('should handle invalid invitation token for different envelope', async () => {
      const envelopeId = createMockEnvelopeId();
      const invitationToken = 'test-token';
      const mockToken = createMockToken('different-envelope-id');

      mockInvitationTokenService.validateInvitationToken.mockResolvedValue(mockToken as any);

      await expect(service.validateExternalUserAccess(envelopeId, invitationToken))
        .rejects.toThrow();
    });

    it('should handle envelope not found for external user', async () => {
      const envelopeId = createMockEnvelopeId();
      const invitationToken = 'test-token';
      const mockToken = createMockToken();

      mockInvitationTokenService.validateInvitationToken.mockResolvedValue(mockToken as any);
      mockSignatureEnvelopeRepository.findById.mockResolvedValue(null);

      await expect(service.validateExternalUserAccess(envelopeId, invitationToken))
        .rejects.toThrow();
    });

    it('should handle invitation token validation errors', async () => {
      const envelopeId = createMockEnvelopeId();
      const invitationToken = 'invalid-token';

      mockInvitationTokenService.validateInvitationToken.mockRejectedValue(new Error('Invalid token'));

      await expect(service.validateExternalUserAccess(envelopeId, invitationToken))
        .rejects.toThrow();
    });
  });

  describe('Validate User Access - Success Cases', () => {
    it('should validate authenticated user access', async () => {
      const envelopeId = createMockEnvelopeId();
      const userId = 'test-user-id';
      const mockEnvelope = createMockEnvelope();

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);

      const result = await service.validateUserAccess(envelopeId, userId);

      expect(result).toBe(mockEnvelope);
    });

    it('should validate external user access with invitation token', async () => {
      const envelopeId = createMockEnvelopeId();
      const invitationToken = 'test-token';
      const mockToken = createMockToken();
      const mockEnvelope = createMockEnvelope();

      mockInvitationTokenService.validateInvitationToken.mockResolvedValue(mockToken as any);
      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);

      const result = await service.validateUserAccess(envelopeId, undefined, invitationToken);

      expect(result).toBe(mockEnvelope);
    });

  });

  describe('Validate User Access - Error Cases', () => {
    it('should throw error when neither userId nor invitationToken provided', async () => {
      const envelopeId = createMockEnvelopeId();

      await expect(service.validateUserAccess(envelopeId))
        .rejects.toThrow();
    });

    it('should prioritize invitationToken when both userId and invitationToken provided', async () => {
      const envelopeId = createMockEnvelopeId();
      const userId = 'test-user-id';
      const invitationToken = 'test-token';
      const mockToken = createMockToken();
      const mockEnvelope = createMockEnvelope();

      mockInvitationTokenService.validateInvitationToken.mockResolvedValue(mockToken as any);
      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);

      const result = await service.validateUserAccess(envelopeId, userId, invitationToken);

      expect(result).toBe(mockEnvelope);
      expect(mockInvitationTokenService.validateInvitationToken).toHaveBeenCalledWith(invitationToken);
    });
  });
});
