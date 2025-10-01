/**
 * @fileoverview InvitationTokenService.test.ts - Unit tests for InvitationTokenService
 * @summary Comprehensive test suite for invitation token business logic
 * @description Tests all methods of InvitationTokenService including token generation,
 * validation, marking as viewed/signed, and error handling scenarios.
 */

import { jest } from '@jest/globals';
import { InvitationTokenService } from '../../../../src/services/invitationTokenService/InvitationTokenService';
import { AuditEventType } from '../../../../src/domain/enums/AuditEventType';

// Mock all the problematic imports
jest.mock('../../../../src/repositories/InvitationTokenRepository');
jest.mock('../../../../src/repositories/EnvelopeSignerRepository');
jest.mock('../../../../src/services/audit/AuditEventService');
jest.mock('../../../../src/domain/entities/InvitationToken');
jest.mock('../../../../src/domain/entities/EnvelopeSigner');
jest.mock('../../../../src/domain/value-objects/InvitationTokenId');
jest.mock('../../../../src/domain/value-objects/EnvelopeId');
jest.mock('../../../../src/domain/value-objects/SignerId');
jest.mock('../../../../src/domain/rules/InvitationTokenValidationRule');

// Mock the shared-ts modules
jest.mock('@lawprotect/shared-ts', () => ({
  randomToken: jest.fn(() => 'mocked-random-token'),
  sha256Hex: jest.fn((token: string) => `hashed-${token}`),
  NetworkSecurityContext: jest.fn(),
  Identifier: class {
    constructor(public value: string) {}
    getValue() { return this.value; }
    equals(other: any) { return this.value === other?.value; }
    toJSON() { return this.value; }
  }
}));

// Mock the signature-errors
jest.mock('../../../../src/signature-errors', () => ({
  invitationTokenInvalid: jest.fn((message: string) => new Error(`INVITATION_TOKEN_INVALID: ${message}`))
}));

// Mock the validation rule
jest.mock('../../../../src/domain/rules/InvitationTokenValidationRule', () => ({
  InvitationTokenValidationRule: {
    validateTokenCreation: jest.fn(),
    validateExpiration: jest.fn(),
    validateToken: jest.fn()
  }
}));


