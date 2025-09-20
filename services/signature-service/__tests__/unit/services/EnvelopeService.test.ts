/**
 * @fileoverview EnvelopeService.test.ts - Unit tests for EnvelopeService
 * @summary Comprehensive unit tests for envelope business logic
 * @description Tests cover all EnvelopeService methods including create, update, delete,
 * status changes, and event publishing with proper mocking and error scenarios.
 */

import { EnvelopeService } from '@/services/EnvelopeService';
import { EnvelopeRepository } from '@/repositories/EnvelopeRepository';
import { SignerRepository } from '@/repositories/SignerRepository';
import { SignatureRepository } from '@/repositories/SignatureRepository';
import { AuditService } from '@/services/AuditService';
import { EnvelopeEventService } from '@/services/events/EnvelopeEventService';
import { EnvelopeServiceUtils } from '@/utils/envelope-service';
import { TestUtils } from '../../helpers/testUtils';
import { EnvelopeStatus } from '@/domain/enums/EnvelopeStatus';
import { SignerStatus } from '@/domain/enums/SignerStatus';
import { AuditEventType } from '@/domain/enums/AuditEventType';
import { BadRequestError, NotFoundError } from '@lawprotect/shared-ts';
import { SignatureServiceConfig } from '@/config';
import { AccessType, PermissionLevel } from '@lawprotect/shared-ts';
import { validateEnvelopeBusinessRules } from '@/domain/rules/envelope/EnvelopeBusinessRules';

// Mock all dependencies
jest.mock('@/repositories/EnvelopeRepository');
jest.mock('@/repositories/SignerRepository');
jest.mock('@/repositories/SignatureRepository');
jest.mock('@/services/AuditService');
jest.mock('@/services/events/EnvelopeEventService');
jest.mock('@/utils/envelope-service');
jest.mock('@/domain/rules/envelope/EnvelopeBusinessRules');

