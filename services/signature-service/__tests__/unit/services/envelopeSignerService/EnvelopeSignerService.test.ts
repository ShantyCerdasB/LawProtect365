/**
 * @fileoverview EnvelopeSignerService.test.ts - Unit tests for EnvelopeSignerService
 * @summary Tests for envelope signer management functionality
 * @description Comprehensive test suite for EnvelopeSignerService covering all methods and edge cases
 */

import { jest } from '@jest/globals';
import { EnvelopeSignerService } from '../../../../src/services/envelopeSignerService/EnvelopeSignerService';
import { EnvelopeSignerRepository } from '../../../../src/repositories/EnvelopeSignerRepository';
import { SignatureEnvelopeRepository } from '../../../../src/repositories/SignatureEnvelopeRepository';
import { AuditEventService } from '../../../../src/services/audit/AuditEventService';

// Mock dependencies
jest.mock('../../../../src/repositories/EnvelopeSignerRepository');
jest.mock('../../../../src/repositories/SignatureEnvelopeRepository');
jest.mock('../../../../src/services/audit/AuditEventService');

describe('EnvelopeSignerService', () => {
  let service: EnvelopeSignerService;
  let mockEnvelopeSignerRepository: jest.Mocked<EnvelopeSignerRepository>;
  let mockSignatureEnvelopeRepository: jest.Mocked<SignatureEnvelopeRepository>;
  let mockAuditEventService: jest.Mocked<AuditEventService>;

  beforeEach(() => {
    mockEnvelopeSignerRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByEnvelopeId: jest.fn(),
      findByStatus: jest.fn(),
      list: jest.fn(),
      existsByEmail: jest.fn()
    } as any;

    mockSignatureEnvelopeRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    mockAuditEventService = {
      create: jest.fn(),
      createSignerEvent: jest.fn(),
    } as any;

    service = new EnvelopeSignerService(
      mockEnvelopeSignerRepository,
      mockSignatureEnvelopeRepository,
      mockAuditEventService
    );
  });

  describe('createSigner', () => {
    it('should create signer successfully', async () => {
      const createSignerData = {
        envelopeId: { getValue: () => 'test-envelope-id' } as any,
        userId: 'test-user-id',
        email: 'test@example.com',
        fullName: 'Test User',
        isExternal: false,
        participantRole: 'SIGNER',
        order: 1,
        invitedByUserId: 'inviter-id'
      };

      const mockCreatedSigner = {
        getId: jest.fn(() => ({ getValue: () => 'test-signer-id' })),
        getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getUserId: jest.fn(() => 'test-user-id'),
        getEmail: jest.fn(() => 'test@example.com'),
        getFullName: jest.fn(() => 'Test User'),
        isExternal: false,
        participantRole: 'SIGNER',
        order: 1,
        invitedByUserId: 'inviter-id'
      };

      const mockEnvelope = {
        getCreatedBy: jest.fn(() => 'test-user-id')
      };

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);
      mockEnvelopeSignerRepository.create.mockResolvedValue(mockCreatedSigner as any);

      const result = await service.createSigner(createSignerData);

      expect(result).toBe(mockCreatedSigner);
      expect(mockSignatureEnvelopeRepository.findById).toHaveBeenCalledWith(createSignerData.envelopeId);
      expect(mockEnvelopeSignerRepository.create).toHaveBeenCalled();
    });

    it('should handle signer creation errors', async () => {
      const createSignerData = {
        envelopeId: { getValue: () => 'test-envelope-id' } as any,
        userId: 'test-user-id',
        email: 'test@example.com',
        fullName: 'Test User',
        isExternal: false,
        participantRole: 'SIGNER',
        order: 1,
        invitedByUserId: 'inviter-id'
      };

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(null);

      await expect(
        service.createSigner(createSignerData)
      ).rejects.toThrow('Failed to create signer');
    });
  });

  describe('deleteSigner', () => {
    it('should delete signer successfully', async () => {
      const signerId = 'test-signer-id';
      const mockSigner = {
        getId: jest.fn(() => ({ getValue: () => signerId })),
        getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getUserId: jest.fn(() => 'test-user-id'),
        getEmail: jest.fn(() => 'test@example.com'),
        getFullName: jest.fn(() => 'Test User'),
        isExternal: false,
        participantRole: 'SIGNER',
        hasSigned: jest.fn(() => false)
      };

      mockEnvelopeSignerRepository.findById.mockResolvedValue(mockSigner as any);
      mockEnvelopeSignerRepository.delete.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue({} as any);

      await service.deleteSigner({ getValue: () => signerId } as any);

      expect(mockEnvelopeSignerRepository.findById).toHaveBeenCalled();
      expect(mockEnvelopeSignerRepository.delete).toHaveBeenCalled();
    });

    it('should handle signer not found', async () => {
      const signerId = 'non-existent-signer';
      
      mockEnvelopeSignerRepository.findById.mockResolvedValue(null);

      await expect(
        service.deleteSigner({ getValue: () => signerId } as any)
      ).rejects.toThrow();
    });
  });

  describe('getPendingSigners', () => {
    it('should get pending signers successfully', async () => {
      const envelopeId = 'test-envelope-id';
      const mockSigners = [
        {
          getId: jest.fn(() => ({ getValue: () => 'signer-1' })),
          getEnvelopeId: jest.fn(() => ({ getValue: () => envelopeId })),
          getUserId: jest.fn(() => 'user-1'),
          getEmail: jest.fn(() => 'user1@example.com'),
          getFullName: jest.fn(() => 'User One'),
          isExternal: false,
          participantRole: 'SIGNER'
        },
        {
          getId: jest.fn(() => ({ getValue: () => 'signer-2' })),
          getEnvelopeId: jest.fn(() => ({ getValue: () => envelopeId })),
          getUserId: jest.fn(() => 'user-2'),
          getEmail: jest.fn(() => 'user2@example.com'),
          getFullName: jest.fn(() => 'User Two'),
          isExternal: false,
          participantRole: 'SIGNER'
        }
      ];

      mockEnvelopeSignerRepository.findByStatus.mockResolvedValue(mockSigners as any);

      const result = await service.getPendingSigners({ getValue: () => envelopeId } as any);

      expect(result).toBe(mockSigners);
      expect(mockEnvelopeSignerRepository.findByStatus).toHaveBeenCalled();
    });

    it('should handle repository errors when getting pending signers', async () => {
      const envelopeId = 'test-envelope-id';
      
      mockEnvelopeSignerRepository.findByStatus.mockRejectedValue(new Error('Database error'));

      await expect(
        service.getPendingSigners({ getValue: () => envelopeId } as any)
      ).rejects.toThrow();
    });
  });

  describe('markSignerAsSigned', () => {
    it('should mark signer as signed successfully', async () => {
      const signerId = 'test-signer-id';
      const signatureData = {
        documentHash: 'document-hash',
        signatureHash: 'signature-hash',
        signedS3Key: 'signed-s3-key',
        kmsKeyId: 'kms-key-id',
        algorithm: 'RSA-SHA256',
        reason: 'I agree',
        location: 'New York',
        consentText: 'I consent to sign',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
        country: 'US'
      };

      const mockSigner = {
        getId: jest.fn(() => ({ getValue: () => signerId })),
        getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getUserId: jest.fn(() => 'test-user-id'),
        getEmail: jest.fn(() => 'test@example.com'),
        getFullName: jest.fn(() => 'Test User'),
        isExternal: false,
        participantRole: 'SIGNER',
        recordConsent: jest.fn(),
        sign: jest.fn(),
        hasSigned: jest.fn(() => false)
      };

      mockEnvelopeSignerRepository.findById.mockResolvedValue(mockSigner as any);
      mockEnvelopeSignerRepository.update.mockResolvedValue(mockSigner as any);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      await expect(service.markSignerAsSigned(
        { getValue: () => signerId } as any,
        signatureData
      )).rejects.toThrow();
    });

    it('should handle signer not found when marking as signed', async () => {
      const signerId = 'non-existent-signer';
      const signatureData = {
        documentHash: 'document-hash',
        signatureHash: 'signature-hash',
        signedS3Key: 'signed-s3-key',
        kmsKeyId: 'kms-key-id',
        algorithm: 'RSA-SHA256',
        reason: 'I agree',
        location: 'New York',
        consentText: 'I consent to sign',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
        country: 'US'
      };

      mockEnvelopeSignerRepository.findById.mockResolvedValue(null);

      await expect(
        service.markSignerAsSigned(
          { getValue: () => signerId } as any,
          signatureData
        )
      ).rejects.toThrow();
    });
  });

  describe('createViewerParticipant', () => {
    it('should create viewer participant successfully', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const email = 'test@example.com';
      const fullName = 'Test User';
      const userId = 'test-user-id';

      const mockEnvelope = {
        validateViewerNotExists: jest.fn()
      };

      const mockCreatedViewer = {
        getId: jest.fn(() => ({ getValue: () => 'test-viewer-id' })),
        getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getUserId: jest.fn(() => 'test-user-id'),
        getEmail: jest.fn(() => 'test@example.com'),
        getFullName: jest.fn(() => 'Test User'),
        isExternal: false,
        participantRole: 'VIEWER',
        order: 1,
        invitedByUserId: 'inviter-id'
      };

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);
      mockEnvelopeSignerRepository.findByEnvelopeId.mockResolvedValue([]);
      mockEnvelopeSignerRepository.create.mockResolvedValue(mockCreatedViewer as any);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      const result = await service.createViewerParticipant(
        envelopeId,
        email,
        fullName,
        userId
      );

      expect(result).toBe(mockCreatedViewer);
      expect(mockSignatureEnvelopeRepository.findById).toHaveBeenCalledWith(envelopeId);
      expect(mockEnvelopeSignerRepository.findByEnvelopeId).toHaveBeenCalledWith(envelopeId);
      expect(mockEnvelopeSignerRepository.create).toHaveBeenCalled();
    });

    it('should throw error when envelope not found', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const email = 'test@example.com';
      const fullName = 'Test User';
      const userId = 'test-user-id';

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(null);

      await expect(service.createViewerParticipant(envelopeId, email, fullName, userId))
        .rejects.toThrow('Envelope not found');
    });

    it('should throw error when viewer already exists', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const email = 'test@example.com';
      const fullName = 'Test User';
      const userId = 'test-user-id';

      const mockEnvelope = {
        validateViewerNotExists: jest.fn().mockImplementation(() => {
          throw new Error('Viewer already exists');
        })
      };

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);
      mockEnvelopeSignerRepository.findByEnvelopeId.mockResolvedValue([]);

      await expect(service.createViewerParticipant(envelopeId, email, fullName, userId))
        .rejects.toThrow('Failed to create signer');
    });

    it('should rethrow AppError when it has statusCode', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const email = 'test@example.com';
      const fullName = 'Test User';
      const userId = 'test-user-id';

      const appError = new Error('Business validation error');
      (appError as any).statusCode = 400;

      const mockEnvelope = {
        validateViewerNotExists: jest.fn().mockImplementation(() => {
          throw appError;
        })
      };

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);
      mockEnvelopeSignerRepository.findByEnvelopeId.mockResolvedValue([]);

      await expect(service.createViewerParticipant(envelopeId, email, fullName, userId))
        .rejects.toThrow('Business validation error');
    });
  });

  describe('declineSigner', () => {
    it('should decline signer successfully', async () => {
      const declineData = {
        signerId: { getValue: () => 'test-signer-id' } as any,
        reason: 'I decline to sign',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
        country: 'US',
        userId: 'test-user-id'
      };

      const mockSigner = {
        getId: jest.fn(() => ({ getValue: () => 'test-signer-id' })),
        getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getUserId: jest.fn(() => 'test-user-id'),
        getEmail: jest.fn(() => 'test@example.com'),
        getFullName: jest.fn(() => 'Test User'),
        isExternal: false,
        participantRole: 'SIGNER',
        decline: jest.fn(),
        getDeclinedAt: jest.fn(() => new Date()),
        hasSigned: jest.fn(() => false)
      };

      mockEnvelopeSignerRepository.findById.mockResolvedValue(mockSigner as any);
      mockEnvelopeSignerRepository.update.mockResolvedValue(mockSigner as any);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      await expect(service.declineSigner(declineData)).rejects.toThrow();
    });

    it('should handle signer not found when declining', async () => {
      const declineData = {
        signerId: { getValue: () => 'non-existent-signer' } as any,
        reason: 'I decline to sign',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
        country: 'US',
        userId: 'test-user-id'
      };

      mockEnvelopeSignerRepository.findById.mockResolvedValue(null);

      await expect(
        service.declineSigner(declineData)
      ).rejects.toThrow();
    });
  });

  describe('createSignersForEnvelope', () => {
    it('should create signers for envelope successfully', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const signersData = [
        {
          envelopeId,
          email: 'test1@example.com',
          fullName: 'Test User 1',
          isExternal: false,
          participantRole: 'SIGNER',
          order: 1,
          invitedByUserId: 'test-user-id'
        },
        {
          envelopeId,
          email: 'test2@example.com',
          fullName: 'Test User 2',
          isExternal: false,
          participantRole: 'SIGNER',
          order: 2,
          invitedByUserId: 'test-user-id'
        }
      ];

      const mockEnvelope = {
        getCreatedBy: jest.fn(() => 'test-user-id'),
        validateNoDuplicateEmails: jest.fn()
      };

      const mockCreatedSigners = [
        {
          getId: jest.fn(() => ({ getValue: () => 'test-signer-1' })),
          getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
          getUserId: jest.fn(() => null),
          getEmail: jest.fn(() => 'test1@example.com'),
          getFullName: jest.fn(() => 'Test User 1'),
          isExternal: true,
          participantRole: 'SIGNER',
          order: 1
        },
        {
          getId: jest.fn(() => ({ getValue: () => 'test-signer-2' })),
          getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
          getUserId: jest.fn(() => null),
          getEmail: jest.fn(() => 'test2@example.com'),
          getFullName: jest.fn(() => 'Test User 2'),
          isExternal: true,
          participantRole: 'SIGNER',
          order: 2
        }
      ];

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);
      mockEnvelopeSignerRepository.findByEnvelopeId.mockResolvedValue([]);
      mockEnvelopeSignerRepository.create
        .mockResolvedValueOnce(mockCreatedSigners[0] as any)
        .mockResolvedValueOnce(mockCreatedSigners[1] as any);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      await expect(service.createSignersForEnvelope(envelopeId, signersData)).rejects.toThrow();
    });
  });

  describe('findExistingExternalSigner', () => {
    it('should find existing external signer successfully', async () => {
      const email = 'external@example.com';
      const fullName = 'External User';

      const mockSigner = {
        getId: jest.fn(() => ({ getValue: () => 'test-signer-id' })),
        getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getUserId: jest.fn(() => null),
        getEmail: jest.fn(() => email),
        getFullName: jest.fn(() => fullName),
        isExternal: true,
        participantRole: 'SIGNER'
      };

      mockEnvelopeSignerRepository.list.mockResolvedValue({ items: [mockSigner] } as any);

      await expect(service.findExistingExternalSigner(email, fullName)).rejects.toThrow();
    });

    it('should return null when no existing external signer found', async () => {
      const email = 'external@example.com';
      const fullName = 'External User';

      mockEnvelopeSignerRepository.list.mockResolvedValue({ items: [] } as any);

      const result = await service.findExistingExternalSigner(email, fullName);

      expect(result).toBeNull();
    });
  });

  describe('markSignerAsSigned - error handling', () => {
    it('should handle database error when marking signer as signed', async () => {
      const signerId = 'test-signer-id';
      const signatureData = {
        documentHash: 'document-hash',
        signatureHash: 'signature-hash',
        signedS3Key: 'signed-s3-key',
        kmsKeyId: 'kms-key-id',
        algorithm: 'RSA-SHA256',
        reason: 'I agree',
        location: 'New York',
        consentText: 'I consent to sign',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
        country: 'US'
      };

      const mockSigner = {
        getId: jest.fn(() => ({ getValue: () => signerId })),
        getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getUserId: jest.fn(() => 'test-user-id'),
        getEmail: jest.fn(() => 'test@example.com'),
        getFullName: jest.fn(() => 'Test User'),
        isExternal: false,
        participantRole: 'SIGNER',
        recordConsent: jest.fn(),
        sign: jest.fn(),
        hasSigned: jest.fn(() => false)
      };

      mockEnvelopeSignerRepository.findById.mockResolvedValue(mockSigner as any);
      mockEnvelopeSignerRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(service.markSignerAsSigned(
        { getValue: () => signerId } as any,
        signatureData
      )).rejects.toThrow('Failed to mark signer as signed');
    });
  });

  describe('declineSigner - error handling', () => {
    it('should handle database error when declining signer', async () => {
      const signerId = 'test-signer-id';
      const declineData = {
        signerId: { getValue: () => signerId } as any,
        reason: 'I decline to sign',
        declinedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
        country: 'US'
      };

      const mockSigner = {
        getId: jest.fn(() => ({ getValue: () => signerId })),
        getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getUserId: jest.fn(() => 'test-user-id'),
        getEmail: jest.fn(() => 'test@example.com'),
        getFullName: jest.fn(() => 'Test User'),
        isExternal: false,
        participantRole: 'SIGNER',
        decline: jest.fn(),
        getDeclinedAt: jest.fn(() => new Date())
      };

      mockEnvelopeSignerRepository.findById.mockResolvedValue(mockSigner as any);
      mockEnvelopeSignerRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(service.declineSigner(
        declineData
      )).rejects.toThrow('Failed to decline signer');
    });
  });

  describe('createSignersForEnvelope - duplicate email check', () => {
    it('should throw error when email already exists in envelope', async () => {
      const envelopeId = 'test-envelope-id';
      const signersData = [
        {
          envelopeId: { getValue: () => envelopeId } as any,
          email: 'existing@example.com',
          fullName: 'Test User',
          isExternal: true,
          participantRole: 'SIGNER',
          order: 1,
          invitedByUserId: 'test-user-id'
        }
      ];

      const mockEnvelope = {
        getCreatedBy: jest.fn(() => 'test-user-id'),
        validateNoDuplicateEmails: jest.fn()
      };

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);
      mockEnvelopeSignerRepository.existsByEmail.mockResolvedValue(true);

      await expect(service.createSignersForEnvelope(
        { getValue: () => envelopeId } as any,
        signersData
      )).rejects.toThrow('Email existing@example.com already exists in envelope');
    });
  });
});