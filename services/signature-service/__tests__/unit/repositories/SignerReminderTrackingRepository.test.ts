import { jest, describe, it, expect, beforeEach } from '@jest/globals';

import { setupCursorPaginationMocks } from '../../helpers/mocks/cursorPagination';
const { mockListPage, mockDecodeCursor } = setupCursorPaginationMocks();

import { SignerReminderTrackingRepository } from '../../../src/repositories/SignerReminderTrackingRepository';
import { SignerReminderTracking } from '../../../src/domain/entities/SignerReminderTracking';
import { TestUtils } from '../../helpers/testUtils';
import {
  createSignerReminderTrackingPrismaMock,
  createSingleModelTransactionMock,
  PrismaModelMock,
} from '../../helpers/mocks/prisma';
import {
  trackingPersistenceRow,
  trackingEntity,
  trackingSpec,
  trackingDto,
  partialTrackingEntity,
  trackingVO,
} from '../../helpers/builders/signerReminderTracking';
import {
} from '../../helpers/mocks/repository';

describe('SignerReminderTrackingRepository - Internal Methods', () => {
  let repository: SignerReminderTrackingRepository;
  let prismaMock: { signerReminderTracking: PrismaModelMock };
  let trackingOps: PrismaModelMock;

  beforeEach(async () => {
    const { prisma, signerReminderTracking } = createSignerReminderTrackingPrismaMock();
    prismaMock = prisma as unknown as { signerReminderTracking: PrismaModelMock };
    trackingOps = signerReminderTracking;
    repository = new SignerReminderTrackingRepository(prismaMock as any);
    jest.clearAllMocks();
    mockListPage.mockClear();
    mockDecodeCursor.mockClear();
  });

  describe('toCreateModel', () => {
    it('maps entity to Prisma create input', () => {
      const entity = trackingEntity();
      const result = repository['toCreateModel'](entity);
      
      expect(result).toEqual({
        id: entity.getId().getValue(),
        signerId: entity.getSignerId().getValue(),
        envelopeId: entity.getEnvelopeId().getValue(),
        lastReminderAt: entity.getLastReminderAt(),
        reminderCount: entity.getReminderCount(),
        lastReminderMessage: entity.getLastReminderMessage(),
        createdAt: entity.getCreatedAt(),
        updatedAt: entity.getUpdatedAt(),
      });
    });
  });

  describe('toUpdateModel', () => {
    it('supports partial entity getters', () => {
      const partial = partialTrackingEntity({ reminderCount: 5 });
      const result = repository['toUpdateModel'](partial);
      
      expect(result.reminderCount).toBe(5);
    });

    it('supports DTO and nullables', () => {
      const dto = trackingDto({ lastReminderMessage: null });
      const result = repository['toUpdateModel'](dto);
      
      expect(result.lastReminderMessage).toBeNull();
    });

    it('ignores undefined', () => {
      const partial = { reminderCount: undefined };
      const result = repository['toUpdateModel'](partial);
      
      expect(result).toEqual({});
    });

    it('prefers getters over DTO fields', () => {
      const partial = {
        getReminderCount: () => 5,
        reminderCount: 3,
      };
      const result = repository['toUpdateModel'](partial);
      
      expect(result.reminderCount).toBe(5);
    });

    it('handles getters that return undefined', () => {
      const partial = {
        getReminderCount: () => undefined,
        getLastReminderMessage: () => undefined,
      };
      const result = repository['toUpdateModel'](partial);
      
      expect(result).toEqual({});
    });
  });

  describe('whereById', () => {
    it('builds where by id', () => {
      const id = trackingVO().id();
      const result = repository['whereById'](id);
      
      expect(result).toEqual({ id: id.getValue() });
    });
  });

  describe('whereFromSpec', () => {
    it('unwraps and applies filters with AND logic', () => {
      const spec = trackingSpec({
        signerId: 'signer-123',
        envelopeId: 'envelope-456',
        minReminderCount: 1,
      });
      const where = repository['whereFromSpec'](spec);
      
      expect(where.AND).toContainEqual({ signerId: 'signer-123' });
      expect(where.AND).toContainEqual({ envelopeId: 'envelope-456' });
      expect(where.AND).toContainEqual({ reminderCount: { gte: 1 } });
    });

    it('tolerates undefined/null', () => {
      const spec = trackingSpec({
        signerId: undefined,
        envelopeId: null,
        minReminderCount: undefined,
      });
      const where = repository['whereFromSpec'](spec);
      
      expect(where.AND).toBeUndefined();
    });

    it('returns empty object when no filters', () => {
      const spec = trackingSpec({});
      const where = repository['whereFromSpec'](spec);
      
      expect(where).toEqual({});
    });

    it('handles date ranges', () => {
      const spec = trackingSpec({
        createdBefore: new Date('2024-12-31'),
        createdAfter: new Date('2024-01-01'),
        updatedBefore: new Date('2024-12-31'),
        updatedAfter: new Date('2024-01-01'),
      });
      const where = repository['whereFromSpec'](spec);
      
      expect(where.AND).toBeDefined();
      expect(Array.isArray(where.AND)).toBe(true);
      expect((where.AND as any[]).length).toBeGreaterThan(0);
    });

    it('handles reminder count ranges', () => {
      const spec = trackingSpec({
        minReminderCount: 1,
        maxReminderCount: 5,
      });
      const where = repository['whereFromSpec'](spec);
      
      expect(where.AND).toContainEqual({ reminderCount: { gte: 1 } });
      expect(where.AND).toContainEqual({ reminderCount: { lte: 5 } });
    });
  });

  describe('toDomain', () => {
    it('maps persistence data to domain entity', () => {
      const row = trackingPersistenceRow();
      const result = repository['toDomain'](row);
      
      expect(result).toBeInstanceOf(SignerReminderTracking);
      expect(result.getId().getValue()).toBe(row.id);
      expect(result.getSignerId().getValue()).toBe(row.signerId);
      expect(result.getEnvelopeId().getValue()).toBe(row.envelopeId);
    });

    it('throws repository error on invalid data', () => {
      const invalidData = { id: 'invalid' };
      
      expect(() => repository['toDomain'](invalidData)).toThrow();
    });
  });

  describe('toModel', () => {
    it('maps domain entity to Prisma model', () => {
      const entity = trackingEntity();
      const result = repository['toModel'](entity);
      
      expect(result).toEqual({
        id: entity.getId().getValue(),
        signerId: entity.getSignerId().getValue(),
        envelopeId: entity.getEnvelopeId().getValue(),
        lastReminderAt: entity.getLastReminderAt(),
        reminderCount: entity.getReminderCount(),
        lastReminderMessage: entity.getLastReminderMessage() ?? undefined,
        createdAt: entity.getCreatedAt(),
        updatedAt: entity.getUpdatedAt()
      });
    });

    it('throws error when entity lacks getId method', () => {
      const invalidEntity = {} as any;
      
      expect(() => repository['toModel'](invalidEntity)).toThrow('Entity must have getId method');
    });
  });
});