describe('EnvelopeService', () => {
  let envelopeService: EnvelopeService;
  let mockEnvelopeRepository: jest.Mocked<EnvelopeRepository>;
  let mockSignerRepository: jest.Mocked<SignerRepository>;
  let mockSignatureRepository: jest.Mocked<SignatureRepository>;
  let mockAuditService: jest.Mocked<AuditService>;
  let mockEventService: jest.Mocked<EnvelopeEventService>;
  let mockEnvelopeServiceUtils: jest.Mocked<typeof EnvelopeServiceUtils>;

  // Test data
  const testUserId = TestUtils.generateUuid();
  const testEnvelopeId = TestUtils.generateEnvelopeId();
  const testSignerId = TestUtils.generateSignerId();
  const testSignatureId = TestUtils.generateSignatureId();
  const testDocumentId = TestUtils.generateUuid();

  const mockSecurityContext = {
    userId: testUserId,
    ipAddress: TestUtils.createTestIpAddress(),
    userAgent: TestUtils.createTestUserAgent(),
    country: 'US',
    accessType: AccessType.DIRECT,
    permission: PermissionLevel.ADMIN,
    timestamp: new Date()
  };

  const mockEnvelope = {
    getId: () => testEnvelopeId,
    getEnvelopeId: () => testEnvelopeId,
    getOwnerId: () => testUserId,
    getStatus: () => EnvelopeStatus.DRAFT,
    getMetadata: () => ({
      title: 'Test Envelope',
      description: 'Test Description'
    }),
    getDocumentId: () => testDocumentId,
    getSigningOrder: () => 'parallel',
    getSigners: () => [],
    getCreatedAt: () => new Date(),
    getUpdatedAt: () => new Date()
  };

  const mockSigner = {
    signerId: testSignerId.getValue(),
    envelopeId: testEnvelopeId.getValue(),
    status: SignerStatus.PENDING,
    email: 'test@example.com',
    fullName: 'Test Signer',
    order: 1
  };

  const mockSignature = {
    signatureId: testSignatureId.getValue(),
    envelopeId: testEnvelopeId.getValue(),
    signerId: testSignerId.getValue(),
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock business rules to pass by default
    (validateEnvelopeBusinessRules as jest.Mock).mockResolvedValue(undefined);

    // Create mock instances
    mockEnvelopeRepository = new EnvelopeRepository('test-table', {} as any) as jest.Mocked<EnvelopeRepository>;
    mockSignerRepository = new SignerRepository('test-table', {} as any) as jest.Mocked<SignerRepository>;
    mockSignatureRepository = new SignatureRepository('test-table', {} as any) as jest.Mocked<SignatureRepository>;
    mockAuditService = new AuditService({} as any) as jest.Mocked<AuditService>;
    mockEventService = new EnvelopeEventService({} as any) as jest.Mocked<EnvelopeEventService>;
    mockEnvelopeServiceUtils = EnvelopeServiceUtils as jest.Mocked<typeof EnvelopeServiceUtils>;

    // Create service instance
    const mockConfig = {
      envelopeRules: {
        maxSignersPerEnvelope: 10,
        maxEnvelopesPerUser: 100,
        maxEnvelopeSize: 50 * 1024 * 1024, // 50MB
        defaultExpirationDays: 30
      }
    } as any;
    
    envelopeService = new EnvelopeService(
      mockEnvelopeRepository,
      mockSignerRepository,
      mockSignatureRepository,
      mockAuditService,
      mockEventService,
      mockConfig
    );
  });

  describe('createEnvelope', () => {
    const createRequest = {
      title: 'Test Envelope',
      description: 'Test Description',
      documentHash: 'test-hash',
      s3Key: 'test-s3-key',
      signers: [
        {
          email: 'signer1@example.com',
          fullName: 'Signer One',
          order: 1
        },
        {
          email: 'signer2@example.com',
          fullName: 'Signer Two',
          order: 2
        }
      ]
    };

    it('should create envelope successfully', async () => {
      // Arrange
      mockEnvelopeRepository.listByOwner.mockResolvedValue({
        items: []
      } as any);
      mockEnvelopeRepository.create.mockResolvedValue(mockEnvelope as any);
      mockAuditService.createEvent.mockResolvedValue({} as any);
      mockEnvelopeServiceUtils.publishEnvelopeCreatedEvent.mockResolvedValue({} as any);

      // Act
      const result = await envelopeService.createEnvelope(createRequest, testUserId, mockSecurityContext);

      // Assert
      expect(result).toBe(mockEnvelope);
      expect(mockEnvelopeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createRequest.title,
          description: createRequest.description,
          documentId: createRequest.documentHash,
          ownerId: testUserId,
          status: EnvelopeStatus.DRAFT,
          metadata: expect.objectContaining({
            title: createRequest.title,
            description: createRequest.description
          })
        })
      );
      expect(mockAuditService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AuditEventType.ENVELOPE_CREATED,
          envelopeId: testEnvelopeId.getValue(),
          userId: testUserId,
          userEmail: (mockSecurityContext as any)?.email,
          description: `Envelope created: ${testEnvelopeId.getValue()}`
        })
      );
      expect(mockEnvelopeServiceUtils.publishEnvelopeCreatedEvent).toHaveBeenCalledWith(
        mockSignerRepository,
        mockEventService,
        testEnvelopeId.getValue(),
        testUserId,
        createRequest
      );
    });

    it('should throw BadRequestError when title already exists', async () => {
      // Arrange
      mockEnvelopeRepository.listByOwner.mockResolvedValue({
        items: [mockEnvelope]
      } as any);
      (validateEnvelopeBusinessRules as jest.Mock).mockRejectedValue(new BadRequestError('Envelope with this title already exists'));

      // Act & Assert
      await expect(
        envelopeService.createEnvelope(createRequest, testUserId, mockSecurityContext)
      ).rejects.toThrow(BadRequestError);
      await expect(
        envelopeService.createEnvelope(createRequest, testUserId, mockSecurityContext)
      ).rejects.toThrow('Envelope with this title already exists');
    });

    it('should throw BadRequestError when signer count exceeds limit', async () => {
      // Arrange
      const requestWithTooManySigners = {
        ...createRequest,
        signers: Array.from({ length: 11 }, (_, i) => ({
          email: `signer${i}@example.com`,
          fullName: `Signer ${i}`,
          order: i + 1
        }))
      };
      mockEnvelopeRepository.listByOwner.mockResolvedValue({
        items: []
      } as any);
      (validateEnvelopeBusinessRules as jest.Mock).mockRejectedValue(new BadRequestError('Maximum 10 signers allowed per envelope'));

      // Act & Assert
      await expect(
        envelopeService.createEnvelope(requestWithTooManySigners, testUserId, mockSecurityContext)
      ).rejects.toThrow(BadRequestError);
      await expect(
        envelopeService.createEnvelope(requestWithTooManySigners, testUserId, mockSecurityContext)
      ).rejects.toThrow('Maximum 10 signers allowed per envelope');
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockEnvelopeRepository.listByOwner.mockResolvedValue({
        items: []
      } as any);
      mockEnvelopeRepository.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        envelopeService.createEnvelope(createRequest, testUserId, mockSecurityContext)
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateEnvelope', () => {
    const updateRequest = {
      title: 'Updated Title',
      description: 'Updated Description'
    };

    it('should update envelope successfully', async () => {
      // Arrange
      mockEnvelopeRepository.getById.mockResolvedValue(mockEnvelope as any);
      mockEnvelopeRepository.update.mockResolvedValue(mockEnvelope as any);
      mockAuditService.createEvent.mockResolvedValue({} as any);
      mockEnvelopeServiceUtils.publishEnvelopeUpdatedEvent.mockResolvedValue({} as any);

      // Act
      const result = await envelopeService.updateEnvelope(
        testEnvelopeId,
        updateRequest,
        testUserId,
        mockSecurityContext
      );

      // Assert
      expect(result).toBe(mockEnvelope);
      expect(mockEnvelopeRepository.update).toHaveBeenCalledWith(
        testEnvelopeId,
        expect.objectContaining({
          metadata: expect.objectContaining({
            title: updateRequest.title,
            description: updateRequest.description
          })
        })
      );
      expect(mockAuditService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AuditEventType.ENVELOPE_UPDATED,
          envelopeId: testEnvelopeId.getValue(),
          userId: testUserId,
          userEmail: (mockSecurityContext as any)?.email,
          description: `Envelope updated: ${testEnvelopeId.getValue()}`
        })
      );
      expect(mockEnvelopeServiceUtils.publishEnvelopeUpdatedEvent).toHaveBeenCalledWith(
        mockSignerRepository,
        mockEventService,
        testEnvelopeId.getValue(),
        testUserId,
        updateRequest
      );
    });

    it('should throw NotFoundError when envelope not found', async () => {
      // Arrange
      mockEnvelopeRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        envelopeService.updateEnvelope(testEnvelopeId, updateRequest, testUserId, mockSecurityContext)
      ).rejects.toThrow(NotFoundError);
      await expect(
        envelopeService.updateEnvelope(testEnvelopeId, updateRequest, testUserId, mockSecurityContext)
      ).rejects.toThrow(`Envelope with ID ${testEnvelopeId.getValue()} not found`);
    });

    it('should throw BadRequestError when user is not owner', async () => {
      // Arrange
      const otherUserId = TestUtils.generateUuid();
      mockEnvelopeRepository.getById.mockResolvedValue(mockEnvelope as any);
      // Reset the mock to reject for this test
      (validateEnvelopeBusinessRules as jest.Mock).mockReset();
      (validateEnvelopeBusinessRules as jest.Mock).mockRejectedValue(new BadRequestError('Only the envelope owner can update it'));

      // Act & Assert
      await expect(
        envelopeService.updateEnvelope(testEnvelopeId, updateRequest, otherUserId, mockSecurityContext)
      ).rejects.toThrow(BadRequestError);
      await expect(
        envelopeService.updateEnvelope(testEnvelopeId, updateRequest, otherUserId, mockSecurityContext)
      ).rejects.toThrow('Only the envelope owner can update it');
    });
  });

  describe('getEnvelope', () => {
    it('should return envelope when found', async () => {
      // Arrange
      mockEnvelopeRepository.getById.mockResolvedValue(mockEnvelope as any);

      // Act
      const result = await envelopeService.getEnvelope(testEnvelopeId, testUserId, mockSecurityContext);

      // Assert
      expect(result).toBe(mockEnvelope);
      expect(mockEnvelopeRepository.getById).toHaveBeenCalledWith(testEnvelopeId);
    });

    it('should throw NotFoundError when envelope not found', async () => {
      // Arrange
      mockEnvelopeRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        envelopeService.getEnvelope(testEnvelopeId, testUserId, mockSecurityContext)
      ).rejects.toThrow(NotFoundError);
      await expect(
        envelopeService.getEnvelope(testEnvelopeId, testUserId, mockSecurityContext)
      ).rejects.toThrow(`Envelope with ID ${testEnvelopeId.getValue()} not found`);
    });
  });

  describe('deleteEnvelope', () => {
    it('should delete envelope successfully', async () => {
      // Arrange
      mockEnvelopeRepository.getById.mockResolvedValue(mockEnvelope as any);
      mockEnvelopeRepository.delete.mockResolvedValue(undefined);
      mockSignatureRepository.getByEnvelope.mockResolvedValue({
        items: []
      } as any);
      mockSignerRepository.getByEnvelope.mockResolvedValue({
        items: []
      } as any);
      mockAuditService.createEvent.mockResolvedValue({} as any);
      mockEnvelopeServiceUtils.publishEnvelopeDeletedEvent.mockResolvedValue({} as any);

      // Act
      await envelopeService.deleteEnvelope(testEnvelopeId, testUserId, mockSecurityContext);

      // Assert
      expect(mockEnvelopeRepository.delete).toHaveBeenCalledWith(testEnvelopeId);
      expect(mockAuditService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AuditEventType.ENVELOPE_DELETED,
          envelopeId: testEnvelopeId.getValue(),
          userId: testUserId,
          userEmail: (mockSecurityContext as any)?.email,
          description: expect.stringContaining('Envelope deleted'),
          metadata: expect.objectContaining({
            title: 'Test Envelope'
          })
        })
      );
      expect(mockEnvelopeServiceUtils.publishEnvelopeDeletedEvent).toHaveBeenCalledWith(
        mockSignerRepository,
        mockEventService,
        testEnvelopeId.getValue(),
        testUserId
      );
    });

    it('should throw NotFoundError when envelope not found', async () => {
      // Arrange
      mockEnvelopeRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        envelopeService.deleteEnvelope(testEnvelopeId, testUserId, mockSecurityContext)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when user is not owner', async () => {
      // Arrange
      const otherUserId = TestUtils.generateUuid();
      mockEnvelopeRepository.getById.mockResolvedValue(mockEnvelope as any);
      mockSignatureRepository.getByEnvelope.mockResolvedValue({
        items: []
      } as any);
      mockSignerRepository.getByEnvelope.mockResolvedValue({
        items: []
      } as any);
      // Reset the mock to reject for this test
      (validateEnvelopeBusinessRules as jest.Mock).mockReset();
      (validateEnvelopeBusinessRules as jest.Mock).mockRejectedValue(new BadRequestError('Only the envelope owner can delete it'));

      // Act & Assert
      await expect(
        envelopeService.deleteEnvelope(testEnvelopeId, otherUserId, mockSecurityContext)
      ).rejects.toThrow(BadRequestError);
      await expect(
        envelopeService.deleteEnvelope(testEnvelopeId, otherUserId, mockSecurityContext)
      ).rejects.toThrow('Only the envelope owner can delete it');
    });
  });

  describe('changeEnvelopeStatus', () => {
    it('should change status successfully', async () => {
      // Arrange
      const newStatus = EnvelopeStatus.SENT;
      mockEnvelopeRepository.getById.mockResolvedValue(mockEnvelope as any);
      mockEnvelopeRepository.update.mockResolvedValue(mockEnvelope as any);
      mockAuditService.createEvent.mockResolvedValue({} as any);
      mockEnvelopeServiceUtils.publishEnvelopeStatusChangedEvent.mockResolvedValue({} as any);

      // Act
      const result = await envelopeService.changeEnvelopeStatus(
        testEnvelopeId,
        newStatus,
        testUserId,
        mockSecurityContext
      );

      // Assert
      expect(result).toBe(mockEnvelope);
      expect(mockEnvelopeRepository.update).toHaveBeenCalledWith(
        testEnvelopeId,
        { status: newStatus }
      );
      expect(mockAuditService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AuditEventType.ENVELOPE_STATUS_CHANGED,
          envelopeId: testEnvelopeId.getValue(),
          userId: testUserId,
          userEmail: (mockSecurityContext as any)?.email,
          description: expect.stringContaining('Envelope status changed')
        })
      );
      expect(mockEnvelopeServiceUtils.publishEnvelopeStatusChangedEvent).toHaveBeenCalledWith(
        mockSignerRepository,
        mockEventService,
        testEnvelopeId.getValue(),
        testUserId,
        EnvelopeStatus.DRAFT,
        newStatus
      );
    });

    it('should throw NotFoundError when envelope not found', async () => {
      // Arrange
      mockEnvelopeRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        envelopeService.changeEnvelopeStatus(testEnvelopeId, EnvelopeStatus.COMPLETED, testUserId, mockSecurityContext)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when user is not owner', async () => {
      // Arrange
      const otherUserId = TestUtils.generateUuid();
      mockEnvelopeRepository.getById.mockResolvedValue(mockEnvelope as any);
      (validateEnvelopeBusinessRules as jest.Mock).mockRejectedValue(new BadRequestError('Only the envelope owner can change status'));

      // Act & Assert
      await expect(
        envelopeService.changeEnvelopeStatus(testEnvelopeId, EnvelopeStatus.COMPLETED, otherUserId, mockSecurityContext)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('completeIfAllSigned', () => {
    it('should complete envelope when all signers are signed', async () => {
      // Arrange
      const signedSigner = { ...mockSigner, status: SignerStatus.SIGNED };
      mockEnvelopeRepository.getById.mockResolvedValue(mockEnvelope as any);
      mockSignerRepository.getByEnvelope.mockResolvedValue({
        items: [signedSigner as any]
      } as any);
      mockEnvelopeRepository.update.mockResolvedValue(mockEnvelope as any);
      mockEnvelopeServiceUtils.publishEnvelopeStatusChangedEvent.mockResolvedValue({} as any);

      // Act
      const result = await envelopeService.completeIfAllSigned(testEnvelopeId, testUserId, mockSecurityContext);

      // Assert
      expect(result).toBe(mockEnvelope);
      expect(mockEnvelopeRepository.update).toHaveBeenCalledWith(
        testEnvelopeId,
        { status: EnvelopeStatus.COMPLETED }
      );
      expect(mockEnvelopeServiceUtils.publishEnvelopeStatusChangedEvent).toHaveBeenCalledWith(
        mockSignerRepository,
        mockEventService,
        testEnvelopeId.getValue(),
        testUserId,
        EnvelopeStatus.DRAFT,
        EnvelopeStatus.COMPLETED
      );
    });

    it('should return envelope unchanged when not all signers are signed', async () => {
      // Arrange
      mockEnvelopeRepository.getById.mockResolvedValue(mockEnvelope as any);
      mockSignerRepository.getByEnvelope.mockResolvedValue({
        items: [mockSigner as any]
      } as any);

      // Act
      const result = await envelopeService.completeIfAllSigned(testEnvelopeId, testUserId, mockSecurityContext);

      // Assert
      expect(result).toBe(mockEnvelope);
      expect(mockEnvelopeRepository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when envelope not found', async () => {
      // Arrange
      mockEnvelopeRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        envelopeService.completeIfAllSigned(testEnvelopeId, testUserId, mockSecurityContext)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserEnvelopes', () => {
    it('should return user envelopes with default limit', async () => {
      // Arrange
      const mockResult = {
        items: [mockEnvelope],
      };
      mockEnvelopeRepository.listByOwner.mockResolvedValue(mockResult);

      // Act
      const result = await envelopeService.getUserEnvelopes(testUserId);

      // Assert
      expect(result).toBe(mockResult);
      expect(mockEnvelopeRepository.listByOwner).toHaveBeenCalledWith(testUserId, { limit: 25 });
    });

    it('should return user envelopes with custom limit and cursor', async () => {
      // Arrange
      const customLimit = 50;
      const cursor = 'test-cursor';
      const mockResult = {
        items: [mockEnvelope],
      };
      mockEnvelopeRepository.listByOwner.mockResolvedValue(mockResult);

      // Act
      const result = await envelopeService.getUserEnvelopes(testUserId, customLimit, cursor);

      // Assert
      expect(result).toBe(mockResult);
      expect(mockEnvelopeRepository.listByOwner).toHaveBeenCalledWith(testUserId, { limit: customLimit, cursor });
    });
  });

  describe('deleteRelatedEntities', () => {
    it('should delete all related signatures and signers', async () => {
      // Arrange
      mockSignatureRepository.getByEnvelope.mockResolvedValue({
        items: [mockSignature as any]
      } as any);
      mockSignerRepository.getByEnvelope.mockResolvedValue({
        items: [mockSigner as any]
      } as any);
      mockSignatureRepository.delete.mockResolvedValue(undefined);
      mockSignerRepository.delete.mockResolvedValue(undefined);

      // Act
      await (envelopeService as any).deleteRelatedEntities(testEnvelopeId);

      // Assert
      expect(mockSignatureRepository.delete).toHaveBeenCalledWith(testSignatureId);
      expect(mockSignerRepository.delete).toHaveBeenCalledWith(testSignerId);
    });

    it('should handle empty lists gracefully', async () => {
      // Arrange
      mockSignatureRepository.getByEnvelope.mockResolvedValue({
        items: []
      } as any);
      mockSignerRepository.getByEnvelope.mockResolvedValue({
        items: []
      } as any);

      // Act
      await (envelopeService as any).deleteRelatedEntities(testEnvelopeId);

      // Assert
      expect(mockSignatureRepository.delete).not.toHaveBeenCalled();
      expect(mockSignerRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors in createEnvelope', async () => {
      // Arrange
      mockEnvelopeRepository.listByOwner.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(
        envelopeService.createEnvelope(
          { title: 'Test', description: 'Test', documentHash: 'test-hash', s3Key: 'test-s3-key', signers: [] },
          testUserId,
          mockSecurityContext
        )
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle repository errors in updateEnvelope', async () => {
      // Arrange
      mockEnvelopeRepository.getById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        envelopeService.updateEnvelope(testEnvelopeId, { title: 'Updated' }, testUserId, mockSecurityContext)
      ).rejects.toThrow('Database error');
    });

    it('should handle repository errors in deleteEnvelope', async () => {
      // Arrange
      mockEnvelopeRepository.getById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        envelopeService.deleteEnvelope(testEnvelopeId, testUserId, mockSecurityContext)
      ).rejects.toThrow('Database error');
    });
  });
});
-+6