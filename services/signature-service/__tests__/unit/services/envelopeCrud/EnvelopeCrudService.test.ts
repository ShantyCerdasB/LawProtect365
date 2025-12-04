/**
 * @fileoverview EnvelopeCrudService.test.ts - Unit tests for EnvelopeCrudService
 * @summary Tests for the envelope CRUD service
 * @description This file contains comprehensive unit tests for the EnvelopeCrudService class,
 * testing all CRUD operations with mocked dependencies to ensure proper functionality.
 */

import { generateTestIpAddress } from '../../../helpers/testUtils';
import { EnvelopeCrudService } from '@/services/envelopeCrud/EnvelopeCrudService';
import { TestUtils } from '../../../helpers/testUtils';
import { SignatureEnvelopeRepository } from '@/repositories/SignatureEnvelopeRepository';
import { InvitationTokenService } from '@/services/invitationTokenService';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { DocumentOrigin } from '@/domain/value-objects/DocumentOrigin';
import { SigningOrder } from '@/domain/value-objects/SigningOrder';
import { EnvelopeStatus } from '@/domain/value-objects/EnvelopeStatus';
import { SignatureEnvelopeBuilder } from '../../../helpers/builders/SignatureEnvelopeBuilder';
import { EnvelopeSignerBuilder } from '../../../helpers/builders/EnvelopeSignerBuilder';

