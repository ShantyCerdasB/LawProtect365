/**
 * @fileoverview GetUsersAdminUseCase Tests - Unit tests for GetUsersAdminUseCase
 * @summary Tests for admin user list retrieval use case
 * @description Tests all methods in GetUsersAdminUseCase including query validation, permission checks, and pagination.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GetUsersAdminUseCase } from '../../../../src/application/admin/GetUsersAdminUseCase';
import { UserRepository } from '../../../../src/repositories/UserRepository';
import { Logger } from '@lawprotect/shared-ts';
import { UserRole } from '../../../../src/domain/enums';
import { AdminUserQuery, AdminUserResponse } from '../../../../src/domain/interfaces/admin';
import { AdminVisibilityRules } from '../../../../src/domain/rules/AdminVisibilityRules';

jest.mock('../../../../src/domain/rules/AdminVisibilityRules');

describe('GetUsersAdminUseCase', () => {
  let useCase: GetUsersAdminUseCase;
  let userRepository: jest.Mocked<UserRepository>;
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    userRepository = {
      listForAdmin: jest.fn()
    } as any;

    logger = {
      info: jest.fn(),
      error: jest.fn()
    } as any;

    useCase = new GetUsersAdminUseCase(userRepository, logger);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should retrieve users successfully with valid query', async () => {
      const query: AdminUserQuery = {};
      const mockResult: AdminUserResponse = {
        items: [],
        pageInfo: { limit: 25, nextCursor: null, hasMore: false },
        summary: { count: 0 }
      };

      (AdminVisibilityRules.hasAdminPrivileges as jest.Mock).mockReturnValue(true);
      userRepository.listForAdmin.mockResolvedValue(mockResult);

      const result = await useCase.execute(query, UserRole.ADMIN);

      expect(AdminVisibilityRules.hasAdminPrivileges).toHaveBeenCalledWith(UserRole.ADMIN);
      expect(userRepository.listForAdmin).toHaveBeenCalledWith(query, UserRole.ADMIN);
      expect(result).toEqual(mockResult);
      expect(logger.info).toHaveBeenCalledWith(
        'Executing GetUsersAdminUseCase',
        expect.objectContaining({ viewerRole: UserRole.ADMIN })
      );
    });

    it('should throw error when viewer is not admin', async () => {
      const query: AdminUserQuery = {};

      (AdminVisibilityRules.hasAdminPrivileges as jest.Mock).mockReturnValue(false);

      await expect(useCase.execute(query, UserRole.CUSTOMER)).rejects.toThrow();

      expect(AdminVisibilityRules.hasAdminPrivileges).toHaveBeenCalledWith(UserRole.CUSTOMER);
      expect(userRepository.listForAdmin).not.toHaveBeenCalled();
    });

    it('should throw error when createdFrom is after createdTo', async () => {
      const query: AdminUserQuery = {
        createdFrom: '2024-01-02T00:00:00Z',
        createdTo: '2024-01-01T00:00:00Z'
      };

      (AdminVisibilityRules.hasAdminPrivileges as jest.Mock).mockReturnValue(true);

      await expect(useCase.execute(query, UserRole.ADMIN)).rejects.toThrow();

      expect(userRepository.listForAdmin).not.toHaveBeenCalled();
    });

    it('should throw error when lastLoginFrom is after lastLoginTo', async () => {
      const query: AdminUserQuery = {
        lastLoginFrom: '2024-01-02T00:00:00Z',
        lastLoginTo: '2024-01-01T00:00:00Z'
      };

      (AdminVisibilityRules.hasAdminPrivileges as jest.Mock).mockReturnValue(true);

      await expect(useCase.execute(query, UserRole.ADMIN)).rejects.toThrow();

      expect(userRepository.listForAdmin).not.toHaveBeenCalled();
    });

    it('should throw error when limit is less than 10', async () => {
      const query: AdminUserQuery = { limit: 5 };

      (AdminVisibilityRules.hasAdminPrivileges as jest.Mock).mockReturnValue(true);

      await expect(useCase.execute(query, UserRole.ADMIN)).rejects.toThrow();

      expect(userRepository.listForAdmin).not.toHaveBeenCalled();
    });

    it('should throw error when limit is greater than 200', async () => {
      const query: AdminUserQuery = { limit: 250 };

      (AdminVisibilityRules.hasAdminPrivileges as jest.Mock).mockReturnValue(true);

      await expect(useCase.execute(query, UserRole.ADMIN)).rejects.toThrow();

      expect(userRepository.listForAdmin).not.toHaveBeenCalled();
    });

    it('should throw error when search query is longer than 100 characters', async () => {
      const query: AdminUserQuery = {
        q: 'a'.repeat(101)
      };

      (AdminVisibilityRules.hasAdminPrivileges as jest.Mock).mockReturnValue(true);

      await expect(useCase.execute(query, UserRole.ADMIN)).rejects.toThrow();

      expect(userRepository.listForAdmin).not.toHaveBeenCalled();
    });

    it('should allow valid limit between 10 and 200', async () => {
      const query: AdminUserQuery = { limit: 50 };
      const mockResult = {
        items: [],
        pageInfo: { limit: 50, nextCursor: null, hasMore: false },
        summary: { count: 0 }
      };

      (AdminVisibilityRules.hasAdminPrivileges as jest.Mock).mockReturnValue(true);
      userRepository.listForAdmin.mockResolvedValue(mockResult);

      const result = await useCase.execute(query, UserRole.ADMIN);

      expect(userRepository.listForAdmin).toHaveBeenCalledWith(query, UserRole.ADMIN);
      expect(result).toEqual(mockResult);
    });

    it('should allow valid date ranges', async () => {
      const query: AdminUserQuery = {
        createdFrom: '2024-01-01T00:00:00Z',
        createdTo: '2024-01-02T00:00:00Z',
        lastLoginFrom: '2024-01-01T00:00:00Z',
        lastLoginTo: '2024-01-02T00:00:00Z'
      };
      const mockResult = {
        items: [],
        pageInfo: { limit: 25, nextCursor: null, hasMore: false },
        summary: { count: 0 }
      };

      (AdminVisibilityRules.hasAdminPrivileges as jest.Mock).mockReturnValue(true);
      userRepository.listForAdmin.mockResolvedValue(mockResult);

      const result = await useCase.execute(query, UserRole.ADMIN);

      expect(userRepository.listForAdmin).toHaveBeenCalledWith(query, UserRole.ADMIN);
      expect(result).toEqual(mockResult);
    });

    it('should allow search query up to 100 characters', async () => {
      const query: AdminUserQuery = {
        q: 'a'.repeat(100)
      };
      const mockResult = {
        items: [],
        pageInfo: { limit: 25, nextCursor: null, hasMore: false },
        summary: { count: 0 }
      };

      (AdminVisibilityRules.hasAdminPrivileges as jest.Mock).mockReturnValue(true);
      userRepository.listForAdmin.mockResolvedValue(mockResult);

      const result = await useCase.execute(query, UserRole.ADMIN);

      expect(userRepository.listForAdmin).toHaveBeenCalledWith(query, UserRole.ADMIN);
      expect(result).toEqual(mockResult);
    });

    it('should log query completion with result count', async () => {
      const query: AdminUserQuery = {};
      const mockResult: AdminUserResponse = {
        items: [{ id: '1' }, { id: '2' }] as any,
        pageInfo: { limit: 25, nextCursor: null, hasMore: false },
        summary: { count: 2 }
      };

      (AdminVisibilityRules.hasAdminPrivileges as jest.Mock).mockReturnValue(true);
      userRepository.listForAdmin.mockResolvedValue(mockResult);

      await useCase.execute(query, UserRole.SUPER_ADMIN);

      expect(logger.info).toHaveBeenCalledWith(
        'Admin users query completed',
        expect.objectContaining({
          viewerRole: UserRole.SUPER_ADMIN,
          resultCount: 2,
          hasMore: false,
          totalCount: 2
        })
      );
    });

    it('should sanitize query for logging', async () => {
      const query: AdminUserQuery = {
        q: 'a'.repeat(50),
        cursor: 'test-cursor'
      };
      const mockResult = {
        items: [],
        pageInfo: { limit: 25, nextCursor: null, hasMore: false },
        summary: { count: 0 }
      };

      (AdminVisibilityRules.hasAdminPrivileges as jest.Mock).mockReturnValue(true);
      userRepository.listForAdmin.mockResolvedValue(mockResult);

      await useCase.execute(query, UserRole.ADMIN);

      expect(logger.info).toHaveBeenCalledWith(
        'Executing GetUsersAdminUseCase',
        expect.objectContaining({
          query: expect.objectContaining({
            q: expect.stringContaining('...'),
            cursor: 'present'
          })
        })
      );
    });
  });
});