describe('SignerReminderTrackingRepository - CRUD Operations', () => {
  let repository: SignerReminderTrackingRepository;
  let prismaMock: { signerReminderTracking: PrismaModelMock };
  let trackingOps: PrismaModelMock;

  beforeEach(async () => {
    const { prisma, signerReminderTracking } = createSignerReminderTrackingPrismaMock();
    prismaMock = prisma as unknown as { signerReminderTracking: PrismaModelMock };
    trackingOps = signerReminderTracking;
    repository = new SignerReminderTrackingRepository(prismaMock as any);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('finds tracking by ID', async () => {
      const id = TestUtils.generateReminderTrackingId();
      const row = trackingPersistenceRow({ id: id.getValue() });
      
      trackingOps.findUnique.mockResolvedValueOnce(row);
      
      const result = await repository.findById(id);
      
      expect(trackingOps.findUnique).toHaveBeenCalledWith({
        where: { id: id.getValue() }
      });
      expect(result).toBeInstanceOf(SignerReminderTracking);
      expect(result?.getId().getValue()).toBe(id.getValue());
    });

    it('returns null when not found', async () => {
      const id = TestUtils.generateReminderTrackingId();
      
      trackingOps.findUnique.mockResolvedValueOnce(null);
      
      const result = await repository.findById(id);
      
      expect(result).toBeNull();
    });

    it('throws repository error on database error', async () => {
      const id = TestUtils.generateReminderTrackingId();
      
      trackingOps.findUnique.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(repository.findById(id)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates new tracking', async () => {
      const entity = trackingEntity();
      const row = trackingPersistenceRow({ id: entity.getId().getValue() });
      
      trackingOps.create.mockResolvedValueOnce(row);
      
      const result = await repository.create(entity);
      
      expect(trackingOps.create).toHaveBeenCalledWith({
        data: repository['toCreateModel'](entity)
      });
      expect(result).toBeInstanceOf(SignerReminderTracking);
    });

    it('throws repository error on database error', async () => {
      const entity = trackingEntity();
      
      trackingOps.create.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(repository.create(entity)).rejects.toThrow();
    });

    it('supports transaction', async () => {
      const entity = trackingEntity();
      const row = trackingPersistenceRow({ id: entity.getId().getValue() });
      const txMock = createSingleModelTransactionMock(trackingOps, 'signerReminderTracking');
      
      trackingOps.create.mockResolvedValueOnce(row);
      
      await repository.create(entity, txMock);
      
      expect(trackingOps.create).toHaveBeenCalledWith({
        data: repository['toCreateModel'](entity)
      });
    });
  });

  describe('update', () => {
    it('updates existing tracking', async () => {
      const id = TestUtils.generateReminderTrackingId();
      const patch = partialTrackingEntity({ reminderCount: 5 });
      const row = trackingPersistenceRow({ id: id.getValue(), reminderCount: 5 });
      
      trackingOps.update.mockResolvedValueOnce(row);
      
      const result = await repository.update(id, patch);
      
      expect(trackingOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: expect.objectContaining({
          reminderCount: 5,
          updatedAt: expect.any(Date)
        })
      });
      expect(result).toBeInstanceOf(SignerReminderTracking);
    });

    it('throws repository error on database error', async () => {
      const id = TestUtils.generateReminderTrackingId();
      const patch = partialTrackingEntity();
      
      trackingOps.update.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(repository.update(id, patch)).rejects.toThrow();
    });

    it('supports transaction', async () => {
      const id = TestUtils.generateReminderTrackingId();
      const patch = partialTrackingEntity();
      const row = trackingPersistenceRow({ id: id.getValue() });
      const txMock = createSingleModelTransactionMock(trackingOps, 'signerReminderTracking');
      
      trackingOps.update.mockResolvedValueOnce(row);
      
      await repository.update(id, patch, txMock);
      
      expect(trackingOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: expect.objectContaining({
          updatedAt: expect.any(Date)
        })
      });
    });
  });

  describe('delete', () => {
    it('deletes tracking by ID', async () => {
      const id = TestUtils.generateReminderTrackingId();
      
      trackingOps.delete.mockResolvedValueOnce(undefined);
      
      await repository.delete(id);
      
      expect(trackingOps.delete).toHaveBeenCalledWith({
        where: { id: id.getValue() }
      });
    });

    it('throws repository error on database error', async () => {
      const id = TestUtils.generateReminderTrackingId();
      
      trackingOps.delete.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(repository.delete(id)).rejects.toThrow();
    });

    it('supports transaction', async () => {
      const id = TestUtils.generateReminderTrackingId();
      const txMock = createSingleModelTransactionMock(trackingOps, 'signerReminderTracking');
      
      trackingOps.delete.mockResolvedValueOnce(undefined);
      
      await repository.delete(id, txMock);
      
      expect(trackingOps.delete).toHaveBeenCalledWith({
        where: { id: id.getValue() }
      });
    });
  });

  describe('list', () => {
    it('list without cursor', async () => {
      const spec = trackingSpec();
      const rows = [trackingPersistenceRow()];
      mockListPage.mockResolvedValueOnce({ rows, nextCursor: 'next-cursor' });
      const spy = jest.spyOn(SignerReminderTracking, 'fromPersistence').mockReturnValue({} as any);
      
      const result = await repository.list(spec);
      
      expect(mockListPage).toHaveBeenCalledWith(
        trackingOps,
        expect.any(Object),
        20,
        undefined,
        expect.any(Object)
      );
      expect(result.items).toEqual([{}]);
      expect(result.nextCursor).toBe('next-cursor');
      spy.mockRestore();
    });

    it('list with cursor', async () => {
      const spec = trackingSpec();
      const cursor = 'cursor-123';
      const decoded = { createdAt: '2024-01-01T00:00:00Z', id: 'tracking-123' };
      mockDecodeCursor.mockReturnValueOnce(decoded);
      mockListPage.mockResolvedValueOnce({ rows: [], nextCursor: undefined });
      
      await repository.list(spec, 10, cursor);
      
      expect(mockDecodeCursor).toHaveBeenCalledWith(cursor);
      expect(mockListPage).toHaveBeenCalledWith(
        trackingOps,
        expect.any(Object),
        10,
        decoded,
        expect.any(Object)
      );
    });

    it('list with cursor containing string date', async () => {
      const spec = trackingSpec();
      const cursor = 'cursor-123';
      const decoded = { createdAt: '2024-01-01T00:00:00Z', id: 'tracking-123' };
      mockDecodeCursor.mockReturnValueOnce(decoded);
      mockListPage.mockResolvedValueOnce({ rows: [], nextCursor: undefined });
      
      await repository.list(spec, 10, cursor);
      
      expect(mockDecodeCursor).toHaveBeenCalledWith(cursor);
      expect(mockListPage).toHaveBeenCalledWith(
        trackingOps,
        expect.any(Object),
        10,
        decoded,
        expect.any(Object)
      );
    });

    it('list with cursor containing non-Date createdAt', async () => {
      const spec = trackingSpec();
      const cursor = 'cursor-123';
      const decoded = { createdAt: '2024-01-01T00:00:00Z', id: 'tracking-123' };
      mockDecodeCursor.mockReturnValueOnce(decoded);
      mockListPage.mockResolvedValueOnce({ rows: [], nextCursor: undefined });
      
      await repository.list(spec, 10, cursor);
      
      expect(mockDecodeCursor).toHaveBeenCalledWith(cursor);
      expect(mockListPage).toHaveBeenCalledWith(
        trackingOps,
        expect.any(Object),
        10,
        decoded,
        expect.any(Object)
      );
    });

    it('list with cursor containing Date object', async () => {
      const spec = trackingSpec();
      const cursor = 'cursor-123';
      const decoded = { createdAt: new Date('2024-01-01T00:00:00Z'), id: 'tracking-123' };
      mockDecodeCursor.mockReturnValueOnce(decoded);
      mockListPage.mockResolvedValueOnce({ rows: [], nextCursor: undefined });
      
      await repository.list(spec, 10, cursor);
      
      expect(mockDecodeCursor).toHaveBeenCalledWith(cursor);
      expect(mockListPage).toHaveBeenCalledWith(
        trackingOps,
        expect.any(Object),
        10,
        decoded,
        expect.any(Object)
      );
    });

    it('list with cursor containing string date to test normalizeCursor', async () => {
      const spec = trackingSpec();
      const cursor = 'cursor-123';
      const decoded = { createdAt: '2024-01-01T00:00:00Z', id: 'tracking-123' };
      mockDecodeCursor.mockReturnValueOnce(decoded);
      mockListPage.mockResolvedValueOnce({ rows: [], nextCursor: undefined });
      
      await repository.list(spec, 10, cursor);
      
      expect(mockDecodeCursor).toHaveBeenCalledWith(cursor);
      expect(mockListPage).toHaveBeenCalledWith(
        trackingOps,
        expect.any(Object),
        10,
        decoded,
        expect.any(Object)
      );
    });

    it('throws repository error on database error', async () => {
      const spec = trackingSpec();
      
      mockListPage.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(repository.list(spec)).rejects.toThrow();
    });
  });
});

