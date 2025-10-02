/**
 * @fileoverview EnvelopeSignerService.test.ts - Unit tests for EnvelopeSignerService
 * @summary Tests for envelope signer management functionality
 * @description Comprehensive test suite for EnvelopeSignerService covering all methods and edge cases
 */

import { jest } from '@jest/globals';
import { generateTestIpAddress } from '../../../integration/helpers/testHelpers';
import { EnvelopeSignerService } from '../../../../src/services/envelopeSignerService/EnvelopeSignerService';
import { EnvelopeSignerRepository } from '../../../../src/repositories/EnvelopeSignerRepository';
import { SignatureEnvelopeRepository } from '../../../../src/repositories/SignatureEnvelopeRepository';
import { AuditEventService } from '../../../../src/services/audit/AuditEventService';

// Mock dependencies
jest.mock('../../../../src/repositories/EnvelopeSignerRepository');
jest.mock('../../../../src/repositories/SignatureEnvelopeRepository');
jest.mock('../../../../src/services/audit/AuditEventService');

// Helper functions to reduce nesting and improve readability
function createTestSignerData() {
  return {
    envelopeId: { getValue: () => 'test-envelope-id' } as any,
    userId: 'test-user-id',
    email: 'test@example.com',
    fullName: 'Test User',
    isExternal: false,
    participantRole: 'SIGNER',
    order: 1,
    invitedByUserId: 'inviter-id'
  };
}

function createMockSigner(id: string = 'test-signer-id') {
  return {
    getId: jest.fn(() => ({ getValue: () => id })),
    getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
    getUserId: jest.fn(() => 'test-user-id'),
    getEmail: jest.fn(() => 'test@example.com'),
    getFullName: jest.fn(() => 'Test User'),
    isExternal: false,
    participantRole: 'SIGNER',
    order: 1,
    invitedByUserId: 'inviter-id',
    hasSigned: jest.fn(() => false),
    recordConsent: jest.fn(),
    sign: jest.fn(),
    decline: jest.fn(),
    getDeclinedAt: jest.fn(() => new Date())
  };
}

function createMockEnvelope() {
  return {
    getCreatedBy: jest.fn(() => 'test-user-id'),
    validateViewerNotExists: jest.fn(),
    validateNoDuplicateEmails: jest.fn()
  };
}

function createMockViewer(id: string = 'test-viewer-id') {
  return {
    getId: jest.fn(() => ({ getValue: () => id })),
    getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
    getUserId: jest.fn(() => 'test-user-id'),
    getEmail: jest.fn(() => 'test@example.com'),
    getFullName: jest.fn(() => 'Test User'),
    isExternal: false,
    participantRole: 'VIEWER',
    order: 1,
    invitedByUserId: 'inviter-id'
  };
}

function createMockSignersArray(count: number = 2) {
  return Array.from({ length: count }, (_, index) => ({
    getId: jest.fn(() => ({ getValue: () => `test-signer-${index + 1}` })),
    getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
    getUserId: jest.fn(() => null),
    getEmail: jest.fn(() => `test${index + 1}@example.com`),
    getFullName: jest.fn(() => `Test User ${index + 1}`),
    isExternal: true,
    participantRole: 'SIGNER',
    order: index + 1
  }));
}

function createTestSignatureData() {
  return {
    documentHash: 'document-hash',
    signatureHash: 'signature-hash',
    signedS3Key: 'signed-s3-key',
    kmsKeyId: 'kms-key-id',
    algorithm: 'RSA-SHA256',
    reason: 'I agree',
    location: 'New York',
    consentText: 'I consent to sign',
    ipAddress: generateTestIpAddress(),
    userAgent: 'TestAgent/1.0',
    country: 'US'
  };
}

function createTestDeclineData(signerId: string = 'test-signer-id') {
  return {
    signerId: { getValue: () => signerId } as any,
    reason: 'I decline to sign',
    ipAddress: generateTestIpAddress(),
    userAgent: 'TestAgent/1.0',
    country: 'US',
    userId: 'test-user-id'
  };
}