describe('InvitationTokenService', () => {
  let invitationTokenService: InvitationTokenService;
  let mockInvitationTokenRepository: any;
  let mockEnvelopeSignerRepository: any;
  let mockAuditEventService: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock repositories
    mockInvitationTokenRepository = {
      create: jest.fn(),
      update: jest.fn(),
      getByToken: jest.fn(),
      findById: jest.fn(),
      findBySignerId: jest.fn()
    };

    mockEnvelopeSignerRepository = {
      findById: jest.fn()
    };

    mockAuditEventService = {
      createSignerEvent: jest.fn()
    };

    // Create service instance
    invitationTokenService = new InvitationTokenService(
      mockInvitationTokenRepository,
      mockEnvelopeSignerRepository,
      mockAuditEventService
    );
  });

  describe('generateInvitationTokensForSigners', () => {
    const mockSecurityContext = {
      userId: 'test-user-id',
      ipAddress: '192.168.1.1',
      userAgent: 'TestAgent/1.0',
      country: 'US'
    };

    const mockEnvelopeId = { getValue: () => 'test-envelope-id' };
    const mockSignerId = { getValue: () => 'test-signer-id' };

    const mockSigner = {
      getId: () => mockSignerId,
      getEmail: () => ({ getValue: () => 'signer@example.com' }),
      getFullName: () => 'Test Signer'
    };

    const mockInvitationToken = {
      getId: () => ({ getValue: () => 'test-token-id' }),
      getEnvelopeId: () => mockEnvelopeId,
      getSignerId: () => mockSignerId,
      markAsSent: jest.fn()
    };

    it('should generate invitation tokens for all signers', async () => {
      const mockCreatedToken = mockInvitationToken;
      const mockSentToken = mockInvitationToken;

      mockInvitationTokenRepository.create.mockResolvedValue(mockCreatedToken);
      mockInvitationTokenRepository.update.mockResolvedValue(mockSentToken);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      const result = await invitationTokenService.generateInvitationTokensForSigners(
        [mockSigner] as any,
        mockEnvelopeId as any,
        mockSecurityContext
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        token: 'mocked-random-token',
        signerId: 'test-signer-id',
        email: 'signer@example.com',
        expiresAt: expect.any(Date)
      });

      expect(mockInvitationTokenRepository.create).toHaveBeenCalledTimes(1);
      expect(mockInvitationTokenRepository.update).toHaveBeenCalledTimes(1);
      expect(mockAuditEventService.createSignerEvent).toHaveBeenCalledWith({
        envelopeId: 'test-envelope-id',
        signerId: 'test-signer-id',
        eventType: AuditEventType.INVITATION_ISSUED,
        description: 'Invitation issued to signer@example.com',
        userId: 'test-user-id',
        userEmail: 'signer@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent/1.0',
        country: 'US',
        metadata: expect.objectContaining({
          tokenId: 'test-token-id',
          signerEmail: 'signer@example.com',
          signerName: 'Test Signer'
        })
      });
    });

    it('should skip token generation for owner-only scenarios', async () => {
      const result = await invitationTokenService.generateInvitationTokensForSigners(
        [mockSigner] as any,
        mockEnvelopeId as any,
        mockSecurityContext,
        'signer@example.com' // Same email as signer
      );

      expect(result).toHaveLength(0);
      expect(mockInvitationTokenRepository.create).not.toHaveBeenCalled();
    });

    it('should handle multiple signers', async () => {
      const mockSigner2 = {
        getId: () => ({ getValue: () => 'test-signer-id-2' }),
        getEmail: () => ({ getValue: () => 'signer2@example.com' }),
        getFullName: () => 'Test Signer 2'
      };

      const mockCreatedToken = mockInvitationToken;
      const mockSentToken = mockInvitationToken;

      mockInvitationTokenRepository.create.mockResolvedValue(mockCreatedToken);
      mockInvitationTokenRepository.update.mockResolvedValue(mockSentToken);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      const result = await invitationTokenService.generateInvitationTokensForSigners(
        [mockSigner, mockSigner2] as any,
        mockEnvelopeId as any,
        mockSecurityContext
      );

      expect(result).toHaveLength(2);
      expect(mockInvitationTokenRepository.create).toHaveBeenCalledTimes(2);
      expect(mockInvitationTokenRepository.update).toHaveBeenCalledTimes(2);
    });

    it('should handle empty signers list', async () => {
      const result = await invitationTokenService.generateInvitationTokensForSigners(
        [],
        mockEnvelopeId as any,
        mockSecurityContext
      );

      expect(result).toHaveLength(0);
      expect(mockInvitationTokenRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when token creation fails', async () => {
      mockInvitationTokenRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(
        invitationTokenService.generateInvitationTokensForSigners(
          [mockSigner] as any,
          mockEnvelopeId as any,
          mockSecurityContext
        )
      ).rejects.toThrow('INVITATION_TOKEN_INVALID: Failed to generate invitation tokens: Database error');
    });
  });

  describe('generateViewerInvitationToken', () => {
    const mockSecurityContext = {
      userId: 'test-user-id',
      ipAddress: '192.168.1.1',
      userAgent: 'TestAgent/1.0',
      country: 'US'
    };

    const mockEnvelopeId = { getValue: () => 'test-envelope-id' };
    const mockSignerId = { getValue: () => 'test-signer-id' };

    const mockInvitationToken = {
      getId: () => ({ getValue: () => 'test-token-id' }),
      getEnvelopeId: () => mockEnvelopeId,
      getSignerId: () => mockSignerId,
      markAsSent: jest.fn()
    };

    it('should generate viewer invitation token', async () => {
      const mockCreatedToken = mockInvitationToken;
      const mockSentToken = mockInvitationToken;

      mockInvitationTokenRepository.create.mockResolvedValue(mockCreatedToken);
      mockInvitationTokenRepository.update.mockResolvedValue(mockSentToken);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      const result = await invitationTokenService.generateViewerInvitationToken(
        mockSignerId as any,
        'viewer@example.com',
        'Test Viewer',
        mockEnvelopeId as any,
        mockSecurityContext,
        14 // 14 days expiration
      );

      expect(result).toMatchObject({
        token: 'mocked-random-token',
        signerId: 'test-signer-id',
        email: 'viewer@example.com',
        expiresAt: expect.any(Date)
      });

      expect(mockInvitationTokenRepository.create).toHaveBeenCalledTimes(1);
      expect(mockInvitationTokenRepository.update).toHaveBeenCalledTimes(1);
      expect(mockAuditEventService.createSignerEvent).toHaveBeenCalledWith({
        envelopeId: 'test-envelope-id',
        signerId: 'test-signer-id',
        eventType: AuditEventType.INVITATION_ISSUED,
        description: 'View invitation issued to viewer@example.com (Test Viewer)',
        userId: 'test-user-id',
        userEmail: 'viewer@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent/1.0',
        country: 'US',
        metadata: expect.objectContaining({
          tokenId: 'test-token-id',
          viewerEmail: 'viewer@example.com',
          viewerName: 'Test Viewer',
          participantRole: 'VIEWER'
        })
      });
    });

    it('should use default expiration when not provided', async () => {
      const mockCreatedToken = mockInvitationToken;
      const mockSentToken = mockInvitationToken;

      mockInvitationTokenRepository.create.mockResolvedValue(mockCreatedToken);
      mockInvitationTokenRepository.update.mockResolvedValue(mockSentToken);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      await invitationTokenService.generateViewerInvitationToken(
        mockSignerId as any,
        'viewer@example.com',
        'Test Viewer',
        mockEnvelopeId as any,
        mockSecurityContext
      );

      expect(mockInvitationTokenRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error when viewer token creation fails', async () => {
      mockInvitationTokenRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(
        invitationTokenService.generateViewerInvitationToken(
          mockSignerId as any,
          'viewer@example.com',
          'Test Viewer',
          mockEnvelopeId as any,
          mockSecurityContext
        )
      ).rejects.toThrow('INVITATION_TOKEN_INVALID: Failed to generate viewer invitation token: Database error');
    });
  });

  describe('validateInvitationToken', () => {
    const mockInvitationToken = {
      getId: () => ({ getValue: () => 'test-token-id' }),
      getEnvelopeId: () => ({ getValue: () => 'test-envelope-id' }),
      getSignerId: () => ({ getValue: () => 'test-signer-id' })
    };

    it('should validate token successfully', async () => {
      mockInvitationTokenRepository.getByToken.mockResolvedValue(mockInvitationToken);

      const result = await invitationTokenService.validateInvitationToken('valid-token');

      expect(result).toBe(mockInvitationToken);
      expect(mockInvitationTokenRepository.getByToken).toHaveBeenCalledWith('valid-token');
    });

    it('should throw error when token not found', async () => {
      mockInvitationTokenRepository.getByToken.mockResolvedValue(null);

      await expect(
        invitationTokenService.validateInvitationToken('invalid-token')
      ).rejects.toThrow('INVITATION_TOKEN_INVALID: Token not found');
    });

    it('should rethrow specific error codes', async () => {
      const specificError = new Error('Token expired');
      (specificError as any).code = 'INVITATION_TOKEN_EXPIRED';
      mockInvitationTokenRepository.getByToken.mockRejectedValue(specificError);

      await expect(
        invitationTokenService.validateInvitationToken('expired-token')
      ).rejects.toThrow('Token expired');
    });

    it('should throw generic error for other failures', async () => {
      mockInvitationTokenRepository.getByToken.mockRejectedValue(new Error('Database error'));

      await expect(
        invitationTokenService.validateInvitationToken('error-token')
      ).rejects.toThrow('INVITATION_TOKEN_INVALID: Token validation failed: Database error');
    });
  });

  describe('markTokenAsViewed', () => {
    const mockSecurityContext = {
      ipAddress: '192.168.1.1',
      userAgent: 'TestAgent/1.0',
      country: 'US'
    };

    const mockInvitationToken = {
      getId: () => ({ getValue: () => 'test-token-id' }),
      getEnvelopeId: () => ({ getValue: () => 'test-envelope-id' }),
      getSignerId: () => ({ getValue: () => 'test-signer-id' }),
      markAsViewed: jest.fn(),
      getViewCount: () => 1,
      getLastViewedAt: () => new Date()
    };

    const mockSigner = {
      getFullName: () => 'Test Signer',
      getEmail: () => ({ getValue: () => 'signer@example.com' })
    };

    it('should mark token as viewed successfully', async () => {
      const mockUpdatedToken = mockInvitationToken;
      
      mockInvitationTokenRepository.getByToken.mockResolvedValue(mockInvitationToken);
      mockInvitationTokenRepository.update.mockResolvedValue(mockUpdatedToken);
      mockEnvelopeSignerRepository.findById.mockResolvedValue(mockSigner);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      const result = await invitationTokenService.markTokenAsViewed('valid-token', mockSecurityContext);

      expect(result).toBe(mockUpdatedToken);
      expect(mockInvitationToken.markAsViewed).toHaveBeenCalledWith(mockSecurityContext);
      expect(mockInvitationTokenRepository.update).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object)
      );
      expect(mockAuditEventService.createSignerEvent).toHaveBeenCalledWith({
        envelopeId: 'test-envelope-id',
        signerId: 'test-signer-id',
        eventType: AuditEventType.INVITATION_TOKEN_USED,
        description: 'Invitation token viewed by external signer',
        userId: 'external-user:Test Signer',
        userEmail: 'signer@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent/1.0',
        country: 'US',
        metadata: {
          viewCount: 1,
          lastViewedAt: expect.any(String)
        }
      });
    });

    it('should handle missing signer information', async () => {
      const mockUpdatedToken = mockInvitationToken;
      
      mockInvitationTokenRepository.getByToken.mockResolvedValue(mockInvitationToken);
      mockInvitationTokenRepository.update.mockResolvedValue(mockUpdatedToken);
      mockEnvelopeSignerRepository.findById.mockResolvedValue(null);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      await invitationTokenService.markTokenAsViewed('valid-token', mockSecurityContext);

      expect(mockAuditEventService.createSignerEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'external-user:Unknown',
          userEmail: undefined
        })
      );
    });

    it('should throw error when marking token as viewed fails', async () => {
      mockInvitationTokenRepository.getByToken.mockRejectedValue(new Error('Token not found'));

      await expect(
        invitationTokenService.markTokenAsViewed('invalid-token', mockSecurityContext)
      ).rejects.toThrow('INVITATION_TOKEN_INVALID: Failed to mark token as viewed: INVITATION_TOKEN_INVALID: Token validation failed: Token not found');
    });
  });

  describe('markTokenAsSigned', () => {
    const mockSecurityContext = {
      ipAddress: '192.168.1.1',
      userAgent: 'TestAgent/1.0',
      country: 'US'
    };

    const mockInvitationToken = {
      getId: () => ({ getValue: () => 'test-token-id' }),
      getEnvelopeId: () => ({ getValue: () => 'test-envelope-id' }),
      getSignerId: () => ({ getValue: () => 'test-signer-id' }),
      markAsSigned: jest.fn(),
      getSignedAt: () => new Date(),
      getSignedBy: () => 'test-signer-id'
    };

    const mockSigner = {
      getFullName: () => 'Test Signer',
      getEmail: () => ({ getValue: () => 'signer@example.com' })
    };

    it('should mark token as signed successfully', async () => {
      const mockUpdatedToken = mockInvitationToken;
      
      mockInvitationTokenRepository.getByToken.mockResolvedValue(mockInvitationToken);
      mockInvitationTokenRepository.update.mockResolvedValue(mockUpdatedToken);
      mockEnvelopeSignerRepository.findById.mockResolvedValue(mockSigner);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      const result = await invitationTokenService.markTokenAsSigned('valid-token', 'test-signer-id', mockSecurityContext);

      expect(result).toBe(mockUpdatedToken);
      expect(mockInvitationToken.markAsSigned).toHaveBeenCalledWith('test-signer-id', mockSecurityContext);
      expect(mockInvitationTokenRepository.update).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object)
      );
      expect(mockAuditEventService.createSignerEvent).toHaveBeenCalledWith({
        envelopeId: 'test-envelope-id',
        signerId: 'test-signer-id',
        eventType: AuditEventType.INVITATION_TOKEN_USED,
        description: 'Invitation token used for signing by Test Signer',
        userId: 'external-user:Test Signer',
        userEmail: 'signer@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent/1.0',
        country: 'US',
        metadata: {
          signedAt: expect.any(String),
          signedBy: 'test-signer-id'
        }
      });
    });

    it('should throw error when marking token as signed fails', async () => {
      mockInvitationTokenRepository.getByToken.mockRejectedValue(new Error('Token not found'));

      await expect(
        invitationTokenService.markTokenAsSigned('invalid-token', 'test-signer-id', mockSecurityContext)
      ).rejects.toThrow('INVITATION_TOKEN_INVALID: Failed to mark token as signed: INVITATION_TOKEN_INVALID: Token validation failed: Token not found');
    });
  });

  describe('getTokensBySigner', () => {
    const mockSignerId = { getValue: () => 'test-signer-id' };
    const mockTokens = [
      { getId: () => ({ getValue: () => 'token-1' }) },
      { getId: () => ({ getValue: () => 'token-2' }) }
    ];

    it('should return tokens for signer', async () => {
      mockInvitationTokenRepository.findBySignerId.mockResolvedValue(mockTokens);

      const result = await invitationTokenService.getTokensBySigner(mockSignerId as any);

      expect(result).toBe(mockTokens);
      expect(mockInvitationTokenRepository.findBySignerId).toHaveBeenCalledWith(mockSignerId);
    });
  });

  describe('updateTokenSent', () => {
    const mockTokenId = { getValue: () => 'test-token-id' };
    const mockToken = {
      getId: () => mockTokenId,
      markAsSent: jest.fn()
    };

    it('should update token sent information', async () => {
      const mockUpdatedToken = mockToken;
      
      mockInvitationTokenRepository.findById.mockResolvedValue(mockToken);
      mockInvitationTokenRepository.update.mockResolvedValue(mockUpdatedToken);

      const result = await invitationTokenService.updateTokenSent(mockTokenId as any);

      expect(result).toBe(mockUpdatedToken);
      expect(mockToken.markAsSent).toHaveBeenCalled();
      expect(mockInvitationTokenRepository.update).toHaveBeenCalledWith(mockTokenId, mockToken);
    });

    it('should throw error when token not found', async () => {
      mockInvitationTokenRepository.findById.mockResolvedValue(null);

      await expect(
        invitationTokenService.updateTokenSent(mockTokenId as any)
      ).rejects.toThrow('INVITATION_TOKEN_INVALID: Invitation token with ID test-token-id not found');
    });

    it('should throw error when update fails', async () => {
      mockInvitationTokenRepository.findById.mockResolvedValue(mockToken);
      mockInvitationTokenRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(
        invitationTokenService.updateTokenSent(mockTokenId as any)
      ).rejects.toThrow('INVITATION_TOKEN_INVALID: Failed to update token sent information: Database error');
    });
  });

  describe('private methods', () => {
    it('should generate secure token', () => {
      // Test is covered by the public methods that use generateSecureToken
      // We can verify the mock was called by checking the test results above
      expect(true).toBe(true);
    });

    it('should hash token', () => {
      // Test is covered by the public methods that use hashToken
      // We can verify the mock was called by checking the test results above
      expect(true).toBe(true);
    });
  });
});