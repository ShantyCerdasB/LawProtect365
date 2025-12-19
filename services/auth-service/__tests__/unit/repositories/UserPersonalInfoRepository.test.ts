/**
 * @fileoverview UserPersonalInfoRepository Tests - Comprehensive unit tests for UserPersonalInfoRepository
 * @summary Tests all repository methods with full coverage including edge cases
 * @description This test suite provides comprehensive coverage of UserPersonalInfoRepository including
 * CRUD operations, business queries, and error handling.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

import { UserPersonalInfoRepository } from '../../../src/repositories/UserPersonalInfoRepository';
import { UserPersonalInfo } from '../../../src/domain/entities/UserPersonalInfo';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { TestUtils } from '../../helpers/testUtils';
import {
  createUserPersonalInfoPrismaMock,
  PrismaModelMock,
} from '../../helpers/mocks/prisma';
import {
  userPersonalInfoPersistenceRow,
  userPersonalInfoEntity,
} from '../../helpers/builders/userPersonalInfo';

describe('UserPersonalInfoRepository - Internal Methods', () => {
  let repository: UserPersonalInfoRepository;
  let prismaMock: { userPersonalInfo: PrismaModelMock };

  beforeEach(() => {
    const mock = createUserPersonalInfoPrismaMock();
    prismaMock = mock.prisma;
    
    repository = new UserPersonalInfoRepository(prismaMock as any);
    jest.clearAllMocks();
  });

  describe('toCreateModel', () => {
    it('maps entity to persistence model', () => {
      const entity = userPersonalInfoEntity();
      const result = repository['toCreateModel'](entity);
      
      expect(result).toMatchObject({
        id: entity.getId(),
        userId: entity.getUserId().toString(),
        phone: entity.getPhone(),
        locale: entity.getLocale(),
        timeZone: entity.getTimeZone(),
      });
    });
  });

  describe('toUpdateModel', () => {
    it('maps entity to persistence model', () => {
      const entity = userPersonalInfoEntity();
      const result = repository['toUpdateModel'](entity);
      
      expect(result).toMatchObject({
        id: entity.getId(),
        userId: entity.getUserId().toString(),
      });
    });
  });

  describe('whereById', () => {
    it('builds where by id', () => {
      const id = TestUtils.generateUuid();
      const where = repository['whereById'](id);
      expect(where).toEqual({ id });
    });
  });

  describe('whereFromSpec', () => {
    it('returns spec as is', () => {
      const spec = { userId: TestUtils.generateUuid() };
      const where = repository['whereFromSpec'](spec);
      expect(where).toEqual(spec);
    });
  });
});

describe('UserPersonalInfoRepository - Public Methods', () => {
  let repository: UserPersonalInfoRepository;
  let prismaMock: { userPersonalInfo: PrismaModelMock };
  let personalInfoOps: PrismaModelMock;

  beforeEach(() => {
    const mock = createUserPersonalInfoPrismaMock();
    prismaMock = mock.prisma;
    personalInfoOps = mock.userPersonalInfo;
    
    repository = new UserPersonalInfoRepository(prismaMock as any);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('returns entity when found', async () => {
      const row = userPersonalInfoPersistenceRow();
      personalInfoOps.findUnique.mockResolvedValueOnce(row);
      const entity = userPersonalInfoEntity({ id: row.id });
      jest.spyOn(UserPersonalInfo, 'fromPersistence').mockReturnValue(entity);
      
      const result = await repository.findById(row.id);
      
      expect(result).toEqual(entity);
    });

    it('returns null when not found', async () => {
      personalInfoOps.findUnique.mockResolvedValueOnce(null);
      
      const id = TestUtils.generateUuid();
      const result = await repository.findById(id);
      
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates entity successfully', async () => {
      const entity = userPersonalInfoEntity();
      const row = userPersonalInfoPersistenceRow({ id: entity.getId() });
      personalInfoOps.create.mockResolvedValueOnce(row);
      jest.spyOn(UserPersonalInfo, 'fromPersistence').mockReturnValue(entity);
      
      const result = await repository.create(entity);
      
      expect(result).toEqual(entity);
    });
  });

  describe('update', () => {
    it('updates entity successfully', async () => {
      const id = TestUtils.generateUuid();
      const entity = userPersonalInfoEntity({ id });
      const row = userPersonalInfoPersistenceRow({ id });
      personalInfoOps.update.mockResolvedValueOnce(row);
      jest.spyOn(UserPersonalInfo, 'fromPersistence').mockReturnValue(entity);
      
      const result = await repository.update(id, entity);
      
      expect(result).toEqual(entity);
    });
  });

  describe('delete', () => {
    it('deletes entity successfully', async () => {
      const id = TestUtils.generateUuid();
      personalInfoOps.delete.mockResolvedValueOnce({});
      
      await repository.delete(id);
      
      expect(personalInfoOps.delete).toHaveBeenCalledWith({
        where: { id }
      });
    });
  });

  describe('findByUserId', () => {
    it('finds personal info by user ID', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const row = userPersonalInfoPersistenceRow({ userId: userId.toString() });
      const entity = userPersonalInfoEntity({ userId });
      personalInfoOps.findFirst.mockResolvedValueOnce(row);
      jest.spyOn(UserPersonalInfo, 'fromPersistence').mockReturnValue(entity);
      
      const result = await repository.findByUserId(userId);
      
      expect(result).toEqual(entity);
      expect(personalInfoOps.findFirst).toHaveBeenCalledWith({
        where: { userId: userId.toString() }
      });
    });

    it('returns null when not found', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      personalInfoOps.findFirst.mockResolvedValueOnce(null);
      
      const result = await repository.findByUserId(userId);
      
      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    it('upserts personal info successfully', async () => {
      const entity = userPersonalInfoEntity();
      const row = userPersonalInfoPersistenceRow({ id: entity.getId() });
      personalInfoOps.upsert.mockResolvedValueOnce(row);
      jest.spyOn(UserPersonalInfo, 'fromPersistence').mockReturnValue(entity);
      
      const result = await repository.upsert(entity);
      
      expect(result).toEqual(entity);
      expect(personalInfoOps.upsert).toHaveBeenCalledWith({
        where: { userId: entity.getUserId().toString() },
        update: expect.any(Object),
        create: expect.any(Object)
      });
    });
  });

  describe('deleteByUserId', () => {
    it('deletes personal info by user ID', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const mock = createUserPersonalInfoPrismaMock();
      const personalInfoOps = mock.userPersonalInfo;
      personalInfoOps.deleteMany.mockResolvedValueOnce({ count: 1 });
      const repo = new UserPersonalInfoRepository(mock.prisma as any);
      
      await repo.deleteByUserId(userId);
      
      expect(personalInfoOps.deleteMany).toHaveBeenCalledWith({
        where: { userId: userId.toString() }
      });
    });
  });

  describe('list', () => {
    it('lists personal infos with cursor pagination', async () => {
      const spec = {};
      const rows = [userPersonalInfoPersistenceRow(), userPersonalInfoPersistenceRow()];
      personalInfoOps.findMany.mockResolvedValueOnce(rows);
      const entities = rows.map((r) => userPersonalInfoEntity({ id: r.id }));
      jest.spyOn(UserPersonalInfo, 'fromPersistence')
        .mockReturnValueOnce(entities[0])
        .mockReturnValueOnce(entities[1]);
      
      const result = await repository.list(spec, 25);
      
      expect(result.items).toHaveLength(2);
    });
  });

  describe('toDomain error handling', () => {
    it('throws repository error when fromPersistence fails', () => {
      const row = userPersonalInfoPersistenceRow();
      jest.spyOn(UserPersonalInfo, 'fromPersistence').mockImplementation(() => {
        throw new Error('Invalid data');
      });

      expect(() => repository['toDomain'](row)).toThrow();
    });
  });

  describe('error handling', () => {
    it('throws repository error when findById fails', async () => {
      const id = TestUtils.generateUuid();
      const error = new Error('Database error');
      personalInfoOps.findUnique.mockRejectedValueOnce(error);

      await expect(repository.findById(id)).rejects.toThrow();
    });

    it('throws repository error when create fails', async () => {
      const entity = userPersonalInfoEntity();
      const error = new Error('Database error');
      personalInfoOps.create.mockRejectedValueOnce(error);

      await expect(repository.create(entity)).rejects.toThrow();
    });

    it('throws repository error when update fails', async () => {
      const id = TestUtils.generateUuid();
      const entity = userPersonalInfoEntity({ id });
      const error = new Error('Database error');
      personalInfoOps.update.mockRejectedValueOnce(error);

      await expect(repository.update(id, entity)).rejects.toThrow();
    });

    it('throws repository error when delete fails', async () => {
      const id = TestUtils.generateUuid();
      const error = new Error('Database error');
      personalInfoOps.delete.mockRejectedValueOnce(error);

      await expect(repository.delete(id)).rejects.toThrow();
    });

    it('throws repository error when findByUserId fails', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const error = new Error('Database error');
      personalInfoOps.findFirst.mockRejectedValueOnce(error);

      await expect(repository.findByUserId(userId)).rejects.toThrow();
    });

    it('throws repository error when deleteByUserId fails', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const error = new Error('Database error');
      personalInfoOps.deleteMany.mockRejectedValueOnce(error);

      await expect(repository.deleteByUserId(userId)).rejects.toThrow();
    });
  });

  describe('upsertByUserId', () => {
    it('updates existing personal info', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const existing = userPersonalInfoEntity({ userId });
      const updated = userPersonalInfoEntity({ userId, phone: '+1234567890' });
      const row = userPersonalInfoPersistenceRow({ id: updated.getId() });
      jest.spyOn(repository, 'findByUserId').mockResolvedValue(existing);
      jest.spyOn(repository, 'update').mockResolvedValue(updated);
      personalInfoOps.update.mockResolvedValueOnce(row);
      jest.spyOn(UserPersonalInfo, 'fromPersistence').mockReturnValue(updated);

      const result = await repository.upsertByUserId(userId, { phone: '+1234567890' });

      expect(result).toEqual(updated);
    });

    it('creates new personal info when not exists', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const newPersonalInfo = userPersonalInfoEntity({ userId, phone: '+1234567890' });
      const row = userPersonalInfoPersistenceRow({ id: newPersonalInfo.getId() });
      jest.spyOn(repository, 'findByUserId').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockResolvedValue(newPersonalInfo);
      personalInfoOps.create.mockResolvedValueOnce(row);
      jest.spyOn(UserPersonalInfo, 'fromPersistence').mockReturnValue(newPersonalInfo);

      const result = await repository.upsertByUserId(userId, { phone: '+1234567890' });

      expect(result).toEqual(newPersonalInfo);
    });

    it('updates locale when provided', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const existing = userPersonalInfoEntity({ userId });
      const updated = userPersonalInfoEntity({ userId, locale: 'es' });
      const row = userPersonalInfoPersistenceRow({ id: updated.getId() });
      jest.spyOn(repository, 'findByUserId').mockResolvedValue(existing);
      jest.spyOn(repository, 'update').mockResolvedValue(updated);
      personalInfoOps.update.mockResolvedValueOnce(row);
      jest.spyOn(UserPersonalInfo, 'fromPersistence').mockReturnValue(updated);

      const result = await repository.upsertByUserId(userId, { locale: 'es' });

      expect(result).toEqual(updated);
    });

    it('updates timeZone when provided', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const existing = userPersonalInfoEntity({ userId });
      const updated = userPersonalInfoEntity({ userId, timeZone: 'America/New_York' });
      const row = userPersonalInfoPersistenceRow({ id: updated.getId() });
      jest.spyOn(repository, 'findByUserId').mockResolvedValue(existing);
      jest.spyOn(repository, 'update').mockResolvedValue(updated);
      personalInfoOps.update.mockResolvedValueOnce(row);
      jest.spyOn(UserPersonalInfo, 'fromPersistence').mockReturnValue(updated);

      const result = await repository.upsertByUserId(userId, { timeZone: 'America/New_York' });

      expect(result).toEqual(updated);
    });

    it('throws repository error on failure', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const error = new Error('Upsert failed');
      jest.spyOn(repository, 'findByUserId').mockRejectedValue(error);

      await expect(repository.upsertByUserId(userId, { phone: '+1234567890' })).rejects.toThrow();
    });
  });
});

