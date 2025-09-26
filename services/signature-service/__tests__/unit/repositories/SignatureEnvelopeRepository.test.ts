
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

import { setupCursorPaginationMocks } from '../../helpers/mocks/cursorPagination';
const { mockListPage, mockDecodeCursor } = setupCursorPaginationMocks();

import { createOperationMock } from '../../helpers/mocks/signatureEnvelope';

import { Prisma } from '@prisma/client';
import { SignatureEnvelopeRepository } from '../../../src/repositories/SignatureEnvelopeRepository';
import { SignatureEnvelope } from '../../../src/domain/entities/SignatureEnvelope';
import { EnvelopeId } from '../../../src/domain/value-objects/EnvelopeId';
import { EnvelopeStatus } from '../../../src/domain/value-objects/EnvelopeStatus';
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
        id: TestUtils.generateUuid(),
        createdBy: TestUtils.generateUuid(),
        title: 'Test Document',
        status: 'DRAFT',
        signingOrder: 'OWNER_FIRST',
        origin: 'USER_UPLOAD',
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

      expect(result.description).toBe('Test document description');
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
        status: 'READY_FOR_SIGNATURE',
      });

      const result = (repository as any).toUpdateModel(partial);

      expect(result).toEqual({
        title: 'Updated Title',
        description: 'Updated Description',
        status: 'READY_FOR_SIGNATURE',
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
        description: undefined,
        declinedReason: undefined,
      });

      const result = (repository as any).toUpdateModel(partial);

      expect(result).toEqual({
        description: undefined,
        declinedReason: undefined,
      });
    });

    it('covers toUpdateModel with complex entity fields', () => {
      const partial = partialSignatureEnvelopeEntity({
        title: 'Updated Title',
        description: 'Updated Description',
        status: 'READY_FOR_SIGNATURE',
        createdBy: 'user123',
        templateId: 'template-123',
        templateVersion: '1',
        sourceKey: 'source/document.pdf',
        metaKey: 'meta/document.pdf',
        flattenedKey: 'flattened/document.pdf',
        signedKey: 'signed/document.pdf',
        sourceSha256: 'a'.repeat(64),
        flattenedSha256: 'b'.repeat(64),
        signedSha256: 'c'.repeat(64),
        sentAt: new Date('2024-01-01T00:00:00.000Z'),
        completedAt: new Date('2024-01-02T00:00:00.000Z'),
        cancelledAt: new Date('2024-01-03T00:00:00.000Z'),
        declinedAt: new Date('2024-01-04T00:00:00.000Z'),
        declinedBySignerId: 'b1645375-7971-438a-a6bd-e26c1f38b9ad',
        declinedReason: 'User declined',
        expiresAt: new Date('2024-12-31T23:59:59.999Z'),
      });

      const result = (repository as any).toUpdateModel(partial);

      expect(result).toEqual({
        title: 'Updated Title',
        description: 'Updated Description',
        status: 'READY_FOR_SIGNATURE',
        createdBy: 'user123',
        templateId: 'template-123',
        templateVersion: '1',
        sourceKey: 'source/document.pdf',
        metaKey: 'meta/document.pdf',
        flattenedKey: 'flattened/document.pdf',
        signedKey: 'signed/document.pdf',
        sourceSha256: 'a'.repeat(64),
        flattenedSha256: 'b'.repeat(64),
        signedSha256: 'c'.repeat(64),
        sentAt: new Date('2024-01-01T00:00:00.000Z'),
        completedAt: new Date('2024-01-02T00:00:00.000Z'),
        cancelledAt: new Date('2024-01-03T00:00:00.000Z'),
        declinedAt: new Date('2024-01-04T00:00:00.000Z'),
        declinedBySignerId: 'b1645375-7971-438a-a6bd-e26c1f38b9ad',
        declinedReason: 'User declined',
        expiresAt: new Date('2024-12-31T23:59:59.999Z'),
      });
    });

    it('covers toUpdateModel with value extractors for signing order and origin', () => {
      const partial = partialSignatureEnvelopeEntity({
        signingOrder: 'OWNER_FIRST',
        origin: 'USER_UPLOAD',
      });

      const result = (repository as any).toUpdateModel(partial);

      expect(result).toEqual({
        signingOrderType: 'OWNER_FIRST',
        originType: 'USER_UPLOAD',
      });
    });
  });

  describe('toDomain', () => {
    it('maps persistence row to domain entity', () => {
      const row = signatureEnvelopePersistenceRow();
      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockReturnValueOnce({} as any);
      const result = (repository as any).toDomain(row);

      expect(result).toEqual({});
      spy.mockRestore();
    });

    it('throws repository error on invalid data', () => {
      const invalidData = { invalid: 'data' };

      expect(() => (repository as any).toDomain(invalidData)).toThrow();
    });
  });

  describe('toModel', () => {
    it('throws repository error when entity is null', () => {
      expect(() => (repository as any).toModel(null)).toThrow();
    });

    it('throws repository error when entity is undefined', () => {
      expect(() => (repository as any).toModel(undefined)).toThrow();
    });

    it('throws repository error when entity lacks getId method', () => {
      const invalidEntity = { getTitle: () => 'test' };
      expect(() => (repository as any).toModel(invalidEntity)).toThrow();
    });

    it('successfully maps entity to model', () => {
      const entity = signatureEnvelopeEntity();
      const result = (repository as any).toModel(entity);

      expect(result).toEqual({
        id: entity.getId().getValue(),
        createdBy: entity.getCreatedBy(),
        title: entity.getTitle(),
        description: entity.getDescription(),
        status: entity.getStatus().getValue(),
        signingOrderType: entity.getSigningOrder()?.getType(),
        originType: entity.getOrigin()?.getType(),
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
        createdAt: entity.getCreatedAt(),
        updatedAt: entity.getUpdatedAt()
      });
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
        status: EnvelopeStatus.fromString('DRAFT'),
        title: 'Test Document',
      });

      const result = (repository as any).whereFromSpec(spec);

      expect(result).toEqual({
        AND: expect.arrayContaining([
          { createdBy: 'user123' },
          { status: 'DRAFT' },
          { title: 'Test Document' },
        ]),
      });
    });

    it('handles isExpired flag correctly', () => {
      const spec = signatureEnvelopeSpec({
        isExpired: true,
      });

      const result = (repository as any).whereFromSpec(spec);

      expect(result).toEqual({
        OR: [
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

      envelopeOps.findUnique.mockResolvedValueOnce(rowWithSigners);
      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockReturnValueOnce({} as any);

      const result = await repository.findById(id);

      expect(result).toEqual({});
      expect(envelopeOps.findUnique).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
      spy.mockRestore();
    });

    it('returns null when envelope not found', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());

      envelopeOps.findUnique.mockResolvedValueOnce(null);

      const result = await repository.findById(id);

      expect(result).toBeNull();
    });

    it('throws repository error on database error', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());

      envelopeOps.findUnique.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.findById(id)).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      envelopeOps.findUnique.mockResolvedValueOnce(row);

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

      envelopeOps.create.mockResolvedValueOnce(rowWithSigners);
      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockReturnValueOnce({} as any);

      const result = await repository.create(entity);

      expect(result).toEqual({});
      expect(envelopeOps.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: entity.getId().getValue(),
          title: entity.getTitle(),
          description: entity.getDescription(),
        }),
        include: { signers: { orderBy: { order: 'asc' } } },
      });
      spy.mockRestore();
    });

    it('throws repository error on database error', async () => {
      const entity = signatureEnvelopeEntity();

      envelopeOps.create.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.create(entity)).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const entity = signatureEnvelopeEntity();
      const row = signatureEnvelopePersistenceRow({ id: entity.getId().getValue() });
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      envelopeOps.create.mockResolvedValueOnce(row);

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
      const patch = partialSignatureEnvelopeEntity({
        title: 'Updated Title',
        description: 'Updated Description',
      });
      const row = signatureEnvelopePersistenceRow({ id: id.getValue(), title: 'Updated Title', description: 'Updated Description' });
      const signers = [createTestSigner({ envelopeId: id.getValue() })];
      const rowWithSigners = { ...row, signers };

      envelopeOps.update.mockResolvedValueOnce(rowWithSigners);
      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockReturnValueOnce({} as any);

      const result = await repository.update(id, patch as any);

      expect(result).toEqual({});
      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: expect.objectContaining({
          title: 'Updated Title',
          description: 'Updated Description',
        }),
        include: { signers: { orderBy: { order: 'asc' } } },
      });
      spy.mockRestore();
    });

    it('throws repository error on database error', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const patch = partialSignatureEnvelopeEntity({
        title: 'Updated Title',
      });

      envelopeOps.update.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.update(id, patch as any)).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const patch = partialSignatureEnvelopeEntity({
        title: 'Updated Title',
      });
      const row = signatureEnvelopePersistenceRow({ id: id.getValue(), title: 'Updated Title' });
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      envelopeOps.update.mockResolvedValueOnce(row);

      await repository.update(id, patch as any, txMock);

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

      envelopeOps.delete.mockResolvedValueOnce(undefined);

      await repository.delete(id);

      expect(envelopeOps.delete).toHaveBeenCalledWith({
        where: { id: id.getValue() },
      });
    });

    it('throws repository error on database error', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());

      envelopeOps.delete.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.delete(id)).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      envelopeOps.delete.mockResolvedValueOnce(undefined);

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
      const mockPage = { rows, nextCursor: 'next-cursor' };

      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockImplementation(() => ({} as any));
      
      mockDecodeCursor.mockReturnValue({ createdAt: fixedDate, id: '1' });
      mockListPage.mockResolvedValue(mockPage);

      const result = await repository.list(spec, limit, cursor);

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe('next-cursor');
      expect(mockDecodeCursor).toHaveBeenCalledWith(cursor);
      expect(mockListPage).toHaveBeenCalledWith(
        envelopeOps,
        expect.any(Object), // whereFromSpec returns empty object for empty spec
        limit,
        { createdAt: fixedDate, id: '1' },
        expect.objectContaining({
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          cursorFields: ['createdAt', 'id'],
          include: { signers: { orderBy: { order: 'asc' } } },
        })
      );
      spy.mockRestore();
    });

    it('lists envelopes without cursor', async () => {
      const spec = signatureEnvelopeSpec();
      const limit = 10;
      const rows = [signatureEnvelopePersistenceRow()];
      const mockPage = { rows, nextCursor: undefined };

      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockImplementation(() => ({} as any));
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
      spy.mockRestore();
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
      const mockPage = { rows, nextCursor: undefined };

      mockListPage.mockResolvedValue(mockPage);
      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockImplementation(() => ({} as any));

      await repository.list(spec, 10, undefined, txMock);

      expect(mockListPage).toHaveBeenCalledWith(
        envelopeOps,
        expect.any(Object),
        10,
        undefined,
        expect.any(Object)
      );
      spy.mockRestore();
    });

    it('covers normalizeCursor callback with string date', async () => {
      const spec = signatureEnvelopeSpec();
      const limit = 10;
      const cursor = 'test-cursor';
      const fixedDate = new Date('2024-01-01T00:00:00.000Z');
      
      const rows = [
        signatureEnvelopePersistenceRow({ id: '1', createdAt: fixedDate }),
        signatureEnvelopePersistenceRow({ id: '2', createdAt: fixedDate }),
      ];
      const mockPage = { rows, nextCursor: 'next-cursor' };

      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockImplementation(() => ({} as any));
      
      mockDecodeCursor.mockReturnValue({ 
        createdAt: '2024-01-01T00:00:00.000Z',
        id: '1' 
      });
      
      let capturedConfig: any;
      mockListPage.mockImplementation(async (client: any, where: any, limit: any, decoded: any, config: any) => {
        capturedConfig = config;
        if (config.normalizeCursor && decoded) {
          const normalized = config.normalizeCursor(decoded);
          expect(normalized).toEqual({
            id: '1',
            createdAt: new Date('2024-01-01T00:00:00.000Z')
          });
        }
        return mockPage;
      });

      const result = await repository.list(spec, limit, cursor);

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe('next-cursor');
      expect(capturedConfig).toBeDefined();
      expect(capturedConfig.normalizeCursor).toBeDefined();
      spy.mockRestore();
    });

    it('covers normalizeCursor callback with Date object', async () => {
      const spec = signatureEnvelopeSpec();
      const limit = 10;
      const cursor = 'test-cursor';
      const fixedDate = new Date('2024-01-01T00:00:00.000Z');
      
      const rows = [
        signatureEnvelopePersistenceRow({ id: '1', createdAt: fixedDate }),
        signatureEnvelopePersistenceRow({ id: '2', createdAt: fixedDate }),
      ];
      const mockPage = { rows, nextCursor: 'next-cursor' };

      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockImplementation(() => ({} as any));
      
      mockDecodeCursor.mockReturnValue({ 
        createdAt: fixedDate,
        id: '1' 
      });
      
      let capturedConfig: any;
      mockListPage.mockImplementation(async (client: any, where: any, limit: any, decoded: any, config: any) => {
        capturedConfig = config;
        if (config.normalizeCursor && decoded) {
          const normalized = config.normalizeCursor(decoded);
          expect(normalized).toEqual({
            id: '1',
            createdAt: fixedDate
          });
        }
        return mockPage;
      });

      const result = await repository.list(spec, limit, cursor);

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe('next-cursor');
      expect(capturedConfig).toBeDefined();
      expect(capturedConfig.normalizeCursor).toBeDefined();
      spy.mockRestore();
    });
  });

  describe('getWithSigners', () => {
    it('gets envelope with signers', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const signers = [createTestSigner({ envelopeId: id.getValue() })];
      const rowWithSigners = { ...row, signers };

      envelopeOps.findUnique.mockResolvedValueOnce(rowWithSigners);
      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockReturnValueOnce({} as any);

      const result = await repository.getWithSigners(id);

      expect(result).toEqual({});
      expect(envelopeOps.findUnique).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
      spy.mockRestore();
    });

    it('returns null when envelope not found', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());

      envelopeOps.findUnique.mockResolvedValueOnce(null);

      const result = await repository.getWithSigners(id);

      expect(result).toBeNull();
    });

    it('throws repository error on database error', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());

      envelopeOps.findUnique.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.getWithSigners(id)).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      envelopeOps.findUnique.mockResolvedValueOnce(row);

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
        sourceSha256: 'a'.repeat(64),
        flattenedSha256: 'b'.repeat(64),
        signedSha256: 'c'.repeat(64),
      };
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const signers = [createTestSigner({ envelopeId: id.getValue() })];
      const rowWithSigners = { ...row, signers };

      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockReturnValue({
        updateHashes: jest.fn(),
      } as any);
      
      envelopeOps.findUnique.mockResolvedValueOnce(rowWithSigners);
      envelopeOps.update.mockResolvedValueOnce(rowWithSigners);

      const result = await repository.updateHashes(id, hashes);
      
      spy.mockRestore();

      expect(result).toBeDefined();
      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: {
          sourceSha256: 'a'.repeat(64),
          flattenedSha256: 'b'.repeat(64),
          signedSha256: 'c'.repeat(64),
        },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });

    it('updates only provided hash fields', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const hashes = { sourceSha256: 'd'.repeat(64) };

      jest.spyOn(SignatureEnvelope, 'fromPersistence').mockReturnValue({ updateHashes: jest.fn() } as any);
      envelopeOps.findUnique.mockResolvedValueOnce(signatureEnvelopePersistenceRow({ id: id.getValue() }));
      envelopeOps.update.mockResolvedValueOnce(signatureEnvelopePersistenceRow({ id: id.getValue() }));

      await repository.updateHashes(id, hashes);

      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: { sourceSha256: 'd'.repeat(64) },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });

    it('handles empty hashes object', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const hashes = {};

      jest.spyOn(SignatureEnvelope, 'fromPersistence').mockReturnValue({ updateHashes: jest.fn() } as any);
      envelopeOps.findUnique.mockResolvedValueOnce(signatureEnvelopePersistenceRow({ id: id.getValue() }));
      envelopeOps.update.mockResolvedValueOnce(signatureEnvelopePersistenceRow({ id: id.getValue() }));

      await repository.updateHashes(id, hashes);

      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: {},
        include: { signers: { orderBy: { order: 'asc' } } },
      });
    });

    it('throws repository error on database error', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const hashes = { sourceSha256: 'e'.repeat(64) };

      envelopeOps.update.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.updateHashes(id, hashes)).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const hashes = { sourceSha256: 'f'.repeat(64) };
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      envelopeOps.findUnique.mockResolvedValueOnce(row);
      envelopeOps.update.mockResolvedValueOnce(row);
      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockReturnValue({
        updateHashes: jest.fn(),
      } as any);

      await repository.updateHashes(id, hashes, txMock);

      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: { sourceSha256: 'f'.repeat(64) },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
      spy.mockRestore();
    });
  });

  describe('updateSignedDocument', () => {
    it('updates signed document', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const signedKey = 'signed/document.pdf';
      const signedSha256 = 'a'.repeat(64);
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const signers = [createTestSigner({ envelopeId: id.getValue() })];
      const rowWithSigners = { ...row, signers };

      envelopeOps.findUnique.mockResolvedValueOnce(rowWithSigners);
      envelopeOps.update.mockResolvedValueOnce(rowWithSigners);
      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockReturnValue({
        updateSignedDocument: jest.fn(),
      } as any);

      const result = await repository.updateSignedDocument(id, signedKey, signedSha256);

      expect(result).toEqual({ updateSignedDocument: expect.any(Function) });
      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: {
          signedKey: 'signed/document.pdf',
          signedSha256: 'a'.repeat(64),
        },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
      spy.mockRestore();
    });

    it('throws repository error on database error', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());

      envelopeOps.update.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.updateSignedDocument(id, 'key', 'hash')).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      envelopeOps.findUnique.mockResolvedValueOnce(row);
      envelopeOps.update.mockResolvedValueOnce(row);
      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockReturnValue({
        updateSignedDocument: jest.fn(),
      } as any);

      await repository.updateSignedDocument(id, 'key', 'b'.repeat(64), txMock);

      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: { signedKey: 'key', signedSha256: 'b'.repeat(64) },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
      spy.mockRestore();
    });
  });

  describe('completeEnvelope', () => {
    it('completes envelope', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const signers = [createTestSigner({ envelopeId: id.getValue() })];
      const rowWithSigners = { ...row, signers };

      envelopeOps.findUnique.mockResolvedValueOnce(rowWithSigners);
      envelopeOps.update.mockResolvedValueOnce(rowWithSigners);
      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockReturnValue({
        complete: jest.fn(),
      } as any);

      const result = await repository.completeEnvelope(id);

      expect(result).toEqual({ complete: expect.any(Function) });
      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: {
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
      spy.mockRestore();
    });

    it('throws repository error on database error', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());

      envelopeOps.update.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.completeEnvelope(id)).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      envelopeOps.findUnique.mockResolvedValueOnce(row);
      envelopeOps.update.mockResolvedValueOnce(row);
      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockReturnValue({
        complete: jest.fn(),
      } as any);

      await repository.completeEnvelope(id, txMock);

      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: { status: 'COMPLETED', completedAt: expect.any(Date) },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
      spy.mockRestore();
    });
  });

  describe('updateFlattenedKey', () => {
    it('updates flattened key', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const flattenedKey = 'flattened/document.pdf';
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const signers = [createTestSigner({ envelopeId: id.getValue() })];
      const rowWithSigners = { ...row, signers };

      envelopeOps.update.mockResolvedValueOnce(rowWithSigners);
      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockImplementation(() => ({} as any));

      const result = await repository.updateFlattenedKey(id, flattenedKey);

      expect(result).toEqual({});
      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: {
          flattenedKey: 'flattened/document.pdf',
        },
        include: { signers: { orderBy: { order: 'asc' } } },
      });
      spy.mockRestore();
    });

    it('throws repository error on database error', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());

      envelopeOps.update.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.updateFlattenedKey(id, 'key')).rejects.toThrow();
    });

    it('uses transaction client when provided', async () => {
      const id = EnvelopeId.fromString(TestUtils.generateUuid());
      const row = signatureEnvelopePersistenceRow({ id: id.getValue() });
      const txMock = createSingleModelTransactionMock(envelopeOps, 'signatureEnvelope');

      envelopeOps.update.mockResolvedValueOnce(row);
      const spy = jest.spyOn(SignatureEnvelope, 'fromPersistence').mockImplementation(() => ({} as any));

      await repository.updateFlattenedKey(id, 'key', txMock);

      expect(envelopeOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: expect.any(Object),
        include: { signers: { orderBy: { order: 'asc' } } },
      });
      spy.mockRestore();
    });
  });
});
