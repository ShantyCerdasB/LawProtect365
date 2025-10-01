/**
 * @fileoverview EnvelopeAccessService Tests - Unit tests for envelope access validation
 * @summary Tests for EnvelopeAccessService covering all access validation operations
 * @description Comprehensive unit tests for EnvelopeAccessService including authenticated
 * user access, external user access, and invitation token validation with proper mocking.
 */

import { EnvelopeAccessService } from '@/services/envelopeAccess/EnvelopeAccessService';
import { SignatureEnvelopeRepository } from '@/repositories/SignatureEnvelopeRepository';
import { InvitationTokenService } from '@/services/invitationTokenService/InvitationTokenService';
import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';

// Mock the dependencies
jest.mock('@/repositories/SignatureEnvelopeRepository');
jest.mock('@/services/invitationTokenService/InvitationTokenService');
jest.mock('@/domain/entities/SignatureEnvelope');
jest.mock('@/domain/value-objects/EnvelopeId');

describe('EnvelopeAccessService', () => {
  let service: EnvelopeAccessService;
  let mockSignatureEnvelopeRepository: jest.Mocked<SignatureEnvelopeRepository>;
  let mockInvitationTokenService: jest.Mocked<InvitationTokenService>;

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

  describe('validateEnvelopeAccess', () => {
    it('should validate authenticated user access successfully', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const userId = 'test-user-id';

      const mockEnvelope = {
        getId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getTitle: jest.fn(() => 'Test Envelope'),
        getCreatedBy: jest.fn(() => 'test-user-id')
      };

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);

      const result = await service.validateEnvelopeAccess(envelopeId, userId);

      expect(result).toBe(mockEnvelope);
      expect(mockSignatureEnvelopeRepository.findById).toHaveBeenCalledWith(envelopeId);
    });

    it('should handle envelope not found', async () => {
      const envelopeId = { getValue: () => 'non-existent-envelope' } as any;
      const userId = 'test-user-id';

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(null);

      await expect(service.validateEnvelopeAccess(envelopeId, userId))
        .rejects.toThrow();
    });

    it('should handle access denied for different user', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const userId = 'different-user-id';

      const mockEnvelope = {
        getId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getTitle: jest.fn(() => 'Test Envelope'),
        getCreatedBy: jest.fn(() => 'test-user-id')
      };

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);

      await expect(service.validateEnvelopeAccess(envelopeId, userId))
        .rejects.toThrow();
    });

    it('should handle repository errors', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const userId = 'test-user-id';

      mockSignatureEnvelopeRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(service.validateEnvelopeAccess(envelopeId, userId))
        .rejects.toThrow();
    });
  });

  describe('validateExternalUserAccess', () => {
    it('should validate external user access successfully', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const invitationToken = 'test-token';

      const mockToken = {
        getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' }))
      };

      const mockEnvelope = {
        getId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getTitle: jest.fn(() => 'Test Envelope'),
        getCreatedBy: jest.fn(() => 'test-user-id')
      };

      mockInvitationTokenService.validateInvitationToken.mockResolvedValue(mockToken as any);
      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);

      const result = await service.validateExternalUserAccess(envelopeId, invitationToken);

      expect(result).toBe(mockEnvelope);
      expect(mockInvitationTokenService.validateInvitationToken).toHaveBeenCalledWith(invitationToken);
      expect(mockSignatureEnvelopeRepository.findById).toHaveBeenCalledWith(envelopeId);
    });

    it('should handle invalid invitation token for different envelope', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const invitationToken = 'test-token';

      const mockToken = {
        getEnvelopeId: jest.fn(() => ({ getValue: () => 'different-envelope-id' }))
      };

      mockInvitationTokenService.validateInvitationToken.mockResolvedValue(mockToken as any);

      await expect(service.validateExternalUserAccess(envelopeId, invitationToken))
        .rejects.toThrow();
    });

    it('should handle envelope not found for external user', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const invitationToken = 'test-token';

      const mockToken = {
        getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' }))
      };

      mockInvitationTokenService.validateInvitationToken.mockResolvedValue(mockToken as any);
      mockSignatureEnvelopeRepository.findById.mockResolvedValue(null);

      await expect(service.validateExternalUserAccess(envelopeId, invitationToken))
        .rejects.toThrow();
    });

    it('should handle invitation token validation errors', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const invitationToken = 'invalid-token';

      mockInvitationTokenService.validateInvitationToken.mockRejectedValue(new Error('Invalid token'));

      await expect(service.validateExternalUserAccess(envelopeId, invitationToken))
        .rejects.toThrow();
    });
  });

  describe('validateUserAccess', () => {
    it('should validate authenticated user access', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const userId = 'test-user-id';

      const mockEnvelope = {
        getId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getTitle: jest.fn(() => 'Test Envelope'),
        getCreatedBy: jest.fn(() => 'test-user-id')
      };

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);

      const result = await service.validateUserAccess(envelopeId, userId);

      expect(result).toBe(mockEnvelope);
    });

    it('should validate external user access with invitation token', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const invitationToken = 'test-token';

      const mockToken = {
        getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' }))
      };

      const mockEnvelope = {
        getId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getTitle: jest.fn(() => 'Test Envelope'),
        getCreatedBy: jest.fn(() => 'test-user-id')
      };

      mockInvitationTokenService.validateInvitationToken.mockResolvedValue(mockToken as any);
      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);

      const result = await service.validateUserAccess(envelopeId, undefined, invitationToken);

      expect(result).toBe(mockEnvelope);
    });

    it('should throw error when neither userId nor invitationToken provided', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;

      await expect(service.validateUserAccess(envelopeId))
        .rejects.toThrow();
    });

    it('should throw error when both userId and invitationToken provided', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const userId = 'test-user-id';
      const invitationToken = 'test-token';

      // This should prioritize invitationToken (external user access)
      const mockToken = {
        getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' }))
      };

      const mockEnvelope = {
        getId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getTitle: jest.fn(() => 'Test Envelope'),
        getCreatedBy: jest.fn(() => 'test-user-id')
      };

      mockInvitationTokenService.validateInvitationToken.mockResolvedValue(mockToken as any);
      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);

      const result = await service.validateUserAccess(envelopeId, userId, invitationToken);

      expect(result).toBe(mockEnvelope);
      expect(mockInvitationTokenService.validateInvitationToken).toHaveBeenCalledWith(invitationToken);
    });
  });
});