describe('EnvelopeCrudService', () => {
  let service: EnvelopeCrudService;
  let mockSignatureEnvelopeRepository: jest.Mocked<SignatureEnvelopeRepository>;
  let mockInvitationTokenService: jest.Mocked<InvitationTokenService>;
  let mockAuditEventService: jest.Mocked<AuditEventService>;

  beforeEach(() => {
    mockSignatureEnvelopeRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      getWithSigners: jest.fn(),
      update: jest.fn(),
      list: jest.fn(),
      delete: jest.fn(),
      updateHashes: jest.fn(),
      updateSignedDocument: jest.fn(),
      completeEnvelope: jest.fn(),
      updateFlattenedKey: jest.fn(),
      listWithCursorPagination: jest.fn(),
    } as unknown as jest.Mocked<SignatureEnvelopeRepository>;

    mockInvitationTokenService = {
      validateInvitationToken: jest.fn(),
      createInvitationToken: jest.fn(),
      revokeInvitationToken: jest.fn(),
      generateInvitationTokensForSigners: jest.fn(),
      generateViewerInvitationToken: jest.fn(),
      markTokenAsViewed: jest.fn(),
      markTokenAsSigned: jest.fn(),
      updateTokenSentAt: jest.fn(),
    } as unknown as jest.Mocked<InvitationTokenService>;

    mockAuditEventService = {
      createSignerEvent: jest.fn(),
      createEnvelopeEvent: jest.fn(),
      createAuditEvent: jest.fn(),
    } as unknown as jest.Mocked<AuditEventService>;

    service = new EnvelopeCrudService(
      mockSignatureEnvelopeRepository,
      mockInvitationTokenService,
      mockAuditEventService
    );
  });

  describe('createEnvelope', () => {
    it('should create envelope successfully', async () => {
      const data = {
        id: EnvelopeId.fromString(TestUtils.generateUuid()),
        createdBy: TestUtils.generateUuid(),
        title: 'Test Envelope',
        description: 'Test Description',
        origin: DocumentOrigin.userUpload(),
        signingOrder: SigningOrder.ownerFirst(),
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123',
      };
      const expectedEnvelope = SignatureEnvelopeBuilder.create()
        .withId(data.id)
        .withCreatedBy(data.createdBy)
        .withTitle(data.title)
        .build();

      mockSignatureEnvelopeRepository.create.mockResolvedValue(expectedEnvelope);

      const result = await service.createEnvelope(data);

      expect(mockSignatureEnvelopeRepository.create).toHaveBeenCalledWith(expect.any(SignatureEnvelope));
      expect(result).toEqual(expectedEnvelope);
    });

    it('should throw error when creation fails', async () => {
      const data = {
        id: EnvelopeId.fromString(TestUtils.generateUuid()),
        createdBy: TestUtils.generateUuid(),
        title: 'Test Envelope',
        description: 'Test Description',
        origin: DocumentOrigin.userUpload(),
        signingOrder: SigningOrder.ownerFirst(),
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123',
      };
      const error = new Error('Repository error');

      mockSignatureEnvelopeRepository.create.mockRejectedValue(error);

      await expect(service.createEnvelope(data)).rejects.toThrow('Envelope creation failed');
    });
  });

  describe('getEnvelopeWithSigners', () => {
    it('should get envelope with signers successfully', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const expectedEnvelope = SignatureEnvelopeBuilder.create()
        .withId(envelopeId)
        .withSigners([
          EnvelopeSignerBuilder.create().withId(TestUtils.generateSignerId()).build(),
        ])
        .build();

      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(expectedEnvelope);

      const result = await service.getEnvelopeWithSigners(envelopeId);

      expect(mockSignatureEnvelopeRepository.getWithSigners).toHaveBeenCalledWith(envelopeId);
      expect(result).toEqual(expectedEnvelope);
    });

    it('should handle external user access with invitation token', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const invitationToken = 'token-123';
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'Test Agent',
        country: 'US',
      };
      const expectedEnvelope = SignatureEnvelopeBuilder.create()
        .withId(envelopeId)
        .build();
      const mockToken = {
        getEnvelopeId: () => envelopeId,
      };

      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(expectedEnvelope);
      mockInvitationTokenService.validateInvitationToken.mockResolvedValue(mockToken as any);

      const result = await service.getEnvelopeWithSigners(envelopeId, securityContext, invitationToken);

      expect(mockInvitationTokenService.validateInvitationToken).toHaveBeenCalledWith(invitationToken);
      expect(result).toEqual(expectedEnvelope);
    });

    it('should throw error when envelope not found', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const error = new Error('Repository error');

      mockSignatureEnvelopeRepository.getWithSigners.mockRejectedValue(error);

      await expect(service.getEnvelopeWithSigners(envelopeId)).rejects.toThrow('Envelope not found');
    });
  });

  describe('updateEnvelope', () => {
    it('should update envelope successfully', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const userId = TestUtils.generateUuid();
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
      };
      const existingEnvelope = SignatureEnvelopeBuilder.create()
        .withId(envelopeId)
        .withCreatedBy(userId)
        .withTitle('Original Title')
        .build();
      const updatedEnvelope = SignatureEnvelopeBuilder.create()
        .withId(envelopeId)
        .withTitle('Updated Title')
        .build();

      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(existingEnvelope);
      mockSignatureEnvelopeRepository.update.mockResolvedValue(updatedEnvelope);

      const result = await service.updateEnvelope(envelopeId, updateData, userId);

      expect(mockSignatureEnvelopeRepository.getWithSigners).toHaveBeenCalledWith(envelopeId);
      expect(mockSignatureEnvelopeRepository.update).toHaveBeenCalledWith(envelopeId, expect.any(SignatureEnvelope));
      expect(result).toEqual(updatedEnvelope);
    });

    it('should handle signing order auto-correction when adding signers', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const userId = TestUtils.generateUuid();
      const updateData = {
        addSigners: [
          {
            email: 'new@example.com',
            fullName: 'New Signer',
            isExternal: true,
            order: 1,
          },
        ],
      };
      const existingEnvelope = SignatureEnvelopeBuilder.create()
        .withId(envelopeId)
        .withCreatedBy(userId)
        .withSigningOrder(SigningOrder.ownerFirst())
        .build();
      const updatedEnvelope = SignatureEnvelopeBuilder.create()
        .withId(envelopeId)
        .withSigningOrder(SigningOrder.inviteesFirst())
        .build();

      // Mock the validateSigningOrderConsistency method to return a correction
      existingEnvelope.validateSigningOrderConsistency = jest.fn().mockReturnValue('INVITEES_FIRST');

      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(existingEnvelope);
      mockSignatureEnvelopeRepository.update.mockResolvedValue(updatedEnvelope);

      const result = await service.updateEnvelope(envelopeId, updateData, userId);

      expect(existingEnvelope.validateSigningOrderConsistency).toHaveBeenCalled();
      expect(result).toEqual(updatedEnvelope);
    });

    it('should throw error when envelope not found', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const userId = TestUtils.generateUuid();
      const updateData = { title: 'Updated Title' };

      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(null);

      await expect(service.updateEnvelope(envelopeId, updateData, userId)).rejects.toThrow('Envelope update failed');
    });

    it('should throw error when update fails', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const userId = TestUtils.generateUuid();
      const updateData = { title: 'Updated Title' };
      const existingEnvelope = SignatureEnvelopeBuilder.create()
        .withId(envelopeId)
        .withCreatedBy(userId)
        .build();
      const error = new Error('Repository error');

      mockSignatureEnvelopeRepository.getWithSigners.mockResolvedValue(existingEnvelope);
      mockSignatureEnvelopeRepository.update.mockRejectedValue(error);

      await expect(service.updateEnvelope(envelopeId, updateData, userId)).rejects.toThrow('Envelope update failed');
    });
  });

  describe('cancelEnvelope', () => {
    it('should cancel envelope successfully', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const userId = TestUtils.generateUuid();
      const existingEnvelope = SignatureEnvelopeBuilder.create()
        .withId(envelopeId)
        .withCreatedBy(userId)
        .build();
      const cancelledEnvelope = SignatureEnvelopeBuilder.create()
        .withId(envelopeId)
        .withStatus('CANCELLED' as any)
        .build();

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(existingEnvelope);
      mockSignatureEnvelopeRepository.update.mockResolvedValue(cancelledEnvelope);

      const result = await service.cancelEnvelope(envelopeId, userId);

      expect(mockSignatureEnvelopeRepository.findById).toHaveBeenCalledWith(envelopeId);
      expect(mockSignatureEnvelopeRepository.update).toHaveBeenCalledWith(envelopeId, expect.any(SignatureEnvelope));
      expect(result).toEqual(cancelledEnvelope);
    });

    it('should throw error when envelope not found', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const userId = TestUtils.generateUuid();

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(null);

      await expect(service.cancelEnvelope(envelopeId, userId)).rejects.toThrow('Envelope update failed');
    });

    it('should rethrow business validation errors', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const userId = TestUtils.generateUuid();
      const existingEnvelope = SignatureEnvelopeBuilder.create()
        .withId(envelopeId)
        .withCreatedBy(userId)
        .build();
      const businessError = {
        code: 'ENVELOPE_ACCESS_DENIED',
        message: 'Access denied',
      };

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(existingEnvelope);
      existingEnvelope.cancel = jest.fn().mockImplementation(() => {
        throw businessError;
      });

      await expect(service.cancelEnvelope(envelopeId, userId)).rejects.toEqual(businessError);
    });

    it('should throw error when cancellation fails', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const userId = TestUtils.generateUuid();
      const existingEnvelope = SignatureEnvelopeBuilder.create()
        .withId(envelopeId)
        .withCreatedBy(userId)
        .build();
      const error = new Error('Repository error');

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(existingEnvelope);
      mockSignatureEnvelopeRepository.update.mockRejectedValue(error);

      await expect(service.cancelEnvelope(envelopeId, userId)).rejects.toThrow('Envelope update failed');
    });
  });

  describe('listEnvelopes', () => {
    it('should list envelopes successfully', async () => {
      const spec = {
        createdBy: TestUtils.generateUuid(),
        status: EnvelopeStatus.draft(),
      };
      const limit = 10;
      const cursor = 'cursor-123';
      const expectedResult = {
        items: [
          SignatureEnvelopeBuilder.create().withId(EnvelopeId.fromString(TestUtils.generateUuid())).build(),
        ],
        nextCursor: 'next-cursor',
      };

      mockSignatureEnvelopeRepository.list.mockResolvedValue(expectedResult);

      const result = await service.listEnvelopes(spec, limit, cursor);

      expect(mockSignatureEnvelopeRepository.list).toHaveBeenCalledWith(spec, limit, cursor);
      expect(result).toEqual(expectedResult);
    });

    it('should list envelopes without cursor', async () => {
      const spec = {
        createdBy: TestUtils.generateUuid(),
      };
      const limit = 10;
      const expectedResult = {
        items: [],
        nextCursor: undefined,
      };

      mockSignatureEnvelopeRepository.list.mockResolvedValue(expectedResult);

      const result = await service.listEnvelopes(spec, limit);

      expect(mockSignatureEnvelopeRepository.list).toHaveBeenCalledWith(spec, limit, undefined);
      expect(result).toEqual(expectedResult);
    });

    it('should throw error when listing fails', async () => {
      const spec = {
        createdBy: TestUtils.generateUuid(),
      };
      const limit = 10;
      const error = new Error('Repository error');

      mockSignatureEnvelopeRepository.list.mockRejectedValue(error);

      await expect(service.listEnvelopes(spec, limit)).rejects.toThrow('Envelope not found');
    });
  });
});