describe('SignerReminderTrackingRepository - Business Methods', () => {
  let repository: SignerReminderTrackingRepository;
  let prismaMock: { signerReminderTracking: PrismaModelMock };
  let trackingOps: PrismaModelMock;

  beforeEach(async () => {
    const { prisma, signerReminderTracking } = createSignerReminderTrackingPrismaMock();
    prismaMock = prisma as unknown as { signerReminderTracking: PrismaModelMock };
    trackingOps = signerReminderTracking;
    repository = new SignerReminderTrackingRepository(prismaMock as any);
    jest.clearAllMocks();
  });

  describe('findBySignerAndEnvelope', () => {
    it('finds tracking by signer and envelope', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const row = trackingPersistenceRow({
        signerId: signerId.getValue(),
        envelopeId: envelopeId.getValue(),
      });
      
      trackingOps.findUnique.mockResolvedValueOnce(row);
      
      const result = await repository.findBySignerAndEnvelope(signerId, envelopeId);
      
      expect(trackingOps.findUnique).toHaveBeenCalledWith({
        where: {
          signerId_envelopeId: {
            signerId: signerId.getValue(),
            envelopeId: envelopeId.getValue(),
          }
        }
      });
      expect(result).toBeInstanceOf(SignerReminderTracking);
    });

    it('returns null when not found', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      
      trackingOps.findUnique.mockResolvedValueOnce(null);
      
      const result = await repository.findBySignerAndEnvelope(signerId, envelopeId);
      
      expect(result).toBeNull();
    });

    it('throws repository error on database error', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      
      trackingOps.findUnique.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(repository.findBySignerAndEnvelope(signerId, envelopeId)).rejects.toThrow();
    });

    it('supports transaction', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const row = trackingPersistenceRow();
      const txMock = createSingleModelTransactionMock(trackingOps, 'signerReminderTracking');
      
      trackingOps.findUnique.mockResolvedValueOnce(row);
      
      await repository.findBySignerAndEnvelope(signerId, envelopeId, txMock);
      
      expect(trackingOps.findUnique).toHaveBeenCalledWith({
        where: {
          signerId_envelopeId: {
            signerId: signerId.getValue(),
            envelopeId: envelopeId.getValue(),
          }
        }
      });
    });
  });

  describe('findByEnvelope', () => {
    it('finds tracking records by envelope', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const rows = [
        trackingPersistenceRow({ envelopeId: envelopeId.getValue() }),
        trackingPersistenceRow({ envelopeId: envelopeId.getValue() }),
      ];
      
      trackingOps.findMany.mockResolvedValueOnce(rows);
      
      const result = await repository.findByEnvelope(envelopeId);
      
      expect(trackingOps.findMany).toHaveBeenCalledWith({
        where: { envelopeId: envelopeId.getValue() },
        orderBy: { createdAt: 'desc' }
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(SignerReminderTracking);
    });

    it('returns empty array when no records found', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      
      trackingOps.findMany.mockResolvedValueOnce([]);
      
      const result = await repository.findByEnvelope(envelopeId);
      
      expect(result).toHaveLength(0);
    });

    it('throws repository error on database error', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      
      trackingOps.findMany.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(repository.findByEnvelope(envelopeId)).rejects.toThrow();
    });

    it('supports transaction', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const rows = [trackingPersistenceRow()];
      const txMock = createSingleModelTransactionMock(trackingOps, 'signerReminderTracking');
      
      trackingOps.findMany.mockResolvedValueOnce(rows);
      
      await repository.findByEnvelope(envelopeId, txMock);
      
      expect(trackingOps.findMany).toHaveBeenCalledWith({
        where: { envelopeId: envelopeId.getValue() },
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('upsert', () => {
    it('creates new tracking when not exists', async () => {
      const entity = trackingEntity();
      const row = trackingPersistenceRow({ id: entity.getId().getValue() });
      
      trackingOps.upsert.mockResolvedValueOnce(row);
      
      const result = await repository.upsert(entity);
      
      expect(trackingOps.upsert).toHaveBeenCalledWith({
        where: {
          signerId_envelopeId: {
            signerId: entity.getSignerId().getValue(),
            envelopeId: entity.getEnvelopeId().getValue(),
          }
        },
        create: repository['toCreateModel'](entity),
        update: repository['toUpdateModel'](entity)
      });
      expect(result).toBeInstanceOf(SignerReminderTracking);
    });

    it('updates existing tracking when exists', async () => {
      const entity = trackingEntity();
      const row = trackingPersistenceRow({ id: entity.getId().getValue() });
      
      trackingOps.upsert.mockResolvedValueOnce(row);
      
      const result = await repository.upsert(entity);
      
      expect(trackingOps.upsert).toHaveBeenCalledWith({
        where: {
          signerId_envelopeId: {
            signerId: entity.getSignerId().getValue(),
            envelopeId: entity.getEnvelopeId().getValue(),
          }
        },
        create: repository['toCreateModel'](entity),
        update: repository['toUpdateModel'](entity)
      });
      expect(result).toBeInstanceOf(SignerReminderTracking);
    });

    it('throws repository error on database error', async () => {
      const entity = trackingEntity();
      
      trackingOps.upsert.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(repository.upsert(entity)).rejects.toThrow();
    });

    it('supports transaction', async () => {
      const entity = trackingEntity();
      const row = trackingPersistenceRow({ id: entity.getId().getValue() });
      const txMock = createSingleModelTransactionMock(trackingOps, 'signerReminderTracking');
      
      trackingOps.upsert.mockResolvedValueOnce(row);
      
      await repository.upsert(entity, txMock);
      
      expect(trackingOps.upsert).toHaveBeenCalledWith({
        where: {
          signerId_envelopeId: {
            signerId: entity.getSignerId().getValue(),
            envelopeId: entity.getEnvelopeId().getValue(),
          }
        },
        create: repository['toCreateModel'](entity),
        update: repository['toUpdateModel'](entity)
      });
    });
  });
});
