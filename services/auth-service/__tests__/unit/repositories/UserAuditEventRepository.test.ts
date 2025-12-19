/**
 * @fileoverview UserAuditEventRepository Tests - Comprehensive unit tests for UserAuditEventRepository
 * @summary Tests all repository methods with full coverage including edge cases
 * @description This test suite provides comprehensive coverage of UserAuditEventRepository including
 * CRUD operations, business queries, error handling, and cursor pagination functionality.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Setup cursor pagination mocks BEFORE importing the repository
import { setupCursorPaginationMocks } from '../../helpers/mocks/cursorPagination';
const { mockListPage } = setupCursorPaginationMocks();

// Import AFTER the mock is set up
import { UserAuditAction as PrismaUserAuditAction } from '@prisma/client';
import { UserAuditEventRepository } from '../../../src/repositories/UserAuditEventRepository';
import { UserAuditEvent } from '../../../src/domain/entities/UserAuditEvent';
import { UserAuditEventId } from '../../../src/domain/value-objects/UserAuditEventId';
import { UserAuditAction } from '../../../src/domain/enums/UserAuditAction';
import { TestUtils } from '../../helpers/testUtils';
import {
  createUserAuditEventPrismaMock,
  PrismaModelMock,
} from '../../helpers/mocks/prisma';
import {
  userAuditEventPersistenceRow,
  userAuditEventEntity,
  userAuditEventSpec,
  partialUserAuditEventEntity,
} from '../../helpers/builders/userAuditEvent';

describe('UserAuditEventRepository - Internal Methods', () => {
  let repository: UserAuditEventRepository;
  let prismaMock: { userAuditEvent: PrismaModelMock };

  beforeEach(() => {
    const mock = createUserAuditEventPrismaMock();
    prismaMock = mock.prisma;
    
    repository = new UserAuditEventRepository(prismaMock as any);
    jest.clearAllMocks();
  });

  describe('toCreateModel', () => {
    it('maps entity to Prisma create input', () => {
      const entity = userAuditEventEntity();
      const result = repository['toCreateModel'](entity);
      
      expect(result).toMatchObject({
        id: entity.getId(),
        userId: entity.getUserId().toString(),
        action: entity.getAction(),
      });
    });

    it('handles null optional fields', () => {
      const entity = userAuditEventEntity({
        description: undefined,
        actorId: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        metadata: undefined,
      });
      const result = repository['toCreateModel'](entity);
      
      expect(result.description).toBeNull();
      expect(result.actorId).toBeNull();
      expect(result.ipAddress).toBeNull();
      expect(result.userAgent).toBeNull();
      expect(result.metadata).toBeNull();
    });
  });

  describe('toUpdateModel', () => {
    it('supports partial entity getters', () => {
      const partial = partialUserAuditEventEntity({
        getDescription: () => 'Updated description',
        getAction: () => UserAuditAction.PROFILE_UPDATED,
      });
      const out = repository['toUpdateModel'](partial);
      expect(out.description).toBe('Updated description');
      expect(out.action).toBe(UserAuditAction.PROFILE_UPDATED);
    });

    it('ignores undefined', () => {
      const out = repository['toUpdateModel']({ description: undefined });
      expect(out).toEqual({});
    });
  });

  describe('whereById', () => {
    it('builds where by id', () => {
      const id = UserAuditEventId.fromString(TestUtils.generateUuid());
      const where = repository['whereById'](id);
      expect(where).toEqual({ id: id.getValue() });
    });
  });

  describe('whereFromSpec', () => {
    it('applies filters with AND logic', () => {
      const spec = userAuditEventSpec({
        userId: 'user-123',
        action: PrismaUserAuditAction.USER_REGISTERED,
        actorId: 'actor-123',
      });
      const where = repository['whereFromSpec'](spec);
      
      expect(where).toHaveProperty('AND');
      if (where.AND && Array.isArray(where.AND)) {
        expect(where.AND.length).toBeGreaterThan(0);
      }
    });

    it('handles text search filters', () => {
      const spec = userAuditEventSpec({
        description: 'test description',
        userAgent: 'Mozilla',
      });
      const where = repository['whereFromSpec'](spec);
      
      expect(where).toHaveProperty('AND');
    });

    it('handles date range filters', () => {
      const createdAfter = new Date('2024-01-01');
      const createdBefore = new Date('2024-01-31');
      const spec = userAuditEventSpec({ createdAfter, createdBefore });
      const where = repository['whereFromSpec'](spec);
      
      expect(where).toHaveProperty('AND');
    });
  });
});

describe('UserAuditEventRepository - Public Methods', () => {
  let repository: UserAuditEventRepository;
  let prismaMock: { userAuditEvent: PrismaModelMock };
  let auditEventOps: PrismaModelMock;

  beforeEach(() => {
    const mock = createUserAuditEventPrismaMock();
    prismaMock = mock.prisma;
    auditEventOps = mock.userAuditEvent;
    
    repository = new UserAuditEventRepository(prismaMock as any);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('returns entity when found', async () => {
      const row = userAuditEventPersistenceRow();
      auditEventOps.findUnique.mockResolvedValueOnce(row);
      const entity = userAuditEventEntity({ id: row.id });
      jest.spyOn(UserAuditEvent, 'fromPersistence').mockReturnValue(entity);
      
      const id = UserAuditEventId.fromString(row.id);
      const result = await repository.findById(id);
      
      expect(result).toEqual(entity);
    });

    it('returns null when not found', async () => {
      auditEventOps.findUnique.mockResolvedValueOnce(null);
      
      const id = UserAuditEventId.fromString(TestUtils.generateUuid());
      const result = await repository.findById(id);
      
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates entity successfully', async () => {
      const entity = userAuditEventEntity();
      const row = userAuditEventPersistenceRow({ id: entity.getId() });
      auditEventOps.create.mockResolvedValueOnce(row);
      jest.spyOn(UserAuditEvent, 'fromPersistence').mockReturnValue(entity);
      
      const result = await repository.create(entity);
      
      expect(result).toEqual(entity);
    });
  });

  describe('update', () => {
    it('updates entity successfully', async () => {
      const id = UserAuditEventId.fromString(TestUtils.generateUuid());
      const partial = partialUserAuditEventEntity();
      const row = userAuditEventPersistenceRow({ id: id.getValue() });
      const entity = userAuditEventEntity({ id: id.getValue() });
      auditEventOps.update.mockResolvedValueOnce(row);
      jest.spyOn(UserAuditEvent, 'fromPersistence').mockReturnValue(entity);
      
      const result = await repository.update(id, partial);
      
      expect(result).toEqual(entity);
    });
  });

  describe('delete', () => {
    it('deletes entity successfully', async () => {
      const id = UserAuditEventId.fromString(TestUtils.generateUuid());
      auditEventOps.delete.mockResolvedValueOnce({});
      
      await repository.delete(id);
      
      expect(auditEventOps.delete).toHaveBeenCalledWith({
        where: { id: id.getValue() }
      });
    });
  });

  describe('list', () => {
    it('lists entities with cursor pagination', async () => {
      const spec = userAuditEventSpec();
      const rows = [userAuditEventPersistenceRow(), userAuditEventPersistenceRow()];
      mockListPage.mockResolvedValueOnce({ rows, nextCursor: 'cursor-123' });
      
      const entities = rows.map((r) => userAuditEventEntity({ id: r.id }));
      jest.spyOn(UserAuditEvent, 'fromPersistence')
        .mockReturnValueOnce(entities[0])
        .mockReturnValueOnce(entities[1]);
      
      const result = await repository.list(spec, 25);
      
      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe('cursor-123');
    });
  });

  describe('findByUserId', () => {
    it('finds audit events by user ID', async () => {
      const userId = TestUtils.generateUuid();
      const rows = [userAuditEventPersistenceRow({ userId })];
      mockListPage.mockResolvedValueOnce({ rows, nextCursor: undefined });
      const entities = rows.map((r) => userAuditEventEntity({ id: r.id }));
      jest.spyOn(UserAuditEvent, 'fromPersistence').mockReturnValueOnce(entities[0]);
      
      const result = await repository.findByUserId(userId, 25);
      
      expect(result.items).toHaveLength(1);
    });
  });

  describe('findByAction', () => {
    it('finds audit events by action', async () => {
      const action = PrismaUserAuditAction.USER_REGISTERED;
      const rows = [userAuditEventPersistenceRow({ action })];
      mockListPage.mockResolvedValueOnce({ rows, nextCursor: undefined });
      const entities = rows.map((r) => userAuditEventEntity({ id: r.id }));
      jest.spyOn(UserAuditEvent, 'fromPersistence').mockReturnValueOnce(entities[0]);
      
      const result = await repository.findByAction(action, 25);
      
      expect(result.items).toHaveLength(1);
    });
  });

  describe('findByDateRange', () => {
    it('finds audit events by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const rows = [userAuditEventPersistenceRow()];
      mockListPage.mockResolvedValueOnce({ rows, nextCursor: undefined });
      const entities = rows.map((r) => userAuditEventEntity({ id: r.id }));
      jest.spyOn(UserAuditEvent, 'fromPersistence').mockReturnValueOnce(entities[0]);
      
      const result = await repository.findByDateRange(startDate, endDate, 25);
      
      expect(result.items).toHaveLength(1);
    });
  });

  describe('countByUserId', () => {
    it('counts audit events by user ID', async () => {
      const userId = TestUtils.generateUuid();
      auditEventOps.count.mockResolvedValueOnce(5);
      
      const result = await repository.countByUserId(userId);
      
      expect(result).toBe(5);
      expect(auditEventOps.count).toHaveBeenCalledWith({
        where: { userId }
      });
    });
  });

  describe('countBySpec', () => {
    it('counts audit events by specification', async () => {
      const spec = userAuditEventSpec();
      auditEventOps.count.mockResolvedValueOnce(3);
      
      const result = await repository.countBySpec(spec);
      
      expect(result).toBe(3);
    });
  });

  describe('toDomain error handling', () => {
    it('throws repository error when fromPersistence fails', () => {
      const row = userAuditEventPersistenceRow();
      jest.spyOn(UserAuditEvent, 'fromPersistence').mockImplementation(() => {
        throw new Error('Invalid data');
      });

      expect(() => repository['toDomain'](row)).toThrow();
    });
  });

  describe('error handling', () => {
    it('throws repository error when findById fails', async () => {
      const id = UserAuditEventId.fromString(TestUtils.generateUuid());
      const error = new Error('Database error');
      auditEventOps.findUnique.mockRejectedValueOnce(error);

      await expect(repository.findById(id)).rejects.toThrow();
    });

    it('throws repository error when create fails', async () => {
      const entity = userAuditEventEntity();
      const error = new Error('Database error');
      auditEventOps.create.mockRejectedValueOnce(error);

      await expect(repository.create(entity)).rejects.toThrow();
    });

    it('throws repository error when update fails', async () => {
      const id = UserAuditEventId.fromString(TestUtils.generateUuid());
      const partial = partialUserAuditEventEntity();
      const error = new Error('Database error');
      auditEventOps.update.mockRejectedValueOnce(error);

      await expect(repository.update(id, partial)).rejects.toThrow();
    });

    it('throws repository error when delete fails', async () => {
      const id = UserAuditEventId.fromString(TestUtils.generateUuid());
      const error = new Error('Database error');
      auditEventOps.delete.mockRejectedValueOnce(error);

      await expect(repository.delete(id)).rejects.toThrow();
    });

    it('throws repository error when countByUserId fails', async () => {
      const userId = TestUtils.generateUuid();
      const error = new Error('Database error');
      auditEventOps.count.mockRejectedValueOnce(error);

      await expect(repository.countByUserId(userId)).rejects.toThrow();
    });

    it('throws repository error when countBySpec fails', async () => {
      const spec = userAuditEventSpec();
      const error = new Error('Database error');
      auditEventOps.count.mockRejectedValueOnce(error);

      await expect(repository.countBySpec(spec)).rejects.toThrow();
    });
  });
});

