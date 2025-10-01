/**
 * @fileoverview EnvelopeCrudService Tests - Unit tests for envelope CRUD operations
 * @summary Tests for EnvelopeCrudService covering all CRUD operations
 * @description Comprehensive unit tests for EnvelopeCrudService including creation,
 * retrieval, updates, cancellation, and listing with proper mocking and error handling.
 */

import { EnvelopeCrudService } from '@/services/envelopeCrud/EnvelopeCrudService';
import { SignatureEnvelopeRepository } from '@/repositories/SignatureEnvelopeRepository';
import { InvitationTokenService } from '@/services/invitationTokenService/InvitationTokenService';
import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { CreateEnvelopeData } from '@/domain/types/envelope';
import { EnvelopeSpec } from '@/domain/types/envelope';
import { EnvelopeStatus } from '@/domain/value-objects/EnvelopeStatus';
import { DocumentOrigin } from '@/domain/value-objects/DocumentOrigin';
import { SigningOrder } from '@/domain/value-objects/SigningOrder';

// Mock the dependencies
jest.mock('@/repositories/SignatureEnvelopeRepository');
jest.mock('@/services/invitationTokenService/InvitationTokenService');
jest.mock('@/domain/entities/SignatureEnvelope');
jest.mock('@/domain/value-objects/EnvelopeId');

