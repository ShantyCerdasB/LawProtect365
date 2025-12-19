/**
 * @fileoverview OAuthAccountRepository Tests - Comprehensive unit tests for OAuthAccountRepository
 * @summary Tests all repository methods with full coverage including edge cases
 * @description This test suite provides comprehensive coverage of OAuthAccountRepository including
 * CRUD operations, business queries, error handling, and cursor pagination functionality.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Setup cursor pagination mocks BEFORE importing the repository
import { setupCursorPaginationMocks } from '../../helpers/mocks/cursorPagination';
const { mockListPage } = setupCursorPaginationMocks();

// Import AFTER the mock is set up
import { OAuthProvider as PrismaOAuthProvider } from '@prisma/client';
import { OAuthAccountRepository } from '../../../src/repositories/OAuthAccountRepository';
import { OAuthAccount } from '../../../src/domain/entities/OAuthAccount';
import { OAuthAccountId } from '../../../src/domain/value-objects/OAuthAccountId';
import { OAuthProvider } from '../../../src/domain/enums/OAuthProvider';
import { TestUtils } from '../../helpers/testUtils';
import {
  createOAuthAccountPrismaMock,
  PrismaModelMock,
} from '../../helpers/mocks/prisma';
import {
  oauthAccountPersistenceRow,
  oauthAccountEntity,
  oauthAccountSpec,
  partialOAuthAccountEntity,
} from '../../helpers/builders/oauthAccount';

describe('OAuthAccountRepository - Internal Methods', () => {
  let repository: OAuthAccountRepository;
  let prismaMock: { oAuthAccount: PrismaModelMock };

  beforeEach(() => {
    const mock = createOAuthAccountPrismaMock();
    prismaMock = mock.prisma;
    
    repository = new OAuthAccountRepository(prismaMock as any);
    jest.clearAllMocks();
  });

  describe('toCreateModel', () => {
    it('maps entity to Prisma create input', () => {
      const entity = oauthAccountEntity();
      const result = repository['toCreateModel'](entity);
      
      expect(result).toMatchObject({
        id: entity.getId(),
        userId: entity.getUserId().toString(),
        provider: entity.getProvider(),
        providerAccountId: entity.getProviderId(),
      });
    });
  });

  describe('toUpdateModel', () => {
    it('supports partial entity getters', () => {
      const partial = partialOAuthAccountEntity({
        getUserId: () => oauthAccountEntity().getUserId(),
        getProvider: () => OAuthProvider.GOOGLE,
        getProviderId: () => 'new-provider-id',
      });
      const out = repository['toUpdateModel'](partial);
      expect(out.providerAccountId).toBe('new-provider-id');
    });

    it('ignores undefined', () => {
      const out = repository['toUpdateModel']({ provider: undefined });
      expect(out).toEqual({});
    });
  });

  describe('whereById', () => {
    it('builds where by id', () => {
      const id = OAuthAccountId.fromString(TestUtils.generateUuid());
      const where = repository['whereById'](id);
      expect(where).toEqual({ id: id.getValue() });
    });
  });

  describe('whereFromSpec', () => {
    it('unwraps and applies filters with AND logic', () => {
      const spec = oauthAccountSpec({
        userId: 'user-123',
        provider: PrismaOAuthProvider.GOOGLE,
        providerAccountId: 'provider-account-123',
      });
      const where = repository['whereFromSpec'](spec);
      
      expect(where).toHaveProperty('AND');
      if (where.AND && Array.isArray(where.AND)) {
        expect(where.AND.length).toBeGreaterThan(0);
        expect(where.AND).toContainEqual({ userId: 'user-123' });
        expect(where.AND).toContainEqual({ provider: PrismaOAuthProvider.GOOGLE });
      }
    });

    it('handles date range filters', () => {
      const createdAfter = new Date('2024-01-01');
      const createdBefore = new Date('2024-01-31');
      const spec = oauthAccountSpec({ createdAfter, createdBefore });
      const where = repository['whereFromSpec'](spec);
      
      expect(where).toHaveProperty('AND');
      expect(where.AND).toContainEqual({
        createdAt: {
          gte: createdAfter,
          lte: createdBefore
        }
      });
    });

    it('returns empty object when no filters', () => {
      const where = repository['whereFromSpec']({});
      expect(where).toEqual({});
    });
  });

  describe('toDomain', () => {
    it('wraps domain mapping errors', () => {
      const row = oauthAccountPersistenceRow({ id: 'invalid' });
      const spy = jest.spyOn(OAuthAccount, 'fromPersistence').mockImplementation(() => {
        throw new Error('Invalid data');
      });
      expect(() => repository['toDomain'](row)).toThrow();
      spy.mockRestore();
    });
  });
});

describe('OAuthAccountRepository - Public Methods', () => {
  let repository: OAuthAccountRepository;
  let prismaMock: { oAuthAccount: PrismaModelMock };
  let oauthAccountOps: PrismaModelMock;

  beforeEach(() => {
    const mock = createOAuthAccountPrismaMock();
    prismaMock = mock.prisma;
    oauthAccountOps = mock.oAuthAccount;
    
    repository = new OAuthAccountRepository(prismaMock as any);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('returns entity when found', async () => {
      const row = oauthAccountPersistenceRow();
      oauthAccountOps.findUnique.mockResolvedValueOnce(row);
      const entity = oauthAccountEntity();
      const spy = jest.spyOn(OAuthAccount, 'fromPersistence').mockReturnValue(entity);
      
      const id = OAuthAccountId.fromString(row.id);
      const result = await repository.findById(id);
      
      expect(oauthAccountOps.findUnique).toHaveBeenCalledWith({
        where: { id: row.id }
      });
      expect(result).toEqual(entity);
      spy.mockRestore();
    });

    it('returns null when not found', async () => {
      oauthAccountOps.findUnique.mockResolvedValueOnce(null);
      
      const id = OAuthAccountId.fromString(TestUtils.generateUuid());
      const result = await repository.findById(id);
      
      expect(result).toBeNull();
    });

    it('throws repository error on database error', async () => {
      const error = new Error('Database error');
      oauthAccountOps.findUnique.mockRejectedValueOnce(error);
      
      const id = OAuthAccountId.fromString(TestUtils.generateUuid());
      
      await expect(repository.findById(id)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates entity successfully', async () => {
      const entity = oauthAccountEntity();
      const row = oauthAccountPersistenceRow({ id: entity.getId() });
      oauthAccountOps.create.mockResolvedValueOnce(row);
      const spy = jest.spyOn(OAuthAccount, 'fromPersistence').mockReturnValue(entity);
      
      const result = await repository.create(entity);
      
      expect(oauthAccountOps.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: entity.getId(),
          userId: entity.getUserId().toString(),
        })
      });
      expect(result).toEqual(entity);
      spy.mockRestore();
    });

    it('throws repository error on create failure', async () => {
      const entity = oauthAccountEntity();
      const error = new Error('Create failed');
      oauthAccountOps.create.mockRejectedValueOnce(error);
      
      await expect(repository.create(entity)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('updates entity successfully', async () => {
      const id = OAuthAccountId.fromString(TestUtils.generateUuid());
      const partial = partialOAuthAccountEntity();
      const row = oauthAccountPersistenceRow({ id: id.getValue() });
      const entity = oauthAccountEntity({ id: id.getValue() });
      oauthAccountOps.update.mockResolvedValueOnce(row);
      const spy = jest.spyOn(OAuthAccount, 'fromPersistence').mockReturnValue(entity);
      
      const result = await repository.update(id, partial);
      
      expect(oauthAccountOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: expect.any(Object)
      });
      expect(result).toEqual(entity);
      spy.mockRestore();
    });

    it('throws repository error on update failure', async () => {
      const id = OAuthAccountId.fromString(TestUtils.generateUuid());
      const partial = partialOAuthAccountEntity();
      const error = new Error('Update failed');
      oauthAccountOps.update.mockRejectedValueOnce(error);
      
      await expect(repository.update(id, partial)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes entity successfully', async () => {
      const id = OAuthAccountId.fromString(TestUtils.generateUuid());
      oauthAccountOps.delete.mockResolvedValueOnce({});
      
      await repository.delete(id);
      
      expect(oauthAccountOps.delete).toHaveBeenCalledWith({
        where: { id: id.getValue() }
      });
    });

    it('throws repository error on delete failure', async () => {
      const id = OAuthAccountId.fromString(TestUtils.generateUuid());
      const error = new Error('Delete failed');
      oauthAccountOps.delete.mockRejectedValueOnce(error);
      
      await expect(repository.delete(id)).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('lists entities with cursor pagination', async () => {
      const spec = oauthAccountSpec();
      const rows = [oauthAccountPersistenceRow(), oauthAccountPersistenceRow()];
      mockListPage.mockResolvedValueOnce({ rows, nextCursor: 'cursor-123' });
      
      const entities = rows.map((r) => oauthAccountEntity({ id: r.id }));
      jest.spyOn(OAuthAccount, 'fromPersistence')
        .mockReturnValueOnce(entities[0])
        .mockReturnValueOnce(entities[1]);
      
      const result = await repository.list(spec, 25);
      
      expect(mockListPage).toHaveBeenCalled();
      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe('cursor-123');
    });

    it('handles empty list', async () => {
      const spec = oauthAccountSpec();
      mockListPage.mockResolvedValueOnce({ rows: [], nextCursor: undefined });
      
      const result = await repository.list(spec, 25);
      
      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeUndefined();
    });
  });

  describe('upsert', () => {
    it('upserts OAuth account successfully', async () => {
      const userId = TestUtils.generateUuid();
      const provider = OAuthProvider.GOOGLE;
      const providerAccountId = 'provider-account-123';
      const row = oauthAccountPersistenceRow({
        userId,
        provider: PrismaOAuthProvider.GOOGLE,
        providerAccountId
      });
      const entity = oauthAccountEntity();
      oauthAccountOps.upsert.mockResolvedValueOnce(row);
      jest.spyOn(OAuthAccount, 'fromPersistence').mockReturnValue(entity);
      
      const result = await repository.upsert(userId, provider, providerAccountId);
      
      expect(oauthAccountOps.upsert).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: PrismaOAuthProvider.GOOGLE,
            providerAccountId
          }
        },
        update: expect.any(Object),
        create: expect.any(Object)
      });
      expect(result).toEqual(entity);
    });

    it('throws repository error on upsert failure', async () => {
      const userId = TestUtils.generateUuid();
      const provider = OAuthProvider.GOOGLE;
      const providerAccountId = 'provider-account-123';
      const error = new Error('Upsert failed');
      oauthAccountOps.upsert.mockRejectedValueOnce(error);
      
      await expect(repository.upsert(userId, provider, providerAccountId)).rejects.toThrow();
    });
  });

  describe('listByUserId', () => {
    it('lists OAuth accounts by user ID', async () => {
      const userId = TestUtils.generateUuid();
      const rows = [oauthAccountPersistenceRow({ userId }), oauthAccountPersistenceRow({ userId })];
      oauthAccountOps.findMany.mockResolvedValueOnce(rows);
      const entities = rows.map((r) => oauthAccountEntity({ id: r.id }));
      jest.spyOn(OAuthAccount, 'fromPersistence')
        .mockReturnValueOnce(entities[0])
        .mockReturnValueOnce(entities[1]);
      
      const result = await repository.listByUserId(userId);
      
      expect(oauthAccountOps.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      });
      expect(result).toHaveLength(2);
    });

    it('throws repository error on failure', async () => {
      const userId = TestUtils.generateUuid();
      const error = new Error('List failed');
      oauthAccountOps.findMany.mockRejectedValueOnce(error);
      
      await expect(repository.listByUserId(userId)).rejects.toThrow();
    });
  });

  describe('findByProviderAndAccountId', () => {
    it('finds OAuth account by provider and account ID', async () => {
      const provider = OAuthProvider.GOOGLE;
      const providerAccountId = 'provider-account-123';
      const row = oauthAccountPersistenceRow({
        provider: PrismaOAuthProvider.GOOGLE,
        providerAccountId
      });
      const entity = oauthAccountEntity();
      oauthAccountOps.findUnique.mockResolvedValueOnce(row);
      jest.spyOn(OAuthAccount, 'fromPersistence').mockReturnValue(entity);
      
      const result = await repository.findByProviderAndAccountId(provider, providerAccountId);
      
      expect(oauthAccountOps.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: PrismaOAuthProvider.GOOGLE,
            providerAccountId
          }
        }
      });
      expect(result).toEqual(entity);
    });

    it('returns null when not found', async () => {
      const provider = OAuthProvider.GOOGLE;
      const providerAccountId = 'provider-account-123';
      oauthAccountOps.findUnique.mockResolvedValueOnce(null);
      
      const result = await repository.findByProviderAndAccountId(provider, providerAccountId);
      
      expect(result).toBeNull();
    });

    it('throws repository error on failure', async () => {
      const provider = OAuthProvider.GOOGLE;
      const providerAccountId = 'provider-account-123';
      const error = new Error('Find failed');
      oauthAccountOps.findUnique.mockRejectedValueOnce(error);
      
      await expect(repository.findByProviderAndAccountId(provider, providerAccountId)).rejects.toThrow();
    });
  });

  describe('unlink', () => {
    it('unlinks OAuth account successfully', async () => {
      const userId = TestUtils.generateUuid();
      const provider = OAuthProvider.GOOGLE;
      const providerAccountId = 'provider-account-123';
      const row = oauthAccountPersistenceRow({
        userId,
        provider: PrismaOAuthProvider.GOOGLE,
        providerAccountId
      });
      const entity = oauthAccountEntity();
      oauthAccountOps.findFirst.mockResolvedValueOnce(row);
      oauthAccountOps.delete.mockResolvedValueOnce({});
      jest.spyOn(OAuthAccount, 'fromPersistence').mockReturnValue(entity);
      
      const result = await repository.unlink(userId, provider, providerAccountId);
      
      expect(oauthAccountOps.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          provider: PrismaOAuthProvider.GOOGLE,
          providerAccountId
        }
      });
      expect(result).toEqual(entity);
    });

    it('returns null when account not found', async () => {
      const userId = TestUtils.generateUuid();
      const provider = OAuthProvider.GOOGLE;
      const providerAccountId = 'provider-account-123';
      oauthAccountOps.findFirst.mockResolvedValueOnce(null);
      
      const result = await repository.unlink(userId, provider, providerAccountId);
      
      expect(result).toBeNull();
    });

    it('throws repository error on failure', async () => {
      const userId = TestUtils.generateUuid();
      const provider = OAuthProvider.GOOGLE;
      const providerAccountId = 'provider-account-123';
      const error = new Error('Unlink failed');
      oauthAccountOps.findFirst.mockRejectedValueOnce(error);
      
      await expect(repository.unlink(userId, provider, providerAccountId)).rejects.toThrow();
    });
  });
});

