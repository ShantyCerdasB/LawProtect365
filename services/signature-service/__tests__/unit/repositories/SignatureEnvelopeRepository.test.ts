/**
 * @fileoverview SignatureEnvelopeRepository Unit Tests - Comprehensive test suite for signature envelope repository
 * @summary Tests all repository methods including CRUD operations, pagination, and error handling
 * @description This test suite covers all public and protected methods of SignatureEnvelopeRepository,
 * ensuring proper data mapping, error handling, and integration with Prisma operations.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

import { setupCursorPaginationMocks } from '../../helpers/mocks/cursorPagination';
const { mockListPage, mockDecodeCursor } = setupCursorPaginationMocks();

import { Prisma } from '@prisma/client';
import { SignatureEnvelopeRepository } from '../../../src/repositories/SignatureEnvelopeRepository';
import { SignatureEnvelope } from '../../../src/domain/entities/SignatureEnvelope';
import { EnvelopeId } from '../../../src/domain/value-objects/EnvelopeId';
import { TestUtils } from '../../helpers/testUtils';
import {
  createSignatureEnvelopePrismaMock,
  createSingleModelTransactionMock,
  PrismaModelMock,
} from '../../helpers/mocks/prisma';
import {
  signatureEnvelopePersistenceRow,
  signatureEnvelopeEntity,
  signatureEnvelopeSpec,
  partialSignatureEnvelopeEntity,
  createTestSigner,
} from '../../helpers/builders/signatureEnvelope';
import {
  mockRepositoryMethod,
  mockRepositoryMethodError,
  createMockPage,
} from '../../helpers/mocks/repository';

describe('SignatureEnvelopeRepository - Internal Methods', () => {
  let repository: SignatureEnvelopeRepository;
  let prismaMock: { signatureEnvelope: PrismaModelMock };
  let envelopeOps: PrismaModelMock;
  let shared: any;

  beforeEach(async () => {
    shared = await import('@lawprotect/shared-ts');
    const { prisma, signatureEnvelope } = createSignatureEnvelopePrismaMock();
    prismaMock = prisma as unknown as { signatureEnvelope: PrismaModelMock };
    envelopeOps = signatureEnvelope;
    repository = new SignatureEnvelopeRepository(prismaMock as any);
    jest.clearAllMocks();
    mockListPage.mockClear();
    mockDecodeCursor.mockClear();
  });

  describe('toCreateModel', () => {
    it('maps entity to Prisma create input', () => {
      const entity = signatureEnvelopeEntity();
      const result = (repository as any).toCreateModel(entity);

      expect(result).toEqual({
        id: entity.getId().getValue(),
        createdBy: entity.getCreatedBy(),
        title: entity.getTitle(),
        description: entity.getDescription(),
        status: entity.getStatus().getValue(),
        signingOrderType: entity.getSigningOrder().getType(),
        originType: entity.getOrigin().getType(),
        templateId: entity.getTemplateId(),
        templateVersion: entity.getTemplateVersion(),
        sourceKey: entity.getSourceKey()?.getValue(),
        metaKey: entity.getMetaKey()?.getValue(),
        flattenedKey: entity.getFlattenedKey()?.getValue(),
        signedKey: entity.getSignedKey()?.getValue(),
        sourceSha256: entity.getSourceSha256()?.getValue(),
        flattenedSha256: entity.getFlattenedSha256()?.getValue(),
        signedSha256: entity.getSignedSha256()?.getValue(),
        sentAt: entity.getSentAt(),
        completedAt: entity.getCompletedAt(),
        cancelledAt: entity.getCancelledAt(),
        declinedAt: entity.getDeclinedAt(),
        declinedBySignerId: entity.getDeclinedBySignerId()?.getValue(),
        declinedReason: entity.getDeclinedReason(),
        expiresAt: entity.getExpiresAt(),
      });
    });

    it('handles undefined optional fields', () => {
      const entity = signatureEnvelopeEntity({
        description: undefined,
        templateId: undefined,
        templateVersion: undefined,
        sourceKey: undefined,
        metaKey: undefined,
        flattenedKey: undefined,
        signedKey: undefined,
        sourceSha256: undefined,
        flattenedSha256: undefined,
        signedSha256: undefined,
        sentAt: undefined,
        completedAt: undefined,
        cancelledAt: undefined,
        declinedAt: undefined,
        declinedBySignerId: undefined,
        declinedReason: undefined,
        expiresAt: undefined,
      });

      const result = (repository as any).toCreateModel(entity);

      expect(result.description).toBeUndefined();
      expect(result.templateId).toBeUndefined();
      expect(result.templateVersion).toBeUndefined();
      expect(result.sourceKey).toBeUndefined();
      expect(result.metaKey).toBeUndefined();
      expect(result.flattenedKey).toBeUndefined();
      expect(result.signedKey).toBeUndefined();
      expect(result.sourceSha256).toBeUndefined();
      expect(result.flattenedSha256).toBeUndefined();
      expect(result.signedSha256).toBeUndefined();
      expect(result.sentAt).toBeUndefined();
      expect(result.completedAt).toBeUndefined();
      expect(result.cancelledAt).toBeUndefined();
      expect(result.declinedAt).toBeUndefined();
      expect(result.declinedBySignerId).toBeUndefined();
      expect(result.declinedReason).toBeUndefined();
      expect(result.expiresAt).toBeUndefined();
    });
  });

  describe('toUpdateModel', () => {
    it('maps partial entity to Prisma update input', () => {
      const partial = partialSignatureEnvelopeEntity({
        title: 'Updated Title',
        description: 'Updated Description',
        status: 'SENT',
      });

      const result = (repository as any).toUpdateModel(partial);

      expect(result).toEqual({
        title: 'Updated Title',
        description: 'Updated Description',
        status: 'SENT',
      });
    });

    it('handles undefined values by omitting them', () => {
      const partial = partialSignatureEnvelopeEntity({
        title: 'Updated Title',
        description: undefined,
        status: undefined,
      });

      const result = (repository as any).toUpdateModel(partial);

      expect(result).toEqual({
        title: 'Updated Title',
      });
      expect(result.description).toBeUndefined();
      expect(result.status).toBeUndefined();
    });

    it('handles null values explicitly', () => {
      const partial = partialSignatureEnvelopeEntity({
        description: null,
        declinedReason: null,
      });

      const result = (repository as any).toUpdateModel(partial);

      expect(result).toEqual({
        description: null,
        declinedReason: null,
      });
    });
  });

  describe('toDomain', () => {
    it('maps persistence row to domain entity', () => {
      const row = signatureEnvelopePersistenceRow();
      const result = (repository as any).toDomain(row);

      expect(result).toBeInstanceOf(SignatureEnvelope);
      expect(result.getId().getValue()).toBe(row.id);
      expect(result.getTitle()).toBe(row.title);
      expect(result.getDescription()).toBe(row.description);
    });

    it('throws repository error on invalid data', () => {
      const invalidData = { invalid: 'data' };

      expect(() => (repository as any).toDomain(invalidData)).toThrow();
    });
  });

  describe('whereById', () => {
    it('creates where clause for unique ID', () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const result = (repository as any).whereById(id);

      expect(result).toEqual({
        id: id.getValue(),
      });
    });
  });

  describe('whereFromSpec', () => {
    it('creates where clause from spec with basic filters', () => {
      const spec = signatureEnvelopeSpec({
        createdBy: 'user123',
        status: 'DRAFT',
        title: 'Test Document',
      });

      const result = (repository as any).whereFromSpec(spec);

      expect(result).toEqual({
        AND: [
          { createdBy: 'user123' },
          { status: 'DRAFT' },
          { title: 'Test Document' },
        ],
      });
    });

    it('handles isExpired flag correctly', () => {
      const spec = signatureEnvelopeSpec({
        isExpired: true,
      });

      const result = (repository as any).whereFromSpec(spec);

      expect(result).toEqual({
        OR: [
          { status: 'EXPIRED' },
          { expiresAt: { lt: expect.any(Date) } },
        ],
      });
    });

    it('handles isExpired false with AND conditions', () => {
      const spec = signatureEnvelopeSpec({
        isExpired: false,
        createdBy: 'user123',
      });

      const result = (repository as any).whereFromSpec(spec);

      expect(result).toEqual({
        AND: [
          { createdBy: 'user123' },
          { status: { not: 'EXPIRED' } },
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gte: expect.any(Date) } },
            ],
          },
        ],
      });
    });

    it('returns empty object for empty spec', () => {
      const spec = signatureEnvelopeSpec({});
      const result = (repository as any).whereFromSpec(spec);

      expect(result).toEqual({});
    });
  });
});

describe('SignatureEnvelopeRepository - Public Methods', () => {
  let repository: SignatureEnvelopeRepository;
  let prismaMock: { signatureEnvelope: PrismaModelMock };
  let envelopeOps: PrismaModelMock;

  beforeEach(async () => {
    const { prisma, signatureEnvelope } = createSignatureEnvelopePrismaMock();
    prismaMock = prisma as unknown as { signatureEnvelope: PrismaModelMock };
    envelopeOps = signatureEnvelope;
    repository = new SignatureEnvelopeRepository(prismaMock as any);
    jest.clearAllMocks();
    mockListPage.mockClear();
    mockDecodeCursor.mockClear();
  });

  describe('findById', () => {
    it('finds envelope by ID with signers', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const signers = [createTestSigner({ envelopeId: id.getValue() })];
      const rowWithSigners = { ...row, signers };

      mockRepositoryMethod(envelopeOps.findUnique, rowWithSigners);

      const result = await repository.findById(id);

      expect(result).toBeInstanceOf(SignatureEnvelope);
      expect(result?.getId().getValue()).toBe(id.getValue());
      expect(envelopeOps.findUnique).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });

    it('returns null when envelope not found', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());

      mockRepositoryMethod(envelopeOps.findUnique, null);

      const result = await repository.findById(id);

      expect(result).toBeNull();
    });

    it('throws repository error on database error', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());

      mockRepositoryMethodError(envelopeOps.findUnique, new Error('Database error'));

      await expect(repository.findById(id)).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      mockRepositoryMethod(envelopeOps.findUnique, row);

      await repository.findById(id, txMock);

      expect(envelopeOps.findUnique).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });
  });

  describe('create', () => {
    it('creates new envelope', async () => {
      const entity = signatureEnvelopeEntity();
      const row = signatureEnvelopePersistenceRow({ id: entity.getId().getValue() });
      const signers = [createTestSigner({ envelopeId: entity.getId().getValue() })];
      const rowWithSigners = { ...row, signers };

      mockRepositoryMethod(envelopeOps.create, rowWithSigners);

      const result = await repository.create(entity);

      expect(result).toBeInstanceOf(SignatureEnvelope);
      expect(result.getId().getValue()).toBe(entity.getId().getValue());
      expect(envelopeOps.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: entity.getId().getValue(),
          title: entity.getTitle(),
          description: entity.getDescription(),
        }),
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });

    it('throws repository error on database error', async () => {
      const entity = signatureEnvelopeEntity();

      mockRepositoryMethodError(envelopeOps.create, new Error('Database error'));

      await expect(repository.create(entity)).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const entity = signatureEnvelopeEntity();
      const row = signatureEnvelopePersistenceRow({ id: entity.getId().getValue() });
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      mockRepositoryMethod(envelopeOps.create, row);

      await repository.create(entity, txMock);

      expect(envelopeOps.create).toHaveBeenCalledWith({
        data: expect.any(Object),
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });
  });

  describe('update', () => {
    it('updates existing envelope', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const patch = { title: 'Updated Title', description: 'Updated Description' };
      const row = signatureEnvelopePersistenceRow({ id: id.getValue(), ...patch });
      const signers = [createTestSigner({ envelopeId: id.getValue() })];
      const rowWithSigners = { ...row, signers };

      mockRepositoryMethod(envelopeOps.update, rowWithSigners);

      const result = await repository.update(id, patch);

      expect(result).toBeInstanceOf(SignatureEnvelope);
      expect(result.getId().getValue()).toBe(id.getValue());
      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: expect.objectContaining({
          title: 'Updated Title',
          description: 'Updated Description',
        }),
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });

    it('throws repository error on database error', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const patch = { title: 'Updated Title' };

      mockRepositoryMethodError(envelopeOps.update, new Error('Database error'));

      await expect(repository.update(id, patch)).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const patch = { title: 'Updated Title' };
      const row = signatureEnvelopePersistenceRow({ id: id.getValue(), ...patch });
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      mockRepositoryMethod(envelopeOps.update, row);

      await repository.update(id, patch, txMock);

      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: expect.any(Object),
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });
  });

  describe('delete', () => {
    it('deletes envelope by ID', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());

      mockRepositoryMethod(envelopeOps.delete, undefined);

      await repository.delete(id);

      expect(envelopeOps.delete).toHaveBeenCalledWith({
        where: { id: id.getValue() },
      });
    });

    it('throws repository error on database error', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());

      mockRepositoryMethodError(envelopeOps.delete, new Error('Database error'));

      await expect(repository.delete(id)).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      mockRepositoryMethod(envelopeOps.delete, undefined);

      await repository.delete(id, txMock);

      expect(envelopeOps.delete).toHaveBeenCalledWith({
        where: { id: id.getValue() },
      });
    });
  });

  describe('list', () => {
    it('lists envelopes with pagination', async () => {
      const spec = signatureEnvelopeSpec();
      const limit = 10;
      const cursor = 'test-cursor';
      const fixedDate = new Date('2024-01-01T00:00:00.000Z');
      
      const rows = [
        signatureEnvelopePersistenceRow({ id: '1', createdAt: fixedDate }),
        signatureEnvelopePersistenceRow({ id: '2', createdAt: fixedDate }),
      ];
      const mockPage = createMockPage(rows, 'next-cursor');

      mockDecodeCursor.mockReturnValue({ createdAt: fixedDate, id: '1' });
      mockListPage.mockResolvedValue(mockPage);

      const result = await repository.list(spec, limit, cursor);

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe('next-cursor');
      expect(mockDecodeCursor).toHaveBeenCalledWith(cursor);
      expect(mockListPage).toHaveBeenCalledWith(
        envelopeOps,
        expect.objectContaining({
          AND: expect.arrayContaining([
            { createdBy: spec.createdBy },
            { status: spec.status.getValue() },
            { title: spec.title },
          ]),
        }),
        limit,
        { createdAt: fixedDate, id: '1' },
        expect.objectContaining({
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          cursorFields: ['createdAt', 'id'],
          include: { signers: { orderBy: { order: 'asc' } } },
        })
      );
    });

    it('lists envelopes without cursor', async () => {
      const spec = signatureEnvelopeSpec();
      const limit = 10;
      const rows = [signatureEnvelopePersistenceRow()];
      const mockPage = createMockPage(rows, undefined);

      mockListPage.mockResolvedValue(mockPage);

      const result = await repository.list(spec, limit);

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeUndefined();
      expect(mockDecodeCursor).not.toHaveBeenCalled();
      expect(mockListPage).toHaveBeenCalledWith(
        envelopeOps,
        expect.any(Object),
        limit,
        undefined,
        expect.any(Object)
      );
    });

    it('throws repository error on database error', async () => {
      const spec = signatureEnvelopeSpec();

      mockListPage.mockRejectedValue(new Error('Database error'));

      await expect(repository.list(spec)).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const spec = signatureEnvelopeSpec();
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');
      const rows = [signatureEnvelopePersistenceRow()];
      const mockPage = createMockPage(rows, undefined);

      mockListPage.mockResolvedValue(mockPage);

      await repository.list(spec, 10, undefined, txMock);

      expect(mockListPage).toHaveBeenCalledWith(
        envelopeOps,
        expect.any(Object),
        10,
        undefined,
        expect.any(Object)
      );
    });
  });

  describe('getWithSigners', () => {
    it('gets envelope with signers', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const signers = [createTestSigner({ envelopeId: id.getValue() })];
      const rowWithSigners = { ...row, signers };

      mockRepositoryMethod(envelopeOps.findUnique, rowWithSigners);

      const result = await repository.getWithSigners(id);

      expect(result).toBeInstanceOf(SignatureEnvelope);
      expect(result?.getId().getValue()).toBe(id.getValue());
      expect(envelopeOps.findUnique).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });

    it('returns null when envelope not found', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());

      mockRepositoryMethod(envelopeOps.findUnique, null);

      const result = await repository.getWithSigners(id);

      expect(result).toBeNull();
    });

    it('throws repository error on database error', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());

      mockRepositoryMethodError(envelopeOps.findUnique, new Error('Database error'));

      await expect(repository.getWithSigners(id)).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      mockRepositoryMethod(envelopeOps.findUnique, row);

      await repository.getWithSigners(id, txMock);

      expect(envelopeOps.findUnique).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });
  });

  describe('updateHashes', () => {
    it('updates envelope hashes', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const hashes = {
        sourceSha256: 'source-hash',
        flattenedSha256: 'flattened-hash',
        signedSha256: 'signed-hash',
      };
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const signers = [createTestSigner({ envelopeId: id.getValue() })];
      const rowWithSigners = { ...row, signers };

      mockRepositoryMethod(envelopeOps.update, rowWithSigners);

      const result = await repository.updateHashes(id, hashes);

      expect(result).toBeInstanceOf(SignatureEnvelope);
      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: {
          sourceSha256: 'source-hash',
          flattenedSha256: 'flattened-hash',
          signedSha256: 'signed-hash',
        },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });

    it('throws repository error on database error', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const hashes = { sourceSha256: 'source-hash' };

      mockRepositoryMethodError(envelopeOps.update, new Error('Database error'));

      await expect(repository.updateHashes(id, hashes)).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const hashes = { sourceSha256: 'source-hash' };
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      mockRepositoryMethod(envelopeOps.update, row);

      await repository.updateHashes(id, hashes, txMock);

      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: expect.any(Object),
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });
  });

  describe('updateSignedDocument', () => {
    it('updates signed document', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const signedKey = 'signed/document.pdf';
      const signedSha256 = 'signed-hash';
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const signers = [createTestSigner({ envelopeId: id.getValue() })];
      const rowWithSigners = { ...row, signers };

      mockRepositoryMethod(envelopeOps.update, rowWithSigners);

      const result = await repository.updateSignedDocument(id, signedKey, signedSha256);

      expect(result).toBeInstanceOf(SignatureEnvelope);
      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: {
          signedKey: 'signed/document.pdf',
          signedSha256: 'signed-hash',
        },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });

    it('throws repository error on database error', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());

      mockRepositoryMethodError(envelopeOps.update, new Error('Database error'));

      await expect(repository.updateSignedDocument(id, 'key', 'hash')).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      mockRepositoryMethod(envelopeOps.update, row);

      await repository.updateSignedDocument(id, 'key', 'hash', txMock);

      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: expect.any(Object),
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });
  });

  describe('completeEnvelope', () => {
    it('completes envelope', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const signers = [createTestSigner({ envelopeId: id.getValue() })];
      const rowWithSigners = { ...row, signers };

      mockRepositoryMethod(envelopeOps.update, rowWithSigners);

      const result = await repository.completeEnvelope(id);

      expect(result).toBeInstanceOf(SignatureEnvelope);
      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: {
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });

    it('throws repository error on database error', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());

      mockRepositoryMethodError(envelopeOps.update, new Error('Database error'));

      await expect(repository.completeEnvelope(id)).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      mockRepositoryMethod(envelopeOps.update, row);

      await repository.completeEnvelope(id, txMock);

      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: expect.any(Object),
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });
  });

  describe('updateFlattenedKey', () => {
    it('updates flattened key', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const flattenedKey = 'flattened/document.pdf';
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const signers = [createTestSigner({ envelopeId: id.getValue() })];
      const rowWithSigners = { ...row, signers };

      mockRepositoryMethod(envelopeOps.update, rowWithSigners);

      const result = await repository.updateFlattenedKey(id, flattenedKey);

      expect(result).toBeInstanceOf(SignatureEnvelope);
      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: {
          flattenedKey: 'flattened/document.pdf',
        },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });

    it('throws repository error on database error', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());

      mockRepositoryMethodError(envelopeOps.update, new Error('Database error'));

      await expect(repository.updateFlattenedKey(id, 'key')).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      mockRepositoryMethod(envelopeOps.update, row);

      await repository.updateFlattenedKey(id, 'key', txMock);

      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: expect.any(Object),
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });
  });
});