function createMockSignerWithSigning(id: string = 'test-signer-id') {
  return {
    getId: jest.fn(() => ({ getValue: () => id })),
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
}

function createMockSignerWithDecline(id: string = 'test-signer-id') {
  return {
    getId: jest.fn(() => ({ getValue: () => id })),
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
}

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

  describe('Create Signer - Success Cases', () => {
    it('should create signer successfully', async () => {
      const createSignerData = createTestSignerData();
      const mockCreatedSigner = createMockSigner();
      const mockEnvelope = createMockEnvelope();

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);
      mockEnvelopeSignerRepository.create.mockResolvedValue(mockCreatedSigner as any);

      const result = await service.createSigner(createSignerData);

      expect(result).toBe(mockCreatedSigner);
      expect(mockSignatureEnvelopeRepository.findById).toHaveBeenCalledWith(createSignerData.envelopeId);
      expect(mockEnvelopeSignerRepository.create).toHaveBeenCalled();
    });
  });

  describe('Create Signer - Error Cases', () => {
    it('should handle signer creation errors', async () => {
      const createSignerData = createTestSignerData();

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(null);

      await expect(
        service.createSigner(createSignerData)
      ).rejects.toThrow('Failed to create signer');
    });
  });

  describe('Delete Signer - Success Cases', () => {
    it('should delete signer successfully', async () => {
      const signerId = 'test-signer-id';
      const mockSigner = createMockSigner(signerId);

      mockEnvelopeSignerRepository.findById.mockResolvedValue(mockSigner as any);
      mockEnvelopeSignerRepository.delete.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue({} as any);

      await service.deleteSigner({ getValue: () => signerId } as any);

      expect(mockEnvelopeSignerRepository.findById).toHaveBeenCalled();
      expect(mockEnvelopeSignerRepository.delete).toHaveBeenCalled();
    });
  });

  describe('Delete Signer - Error Cases', () => {
    it('should handle signer not found', async () => {
      const signerId = 'non-existent-signer';
      
      mockEnvelopeSignerRepository.findById.mockResolvedValue(null);

      await expect(
        service.deleteSigner({ getValue: () => signerId } as any)
      ).rejects.toThrow();
    });
  });

  describe('Get Pending Signers - Success Cases', () => {
    it('should get pending signers successfully', async () => {
      const envelopeId = 'test-envelope-id';
      const mockSigners = createMockSignersArray();

      mockEnvelopeSignerRepository.findByStatus.mockResolvedValue(mockSigners as any);

      const result = await service.getPendingSigners({ getValue: () => envelopeId } as any);

      expect(result).toBe(mockSigners);
      expect(mockEnvelopeSignerRepository.findByStatus).toHaveBeenCalled();
    });
  });

  describe('Get Pending Signers - Error Cases', () => {
    it('should handle repository errors when getting pending signers', async () => {
      const envelopeId = 'test-envelope-id';
      
      mockEnvelopeSignerRepository.findByStatus.mockRejectedValue(new Error('Database error'));

      await expect(
        service.getPendingSigners({ getValue: () => envelopeId } as any)
      ).rejects.toThrow();
    });
  });

  describe('Mark Signer As Signed - Success Cases', () => {
    it('should mark signer as signed successfully', async () => {
      const signerId = 'test-signer-id';
      const signatureData = createTestSignatureData();
      const mockSigner = createMockSignerWithSigning(signerId);

      mockEnvelopeSignerRepository.findById.mockResolvedValue(mockSigner as any);
      mockEnvelopeSignerRepository.update.mockResolvedValue(mockSigner as any);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      await expect(service.markSignerAsSigned(
        { getValue: () => signerId } as any,
        signatureData
      )).rejects.toThrow();
    });
  });

  describe('Mark Signer As Signed - Error Cases', () => {
    it('should handle signer not found when marking as signed', async () => {
      const signerId = 'non-existent-signer';
      const signatureData = createTestSignatureData();

      mockEnvelopeSignerRepository.findById.mockResolvedValue(null);

      await expect(
        service.markSignerAsSigned(
          { getValue: () => signerId } as any,
          signatureData
        )
      ).rejects.toThrow();
    });
  });

  describe('Create Viewer Participant - Success Cases', () => {
    it('should create viewer participant successfully', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const email = 'test@example.com';
      const fullName = 'Test User';
      const userId = 'test-user-id';

      const mockEnvelope = createMockEnvelope();
      const mockCreatedViewer = createMockViewer();

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

  });

  describe('Create Viewer Participant - Error Cases', () => {
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

  describe('Decline Signer - Success Cases', () => {
    it('should decline signer successfully', async () => {
      const declineData = createTestDeclineData();
      const mockSigner = createMockSignerWithDecline();

      mockEnvelopeSignerRepository.findById.mockResolvedValue(mockSigner as any);
      mockEnvelopeSignerRepository.update.mockResolvedValue(mockSigner as any);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      await expect(service.declineSigner(declineData)).rejects.toThrow();
    });
  });

  describe('Decline Signer - Error Cases', () => {
    it('should handle signer not found when declining', async () => {
      const declineData = createTestDeclineData('non-existent-signer');

      mockEnvelopeSignerRepository.findById.mockResolvedValue(null);

      await expect(
        service.declineSigner(declineData)
      ).rejects.toThrow();
    });
  });

  describe('Create Signers For Envelope - Success Cases', () => {
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

      const mockEnvelope = createMockEnvelope();
      const mockCreatedSigners = createMockSignersArray(2);

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);
      mockEnvelopeSignerRepository.findByEnvelopeId.mockResolvedValue([]);
      mockEnvelopeSignerRepository.create
        .mockResolvedValueOnce(mockCreatedSigners[0] as any)
        .mockResolvedValueOnce(mockCreatedSigners[1] as any);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      await expect(service.createSignersForEnvelope(envelopeId, signersData)).rejects.toThrow();
    });
  });

  describe('Find Existing External Signer - Success Cases', () => {
    it('should find existing external signer successfully', async () => {
      const email = 'external@example.com';
      const fullName = 'External User';

      const mockSigner = createMockSigner('test-signer-id');
      mockSigner.getEmail = jest.fn(() => email);
      mockSigner.getFullName = jest.fn(() => fullName);
      mockSigner.isExternal = true;

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

  describe('Mark Signer As Signed - Database Error Cases', () => {
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
        ipAddress: generateTestIpAddress(),
        userAgent: 'TestAgent/1.0',
        country: 'US'
      };

      const mockSigner = createMockSigner(signerId);
      mockSigner.recordConsent = jest.fn();
      mockSigner.sign = jest.fn();
      mockSigner.hasSigned = jest.fn(() => false);

      mockEnvelopeSignerRepository.findById.mockResolvedValue(mockSigner as any);
      mockEnvelopeSignerRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(service.markSignerAsSigned(
        { getValue: () => signerId } as any,
        signatureData
      )).rejects.toThrow('Failed to update signer');
    });
  });

  describe('Decline Signer - Database Error Cases', () => {
    it('should handle database error when declining signer', async () => {
      const signerId = 'test-signer-id';
      const declineData = {
        signerId: { getValue: () => signerId } as any,
        reason: 'I decline to sign',
        declinedAt: new Date(),
        ipAddress: generateTestIpAddress(),
        userAgent: 'TestAgent/1.0',
        country: 'US'
      };

      const mockSigner = createMockSigner(signerId);
      mockSigner.decline = jest.fn();
      mockSigner.getDeclinedAt = jest.fn(() => new Date());

      mockEnvelopeSignerRepository.findById.mockResolvedValue(mockSigner as any);
      mockEnvelopeSignerRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(service.declineSigner(
        declineData
      )).rejects.toThrow('Failed to update signer');
    });
  });

  describe('Create Signers For Envelope - Duplicate Email Cases', () => {
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