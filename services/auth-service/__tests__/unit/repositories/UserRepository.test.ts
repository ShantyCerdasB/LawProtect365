/**
 * @fileoverview UserRepository Tests - Comprehensive unit tests for UserRepository
 * @summary Tests all repository methods with full coverage including edge cases
 * @description This test suite provides comprehensive coverage of UserRepository including
 * CRUD operations, business queries, error handling, and cursor pagination functionality.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Setup cursor pagination mocks BEFORE importing the repository
import { setupCursorPaginationMocks } from '../../helpers/mocks/cursorPagination';
const { mockListPage } = setupCursorPaginationMocks();

// Import AFTER the mock is set up
import { UserAccountStatus as PrismaUserAccountStatus } from '@prisma/client';
import { UserRepository } from '../../../src/repositories/UserRepository';
import { User } from '../../../src/domain/entities/User';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { UserRole, UserAccountStatus, AdminIncludeField } from '../../../src/domain/enums';
import { TestUtils } from '../../helpers/testUtils';
import {
  createUserPrismaMock,
  PrismaModelMock,
} from '../../helpers/mocks/prisma';
import {
  userPersistenceRow,
  userEntity,
  userSpec,
  partialUserEntity,
} from '../../helpers/builders/user';

describe('UserRepository - Internal Methods', () => {
  let repository: UserRepository;
  let prismaMock: { user: PrismaModelMock };

  beforeEach(() => {
    const mock = createUserPrismaMock();
    prismaMock = mock.prisma;
    
    repository = new UserRepository(prismaMock as any);
    jest.clearAllMocks();
  });

  describe('toCreateModel', () => {
    it('maps entity to Prisma create input', () => {
      const entity = userEntity();
      const result = repository['toCreateModel'](entity);
      
      expect(result).toMatchObject({
        id: entity.getId().toString(),
        cognitoSub: entity.getCognitoSub().toString(),
        email: entity.getEmail().toString(),
        givenName: entity.getFirstName(),
        lastName: entity.getLastName(),
        role: entity.getRole(),
        status: entity.getStatus(),
        mfaEnabled: entity.isMfaEnabled(),
      });
    });
  });

  describe('toUpdateModel', () => {
    it('supports partial entity getters', () => {
      const partial = partialUserEntity({
        getStatus: () => UserAccountStatus.SUSPENDED,
        getFullName: () => 'Jane Doe',
      });
      const out = repository['toUpdateModel'](partial);
      expect(out.status).toBe(UserAccountStatus.SUSPENDED);
      expect(out.name).toBe('Jane Doe');
    });

    it('ignores undefined', () => {
      const out = repository['toUpdateModel']({ firstName: undefined });
      expect(out).toEqual({});
    });
  });

  describe('whereById', () => {
    it('builds where by id', () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      const where = repository['whereById'](id);
      expect(where).toEqual({ id: id.toString() });
    });
  });

  describe('whereFromSpec', () => {
    it('applies filters with AND logic', () => {
      const spec = userSpec({
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE,
      });
      const where = repository['whereFromSpec'](spec);
      
      expect(where).toHaveProperty('AND');
    });

    it('handles text search', () => {
      const spec = userSpec({ search: 'john' });
      const where = repository['whereFromSpec'](spec);
      
      expect(where).toHaveProperty('AND');
    });

    it('handles date range filters', () => {
      const createdAfter = new Date('2024-01-01');
      const createdBefore = new Date('2024-01-31');
      const spec = userSpec({ createdAfter, createdBefore });
      const where = repository['whereFromSpec'](spec);
      
      expect(where).toHaveProperty('AND');
    });
  });
});

describe('UserRepository - Public Methods', () => {
  let repository: UserRepository;
  let prismaMock: { user: PrismaModelMock };
  let userOps: PrismaModelMock;

  beforeEach(() => {
    const mock = createUserPrismaMock();
    prismaMock = mock.prisma;
    userOps = mock.user;
    
    repository = new UserRepository(prismaMock as any);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('returns entity when found', async () => {
      const row = userPersistenceRow();
      userOps.findUnique.mockResolvedValueOnce(row);
      const entity = userEntity({ id: UserId.fromString(row.id) });
      jest.spyOn(User, 'fromPersistence').mockReturnValue(entity);
      
      const id = UserId.fromString(row.id);
      const result = await repository.findById(id);
      
      expect(result).toEqual(entity);
    });

    it('returns null when not found', async () => {
      userOps.findUnique.mockResolvedValueOnce(null);
      
      const id = UserId.fromString(TestUtils.generateUuid());
      const result = await repository.findById(id);
      
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates entity successfully', async () => {
      const entity = userEntity();
      const row = userPersistenceRow({ id: entity.getId().toString() });
      userOps.create.mockResolvedValueOnce(row);
      jest.spyOn(User, 'fromPersistence').mockReturnValue(entity);
      
      const result = await repository.create(entity);
      
      expect(result).toEqual(entity);
    });
  });

  describe('update', () => {
    it('updates entity successfully', async () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      const partial = partialUserEntity();
      const row = userPersistenceRow({ id: id.toString() });
      const entity = userEntity({ id });
      userOps.update.mockResolvedValueOnce(row);
      jest.spyOn(User, 'fromPersistence').mockReturnValue(entity);
      
      const result = await repository.update(id, partial);
      
      expect(result).toEqual(entity);
    });
  });

  describe('delete', () => {
    it('soft deletes entity', async () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      userOps.update.mockResolvedValueOnce({});
      
      await repository.delete(id);
      
      expect(userOps.update).toHaveBeenCalledWith({
        where: { id: id.toString() },
        data: expect.objectContaining({
          status: PrismaUserAccountStatus.DELETED,
        })
      });
    });
  });

  describe('list', () => {
    it('lists entities with cursor pagination', async () => {
      const spec = userSpec();
      const rows = [userPersistenceRow(), userPersistenceRow()];
      mockListPage.mockResolvedValueOnce({ rows, nextCursor: 'cursor-123' });
      
      const entities = rows.map((r) => userEntity({ id: UserId.fromString(r.id) }));
      jest.spyOn(User, 'fromPersistence')
        .mockReturnValueOnce(entities[0])
        .mockReturnValueOnce(entities[1]);
      
      const result = await repository.list(spec, 25);
      
      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe('cursor-123');
    });
  });

  describe('findByCognitoSub', () => {
    it('finds user by Cognito sub', async () => {
      const cognitoSub = TestUtils.generateCognitoSub();
      const row = userPersistenceRow({ cognitoSub });
      const entity = userEntity();
      userOps.findUnique.mockResolvedValueOnce(row);
      jest.spyOn(User, 'fromPersistence').mockReturnValue(entity);
      
      const result = await repository.findByCognitoSub(cognitoSub);
      
      expect(result).toEqual(entity);
      expect(userOps.findUnique).toHaveBeenCalledWith({
        where: { cognitoSub }
      });
    });

    it('returns null when not found', async () => {
      const cognitoSub = TestUtils.generateCognitoSub();
      userOps.findUnique.mockResolvedValueOnce(null);
      
      const result = await repository.findByCognitoSub(cognitoSub);
      
      expect(result).toBeNull();
    });
  });

  describe('findByCognitoSubLight', () => {
    it('finds user by Cognito sub with minimal data', async () => {
      const cognitoSub = TestUtils.generateCognitoSub();
      const row = userPersistenceRow({ cognitoSub });
      const entity = userEntity();
      userOps.findUnique.mockResolvedValueOnce(row);
      jest.spyOn(User, 'fromPersistence').mockReturnValue(entity);
      
      const result = await repository.findByCognitoSubLight(cognitoSub);
      
      expect(result).toEqual(entity);
      expect(userOps.findUnique).toHaveBeenCalledWith({
        where: { cognitoSub },
        select: expect.any(Object)
      });
    });
  });

  describe('findByEmail', () => {
    it('finds users by email', async () => {
      const email = TestUtils.createTestEmail();
      const rows = [userPersistenceRow({ email })];
      mockListPage.mockResolvedValueOnce({ rows, nextCursor: undefined });
      const entities = rows.map((r) => userEntity({ id: UserId.fromString(r.id) }));
      jest.spyOn(User, 'fromPersistence').mockReturnValueOnce(entities[0]);
      
      const result = await repository.findByEmail(email, 25);
      
      expect(result.items).toHaveLength(1);
    });
  });

  describe('toDomain error handling', () => {
    it('throws repository error when fromPersistence fails', () => {
      const row = userPersistenceRow();
      jest.spyOn(User, 'fromPersistence').mockImplementation(() => {
        throw new Error('Invalid data');
      });

      expect(() => repository['toDomain'](row)).toThrow();
    });
  });

  describe('error handling', () => {
    it('throws repository error when findById fails', async () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      const error = new Error('Database error');
      userOps.findUnique.mockRejectedValueOnce(error);

      await expect(repository.findById(id)).rejects.toThrow();
    });

    it('throws repository error when create fails', async () => {
      const entity = userEntity();
      const error = new Error('Database error');
      userOps.create.mockRejectedValueOnce(error);

      await expect(repository.create(entity)).rejects.toThrow();
    });

    it('throws repository error when update fails', async () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      const partial = partialUserEntity();
      const error = new Error('Database error');
      userOps.update.mockRejectedValueOnce(error);

      await expect(repository.update(id, partial)).rejects.toThrow();
    });

    it('throws repository error when delete fails', async () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      const error = new Error('Database error');
      userOps.update.mockRejectedValueOnce(error);

      await expect(repository.delete(id)).rejects.toThrow();
    });

    it('throws repository error when findByCognitoSub fails', async () => {
      const cognitoSub = TestUtils.generateCognitoSub();
      const error = new Error('Database error');
      userOps.findUnique.mockRejectedValueOnce(error);

      await expect(repository.findByCognitoSub(cognitoSub)).rejects.toThrow();
    });

    it('throws repository error when findByCognitoSubLight fails', async () => {
      const cognitoSub = TestUtils.generateCognitoSub();
      const error = new Error('Database error');
      userOps.findUnique.mockRejectedValueOnce(error);

      await expect(repository.findByCognitoSubLight(cognitoSub)).rejects.toThrow();
    });
  });

  describe('updateStatus', () => {
    it('updates user status successfully', async () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      const status = UserAccountStatus.SUSPENDED;
      const row = userPersistenceRow({ id: id.toString(), status: PrismaUserAccountStatus.SUSPENDED });
      const entity = userEntity({ id, status });
      userOps.update.mockResolvedValueOnce(row);
      jest.spyOn(User, 'fromPersistence').mockReturnValue(entity);

      const result = await repository.updateStatus(id, status);

      expect(result).toEqual(entity);
      expect(userOps.update).toHaveBeenCalledWith({
        where: { id: id.toString() },
        data: expect.objectContaining({
          status: PrismaUserAccountStatus.SUSPENDED,
          updatedAt: expect.any(Date)
        })
      });
    });

    it('throws repository error on failure', async () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      const status = UserAccountStatus.SUSPENDED;
      const error = new Error('Update failed');
      userOps.update.mockRejectedValueOnce(error);

      await expect(repository.updateStatus(id, status)).rejects.toThrow();
    });
  });

  describe('updateRole', () => {
    it('updates user role successfully', async () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      const role = UserRole.LAWYER;
      const row = userPersistenceRow({ id: id.toString() });
      const entity = userEntity({ id, role });
      userOps.update.mockResolvedValueOnce(row);
      jest.spyOn(User, 'fromPersistence').mockReturnValue(entity);

      const result = await repository.updateRole(id, role);

      expect(result).toEqual(entity);
      expect(userOps.update).toHaveBeenCalledWith({
        where: { id: id.toString() },
        data: expect.objectContaining({
          role: role as any,
          updatedAt: expect.any(Date)
        })
      });
    });

    it('throws repository error on failure', async () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      const role = UserRole.LAWYER;
      const error = new Error('Update failed');
      userOps.update.mockRejectedValueOnce(error);

      await expect(repository.updateRole(id, role)).rejects.toThrow();
    });
  });

  describe('countBySpec', () => {
    it('counts users by specification', async () => {
      const spec = userSpec({ role: UserRole.CUSTOMER });
      userOps.count.mockResolvedValueOnce(5);

      const result = await repository.countBySpec(spec);

      expect(result).toBe(5);
    });

    it('throws repository error on failure', async () => {
      const spec = userSpec();
      const error = new Error('Count failed');
      userOps.count.mockRejectedValueOnce(error);

      await expect(repository.countBySpec(spec)).rejects.toThrow();
    });
  });

  describe('findByRole', () => {
    it('finds users by role', async () => {
      const role = UserRole.CUSTOMER;
      const rows = [userPersistenceRow()];
      mockListPage.mockResolvedValueOnce({ rows, nextCursor: undefined });
      const entities = rows.map((r) => userEntity({ id: UserId.fromString(r.id) }));
      jest.spyOn(User, 'fromPersistence').mockReturnValueOnce(entities[0]);

      const result = await repository.findByRole(role as any, 25);

      expect(result.items).toHaveLength(1);
    });
  });

  describe('findByStatus', () => {
    it('finds users by status', async () => {
      const status = UserAccountStatus.ACTIVE;
      const rows = [userPersistenceRow()];
      mockListPage.mockResolvedValueOnce({ rows, nextCursor: undefined });
      const entities = rows.map((r) => userEntity({ id: UserId.fromString(r.id) }));
      jest.spyOn(User, 'fromPersistence').mockReturnValueOnce(entities[0]);

      const result = await repository.findByStatus(status as any, 25);

      expect(result.items).toHaveLength(1);
    });
  });

  describe('updateProfile', () => {
    it('updates profile with name', async () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id });
      const updatedUser = userEntity({ id, firstName: 'Jane', lastName: 'Doe' });
      const row = userPersistenceRow({ id: id.toString() });
      jest.spyOn(repository, 'findById').mockResolvedValue(user);
      jest.spyOn(repository, 'update').mockResolvedValue(updatedUser);
      userOps.update.mockResolvedValueOnce(row);
      jest.spyOn(User, 'fromPersistence').mockReturnValue(updatedUser);

      const result = await repository.updateProfile(id, { name: 'Jane Doe' });

      expect(result).toEqual(updatedUser);
    });

    it('updates profile with givenName and lastName', async () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id });
      const updatedUser = userEntity({ id, firstName: 'Jane', lastName: 'Doe' });
      const row = userPersistenceRow({ id: id.toString() });
      jest.spyOn(repository, 'findById').mockResolvedValue(user);
      jest.spyOn(repository, 'update').mockResolvedValue(updatedUser);
      userOps.update.mockResolvedValueOnce(row);
      jest.spyOn(User, 'fromPersistence').mockReturnValue(updatedUser);

      const result = await repository.updateProfile(id, { givenName: 'Jane', lastName: 'Doe' });

      expect(result).toEqual(updatedUser);
    });

    it('throws repository error when user not found', async () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(repository.updateProfile(id, { givenName: 'Jane' })).rejects.toThrow();
    });

    it('throws repository error on failure', async () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      const error = new Error('Update failed');
      jest.spyOn(repository, 'findById').mockRejectedValue(error);

      await expect(repository.updateProfile(id, { givenName: 'Jane' })).rejects.toThrow();
    });
  });

  describe('listForAdmin', () => {
    it('returns paginated admin users with default query', async () => {
      const query = {};
      const viewerRole = UserRole.CUSTOMER;
      const users = [userPersistenceRow(), userPersistenceRow()];
      
      prismaMock.user.findMany.mockResolvedValue(users as any);
      prismaMock.user.count.mockResolvedValue(2);

      const result = await repository.listForAdmin(query, viewerRole);

      expect(result.items).toHaveLength(2);
      expect(result.pageInfo.limit).toBe(25);
      expect(result.summary.count).toBe(2);
    });

    it('applies text search filter', async () => {
      const query = { q: 'test@example.com' };
      const viewerRole = UserRole.CUSTOMER;
      const users = [userPersistenceRow({ email: 'test@example.com' })];
      
      prismaMock.user.findMany.mockResolvedValue(users as any);
      prismaMock.user.count.mockResolvedValue(1);

      await repository.listForAdmin(query, viewerRole);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ email: expect.anything() })
            ])
          })
        })
      );
    });

    it('applies role filter', async () => {
      const query = { role: [UserRole.CUSTOMER] };
      const viewerRole = UserRole.CUSTOMER;
      const users = [userPersistenceRow()];
      
      prismaMock.user.findMany.mockResolvedValue(users as any);
      prismaMock.user.count.mockResolvedValue(1);

      await repository.listForAdmin(query, viewerRole);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: { in: [UserRole.CUSTOMER] }
          })
        })
      );
    });

    it('applies status filter', async () => {
      const query = { status: [UserAccountStatus.ACTIVE] };
      const viewerRole = UserRole.CUSTOMER;
      const users = [userPersistenceRow()];
      
      prismaMock.user.findMany.mockResolvedValue(users as any);
      prismaMock.user.count.mockResolvedValue(1);

      await repository.listForAdmin(query, viewerRole);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [UserAccountStatus.ACTIVE] }
          })
        })
      );
    });

    it('excludes deleted users by default', async () => {
      const query = {};
      const viewerRole = UserRole.CUSTOMER;
      const users = [userPersistenceRow()];
      
      prismaMock.user.findMany.mockResolvedValue(users as any);
      prismaMock.user.count.mockResolvedValue(1);

      await repository.listForAdmin(query, viewerRole);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { not: UserAccountStatus.DELETED }
          })
        })
      );
    });

    it('applies MFA filter', async () => {
      const query = { mfa: 'enabled' as const };
      const viewerRole = UserRole.CUSTOMER;
      const users = [userPersistenceRow()];
      
      prismaMock.user.findMany.mockResolvedValue(users as any);
      prismaMock.user.count.mockResolvedValue(1);

      await repository.listForAdmin(query, viewerRole);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            mfaEnabled: true
          })
        })
      );
    });

    it('applies date range filters', async () => {
      const query = {
        createdFrom: '2024-01-01T00:00:00Z',
        createdTo: '2024-12-31T23:59:59Z'
      };
      const viewerRole = UserRole.CUSTOMER;
      const users = [userPersistenceRow()];
      
      prismaMock.user.findMany.mockResolvedValue(users as any);
      prismaMock.user.count.mockResolvedValue(1);

      await repository.listForAdmin(query, viewerRole);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date)
            })
          })
        })
      );
    });

    it('handles cursor pagination', async () => {
      const query = { cursor: 'cursor-123', limit: 10 };
      const viewerRole = UserRole.CUSTOMER;
      const users = [userPersistenceRow()];
      
      prismaMock.user.findMany.mockResolvedValue(users as any);
      prismaMock.user.count.mockResolvedValue(1);

      await repository.listForAdmin(query, viewerRole);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 1,
          cursor: { id: 'cursor-123' },
          take: 10
        })
      );
    });

    it('includes OAuth accounts when requested', async () => {
      const query = { include: [AdminIncludeField.IDP] };
      const viewerRole = UserRole.CUSTOMER;
      const users = [userPersistenceRow()];
      
      prismaMock.user.findMany.mockResolvedValue(users as any);
      prismaMock.user.count.mockResolvedValue(1);

      await repository.listForAdmin(query, viewerRole);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            oauthAccounts: true
          })
        })
      );
    });

    it('throws repository error on failure', async () => {
      const query = {};
      const viewerRole = UserRole.CUSTOMER;
      prismaMock.user.findMany.mockRejectedValue(new Error('Database error'));

      await expect(repository.listForAdmin(query, viewerRole)).rejects.toThrow();
    });
  });

  describe('buildAdminWhereClause', () => {
    it('restricts super admin visibility for non-super admin viewers', () => {
      const query = {};
      const viewerRole = UserRole.CUSTOMER;
      const where = repository['buildAdminWhereClause'](query, viewerRole);

      expect(where.role).toEqual({
        in: expect.not.arrayContaining([UserRole.SUPER_ADMIN])
      });
    });

    it('allows all roles for super admin viewer', () => {
      const query = {};
      const viewerRole = UserRole.SUPER_ADMIN;
      const where = repository['buildAdminWhereClause'](query, viewerRole);

      expect(where.role).toEqual({
        in: expect.arrayContaining([UserRole.SUPER_ADMIN])
      });
    });

    it('applies provider filter', () => {
      const query = { provider: ['GOOGLE' as any] };
      const viewerRole = UserRole.CUSTOMER;
      const where = repository['buildAdminWhereClause'](query, viewerRole);

      expect(where.oauthAccounts).toEqual({
        some: {
          provider: { in: ['GOOGLE'] }
        }
      });
    });
  });

  describe('buildAdminOrderBy', () => {
    it('uses default sort when not specified', () => {
      const query = {};
      const orderBy = repository['buildAdminOrderBy'](query);

      expect(orderBy.createdAt).toBe('desc');
      expect(orderBy.id).toBe('asc');
    });

    it('applies custom sort field and direction', () => {
      const query = { sortBy: 'email' as any, sortDir: 'asc' as any };
      const orderBy = repository['buildAdminOrderBy'](query);

      expect(orderBy.email).toBe('asc');
      expect(orderBy.id).toBe('asc');
    });
  });

  describe('findByIdWithIncludes', () => {
    it('returns user with includes', async () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      const userRow = userPersistenceRow({ id: id.toString() });
      prismaMock.user.findUnique.mockResolvedValue(userRow as any);

      const result = await repository.findByIdWithIncludes(id, [AdminIncludeField.IDP]);

      expect(result).toBeDefined();
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: id.toString() },
          include: { oauthAccounts: true }
        })
      );
    });

    it('returns null when user not found', async () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByIdWithIncludes(id);

      expect(result).toBeNull();
    });

    it('excludes OAuth accounts when not requested', async () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      const userRow = userPersistenceRow({ id: id.toString() });
      prismaMock.user.findUnique.mockResolvedValue(userRow as any);

      await repository.findByIdWithIncludes(id, []);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { oauthAccounts: false }
        })
      );
    });

    it('throws repository error on failure', async () => {
      const id = UserId.fromString(TestUtils.generateUuid());
      prismaMock.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(repository.findByIdWithIncludes(id)).rejects.toThrow();
    });
  });

  describe('mapToAdminUserItem', () => {
    it('maps user without personal info', () => {
      const userRow = userPersistenceRow();
      const mapped = repository['mapToAdminUserItem'](userRow as any);

      expect(mapped).toMatchObject({
        id: userRow.id,
        email: userRow.email,
        role: userRow.role,
        status: userRow.status
      });
      expect(mapped.personalInfo).toBeUndefined();
    });

    it('maps user with personal info', () => {
      const userRow = userPersistenceRow();
      const userWithPersonalInfo = {
        ...userRow,
        personalInfo: {
          phone: '+1234567890',
          locale: 'en-US',
          timeZone: 'America/New_York'
        }
      };
      const mapped = repository['mapToAdminUserItem'](userWithPersonalInfo as any);

      expect(mapped.personalInfo).toEqual({
        phone: '+1234567890',
        locale: 'en-US',
        timeZone: 'America/New_York'
      });
    });

    it('maps user with OAuth accounts', () => {
      const userRow = userPersistenceRow();
      const createdAt = new Date('2024-01-01');
      const userWithOAuth = {
        ...userRow,
        oauthAccounts: [
          { provider: 'GOOGLE', createdAt },
          { provider: 'MICROSOFT', createdAt }
        ]
      };
      const mapped = repository['mapToAdminUserItem'](userWithOAuth as any);

      expect(mapped.providers).toHaveLength(2);
      expect(mapped.providers?.[0]).toMatchObject({
        provider: 'GOOGLE',
        linkedAt: createdAt.toISOString()
      });
    });

    it('handles null dates correctly', () => {
      const userRow = userPersistenceRow();
      const userWithNulls = {
        ...userRow,
        lastLoginAt: null,
        suspendedUntil: null
      };
      const mapped = repository['mapToAdminUserItem'](userWithNulls as any);

      expect(mapped.lastLoginAt).toBeNull();
      expect(mapped.suspendedUntil).toBeNull();
    });
  });
});