describe('EnvelopeCrudService', () => {
  let service: EnvelopeCrudService;
  let mockSignatureEnvelopeRepository: jest.Mocked<SignatureEnvelopeRepository>;
  let mockInvitationTokenService: jest.Mocked<InvitationTokenService>;

  beforeEach(() => {
    mockSignatureEnvelopeRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      getWithSigners: jest.fn(),
      update: jest.fn(),
      list: jest.fn(),
    } as any;

    mockInvitationTokenService = {
      validateInvitationToken: jest.fn(),
    } as any;

    service = new EnvelopeCrudService(
      mockSignatureEnvelopeRepository,
      mockInvitationTokenService
    );
  });

  describe('createEnvelope', () => {
    it('should create envelope successfully', async () => {
      const createData: CreateEnvelopeData = {
        id: { getValue: () => 'test-envelope-id' } as any,
        title: 'Test Envelope',
        description: 'Test Description',
        createdBy: 'test-user-id',
        origin: { getValue: () => 'UPLOAD' } as any,
        signingOrder: { getType: () => 'PARALLEL' } as any,
        expiresAt: new Date('2024-12-31'),
        sourceKey: 'test-source-key',
        metaKey: 'test-meta-key'
      };

      const mockEnvelope = {
        getId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getTitle: jest.fn(() => 'Test Envelope'),
        getDescription: jest.fn(() => 'Test Description'),
        getCreatedBy: jest.fn(() => 'test-user-id'),
        getExpiresAt: jest.fn(() => new Date('2024-12-31')),
        getSigningOrder: jest.fn(() => ({ getType: () => 'PARALLEL' })),
        getSourceKey: jest.fn(() => ({ getValue: () => 'test-source-key' })),
        getMetaKey: jest.fn(() => ({ getValue: () => 'test-meta-key' }))
      };

      mockSignatureEnvelopeRepository.create.mockResolvedValue(mockEnvelope as any);

      const result = await service.createEnvelope(createData);

      expect(result).toBe(mockEnvelope);
      expect(mockSignatureEnvelopeRepository.create).toHaveBeenCalled();
    });

    it('should handle creation errors', async () => {
      const createData: CreateEnvelopeData = {
        id: { getValue: () => 'test-envelope-id' } as any,
        title: 'Test Envelope',
        description: 'Test Description',
        createdBy: 'test-user-id',
        origin: { getValue: () => 'UPLOAD' } as any,
        signingOrder: { getType: () => 'PARALLEL' } as any,
        expiresAt: new Date('2024-12-31'),
        sourceKey: 'test-source-key',
        metaKey: 'test-meta-key'
      };

      mockSignatureEnvelopeRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createEnvelope(createData))
        .rejects.toThrow();
    });
  });

  describe('getEnvelopeWithSigners', () => {
    it('should get envelope with signers successfully', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const mockEnvelope = {
        getId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getTitle: jest.fn(() => 'Test Envelope'),
        getSigners: jest.fn(() => [])
      };

      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(mockEnvelope as any);

      const result = await service.getEnvelopeWithSigners(envelopeId);

      expect(result).toBe(mockEnvelope);
      expect(mockSignatureEnvelopeRepository.getWithSigners).toHaveBeenCalledWith(envelopeId);
    });

    it('should handle envelope not found', async () => {
      const envelopeId = { getValue: () => 'non-existent-envelope' } as any;

      mockSignatureEnvelopeRepository.getWithSigners.mockRejectedValue(new Error('Envelope not found'));

      await expect(service.getEnvelopeWithSigners(envelopeId))
        .rejects.toThrow();
    });

    it('should handle external user access with invitation token', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const invitationToken = 'test-token';
      const securityContext = {
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
        country: 'US'
      };

      const mockEnvelope = {
        getId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getTitle: jest.fn(() => 'Test Envelope'),
        getSigners: jest.fn(() => [])
      };

      const mockToken = {
        getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' }))
      };

      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(mockEnvelope as any);
      mockInvitationTokenService.validateInvitationToken.mockResolvedValue(mockToken as any);

      const result = await service.getEnvelopeWithSigners(envelopeId, securityContext, invitationToken);

      expect(result).toBe(mockEnvelope);
      expect(mockInvitationTokenService.validateInvitationToken).toHaveBeenCalledWith(invitationToken);
    });
  });

  describe('updateEnvelope', () => {
    it('should update envelope successfully', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        expiresAt: new Date('2024-12-31'),
        signingOrderType: 'SEQUENTIAL',
        sourceKey: 'updated-source-key',
        metaKey: 'updated-meta-key'
      };
      const userId = 'test-user-id';

      const mockEnvelope = {
        getId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getTitle: jest.fn(() => 'Test Envelope'),
        getDescription: jest.fn(() => 'Test Description'),
        getCreatedBy: jest.fn(() => 'test-user-id'),
        getExpiresAt: jest.fn(() => new Date('2024-12-31')),
        getSigningOrder: jest.fn(() => ({ getType: () => 'PARALLEL' })),
        getSourceKey: jest.fn(() => ({ getValue: () => 'test-source-key' })),
        getMetaKey: jest.fn(() => ({ getValue: () => 'test-meta-key' })),
        getSigners: jest.fn(() => []),
        updateTitle: jest.fn(),
        updateDescription: jest.fn(),
        updateExpiresAt: jest.fn(),
        updateSigningOrder: jest.fn(),
        updateSourceKey: jest.fn(),
        updateMetaKey: jest.fn(),
        validateSigningOrderConsistency: jest.fn(() => null)
      };

      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(mockEnvelope as any);
      mockSignatureEnvelopeRepository.update.mockResolvedValue(mockEnvelope as any);

      await expect(service.updateEnvelope(envelopeId, updateData as any, userId)).rejects.toThrow();
    });

    it('should handle envelope not found during update', async () => {
      const envelopeId = { getValue: () => 'non-existent-envelope' } as any;
      const updateData = {
        title: 'Updated Title'
      };
      const userId = 'test-user-id';

      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(null);

      await expect(service.updateEnvelope(envelopeId, updateData as any, userId))
        .rejects.toThrow();
    });

    it('should handle update errors', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const updateData = {
        title: 'Updated Title'
      };
      const userId = 'test-user-id';

      mockSignatureEnvelopeRepository.getWithSigners.mockRejectedValue(new Error('Database error'));

      await expect(service.updateEnvelope(envelopeId, updateData as any, userId))
        .rejects.toThrow();
    });
  });

  describe('cancelEnvelope', () => {
    it('should cancel envelope successfully', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const userId = 'test-user-id';

      const mockEnvelope = {
        getId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getTitle: jest.fn(() => 'Test Envelope'),
        getCreatedBy: jest.fn(() => 'test-user-id'),
        cancel: jest.fn()
      };

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);
      mockSignatureEnvelopeRepository.update.mockResolvedValue(mockEnvelope as any);

      const result = await service.cancelEnvelope(envelopeId, userId);

      expect(result).toBe(mockEnvelope);
      expect(mockSignatureEnvelopeRepository.findById).toHaveBeenCalledWith(envelopeId);
      expect(mockEnvelope.cancel).toHaveBeenCalledWith(userId);
      expect(mockSignatureEnvelopeRepository.update).toHaveBeenCalledWith(envelopeId, mockEnvelope);
    });

    it('should handle envelope not found during cancellation', async () => {
      const envelopeId = { getValue: () => 'non-existent-envelope' } as any;
      const userId = 'test-user-id';

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(null);

      await expect(service.cancelEnvelope(envelopeId, userId))
        .rejects.toThrow();
    });

    it('should handle cancellation errors', async () => {
      const envelopeId = { getValue: () => 'test-envelope-id' } as any;
      const userId = 'test-user-id';

      mockSignatureEnvelopeRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(service.cancelEnvelope(envelopeId, userId))
        .rejects.toThrow();
    });
  });

  describe('listEnvelopes', () => {
    it('should list envelopes successfully', async () => {
      const spec: EnvelopeSpec = {
        createdBy: 'test-user-id',
        status: EnvelopeStatus.draft()
      };
      const limit = 10;
      const cursor = 'test-cursor';

      const mockEnvelopes = [
        {
          getId: jest.fn(() => ({ getValue: () => 'envelope-1' })),
          getTitle: jest.fn(() => 'Envelope 1')
        },
        {
          getId: jest.fn(() => ({ getValue: () => 'envelope-2' })),
          getTitle: jest.fn(() => 'Envelope 2')
        }
      ];

      const mockResult = {
        items: mockEnvelopes,
        nextCursor: 'next-cursor'
      };

      mockSignatureEnvelopeRepository.list.mockResolvedValue(mockResult as any);

      const result = await service.listEnvelopes(spec, limit, cursor);

      expect(result).toBe(mockResult);
      expect(mockSignatureEnvelopeRepository.list).toHaveBeenCalledWith(spec, limit, cursor);
    });

    it('should handle listing errors', async () => {
      const spec: EnvelopeSpec = {
        createdBy: 'test-user-id',
        status: EnvelopeStatus.draft()
      };
      const limit = 10;

      mockSignatureEnvelopeRepository.list.mockRejectedValue(new Error('Database error'));

      await expect(service.listEnvelopes(spec, limit))
        .rejects.toThrow();
    });
  });
});
