/**
 * @fileoverview GetUserByIdAdminUseCase Tests - Unit tests for GetUserByIdAdminUseCase
 * @summary Tests for admin user detail retrieval use case
 * @description Tests all methods in GetUserByIdAdminUseCase including validation, visibility checks, and includes.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GetUserByIdAdminUseCase } from '../../../../src/application/admin/GetUserByIdAdminUseCase';
import { UserRepository } from '../../../../src/repositories/UserRepository';
import { Logger } from '@lawprotect/shared-ts';
import { UserRole, AdminIncludeField } from '../../../../src/domain/enums';
import { UserId } from '../../../../src/domain/value-objects/UserId';
import { userEntity } from '../../../helpers/builders/user';
import { TestUtils } from '../../../helpers/testUtils';
import { AdminVisibilityRules } from '../../../../src/domain/rules/AdminVisibilityRules';

jest.mock('../../../../src/domain/rules/AdminVisibilityRules');

describe('GetUserByIdAdminUseCase', () => {
  let useCase: GetUserByIdAdminUseCase;
  let userRepository: jest.Mocked<UserRepository>;
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    userRepository = {
      findByIdWithIncludes: jest.fn()
    } as any;

    logger = {
      info: jest.fn(),
      error: jest.fn()
    } as any;

    useCase = new GetUserByIdAdminUseCase(userRepository, logger);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should retrieve user successfully with no includes', async () => {
      const userId = TestUtils.generateUuid();
      const viewerId = TestUtils.generateUuid();
      const user = userEntity({ id: UserId.fromString(userId) });
      const userData = {
        id: userId,
        cognitoSub: user.getCognitoSub().toString(),
        email: user.getEmail().toString(),
        name: user.getFullName(),
        givenName: user.getFirstName(),
        lastName: user.getLastName(),
        role: user.getRole(),
        status: user.getStatus(),
        mfaEnabled: user.isMfaEnabled(),
        lastLoginAt: user.getLastLoginAt()?.toISOString() || null,
        suspendedUntil: null,
        deactivationReason: null,
        createdAt: user.getCreatedAt().toISOString(),
        updatedAt: user.getUpdatedAt().toISOString()
      };

      userRepository.findByIdWithIncludes.mockResolvedValue(userData as any);
      (AdminVisibilityRules.validateUserVisibility as jest.Mock).mockImplementation(() => {});

      const result = await useCase.execute(userId, [], UserRole.ADMIN, viewerId);

      expect(userRepository.findByIdWithIncludes).toHaveBeenCalledWith(
        new UserId(userId),
        []
      );
      expect(AdminVisibilityRules.validateUserVisibility).toHaveBeenCalledWith(
        UserRole.ADMIN,
        userData,
        viewerId
      );
      expect(result.id).toBe(userId);
      expect(result.email).toBe(userData.email);
      expect(result.role).toBe(userData.role);
      expect(result.status).toBe(userData.status);
      expect(result.personalInfo).toBeUndefined();
      expect(result.providers).toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith(
        'Executing GetUserByIdAdminUseCase',
        expect.objectContaining({ userId, viewerRole: UserRole.ADMIN, viewerId })
      );
    });

    it('should retrieve user with profile include', async () => {
      const userId = TestUtils.generateUuid();
      const viewerId = TestUtils.generateUuid();
      const user = userEntity({ id: UserId.fromString(userId) });
      const userWithIncludes = {
        ...user,
        personalInfo: {
          phone: '+1234567890',
          locale: 'en-US',
          timeZone: 'America/New_York'
        }
      };

      userRepository.findByIdWithIncludes.mockResolvedValue(userWithIncludes as any);
      (AdminVisibilityRules.validateUserVisibility as jest.Mock).mockImplementation(() => {});

      const result = await useCase.execute(
        userId,
        [AdminIncludeField.PROFILE],
        UserRole.SUPER_ADMIN,
        viewerId
      );

      expect(result.personalInfo).toEqual({
        phone: '+1234567890',
        locale: 'en-US',
        timeZone: 'America/New_York'
      });
    });

    it('should retrieve user with IDP include', async () => {
      const userId = TestUtils.generateUuid();
      const viewerId = TestUtils.generateUuid();
      const user = userEntity({ id: UserId.fromString(userId) });
      const providers = ['GOOGLE', 'MICROSOFT_365'];
      const userWithIncludes = {
        ...user,
        providers
      };

      userRepository.findByIdWithIncludes.mockResolvedValue(userWithIncludes as any);
      (AdminVisibilityRules.validateUserVisibility as jest.Mock).mockImplementation(() => {});

      const result = await useCase.execute(
        userId,
        [AdminIncludeField.IDP],
        UserRole.ADMIN,
        viewerId
      );

      expect(result.providers).toEqual(providers);
    });

    it('should retrieve user with both includes', async () => {
      const userId = TestUtils.generateUuid();
      const viewerId = TestUtils.generateUuid();
      const user = userEntity({ id: UserId.fromString(userId) });
      const userWithIncludes = {
        ...user,
        personalInfo: {
          phone: '+1234567890',
          locale: 'en-US',
          timeZone: 'America/New_York'
        },
        providers: ['GOOGLE']
      };

      userRepository.findByIdWithIncludes.mockResolvedValue(userWithIncludes as any);
      (AdminVisibilityRules.validateUserVisibility as jest.Mock).mockImplementation(() => {});

      const result = await useCase.execute(
        userId,
        [AdminIncludeField.PROFILE, AdminIncludeField.IDP],
        UserRole.ADMIN,
        viewerId
      );

      expect(result.personalInfo).toBeDefined();
      expect(result.providers).toBeDefined();
    });

    it('should throw error when user not found', async () => {
      const userId = TestUtils.generateUuid();
      const viewerId = TestUtils.generateUuid();

      userRepository.findByIdWithIncludes.mockResolvedValue(null);

      await expect(
        useCase.execute(userId, [], UserRole.ADMIN, viewerId)
      ).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Error in GetUserByIdAdminUseCase',
        expect.objectContaining({ userId })
      );
    });

    it('should throw error when visibility check fails', async () => {
      const userId = TestUtils.generateUuid();
      const viewerId = TestUtils.generateUuid();
      const user = userEntity({ id: UserId.fromString(userId) });
      const visibilityError = new Error('Insufficient permissions');

      userRepository.findByIdWithIncludes.mockResolvedValue(user as any);
      (AdminVisibilityRules.validateUserVisibility as jest.Mock).mockImplementation(() => {
        throw visibilityError;
      });

      await expect(
        useCase.execute(userId, [], UserRole.ADMIN, viewerId)
      ).rejects.toThrow(visibilityError);

      expect(logger.error).toHaveBeenCalledWith(
        'Error in GetUserByIdAdminUseCase',
        expect.objectContaining({
          userId,
          error: 'Insufficient permissions'
        })
      );
    });

    it('should handle repository errors', async () => {
      const userId = TestUtils.generateUuid();
      const viewerId = TestUtils.generateUuid();
      const repoError = new Error('Database error');

      userRepository.findByIdWithIncludes.mockRejectedValue(repoError);

      await expect(
        useCase.execute(userId, [], UserRole.ADMIN, viewerId)
      ).rejects.toThrow(repoError);

      expect(logger.error).toHaveBeenCalled();
    });

    it('should not include personalInfo when not requested even if available', async () => {
      const userId = TestUtils.generateUuid();
      const viewerId = TestUtils.generateUuid();
      const user = userEntity({ id: UserId.fromString(userId) });
      const userWithIncludes = {
        ...user,
        personalInfo: {
          phone: '+1234567890',
          locale: 'en-US',
          timeZone: 'America/New_York'
        }
      };

      userRepository.findByIdWithIncludes.mockResolvedValue(userWithIncludes as any);
      (AdminVisibilityRules.validateUserVisibility as jest.Mock).mockImplementation(() => {});

      const result = await useCase.execute(userId, [], UserRole.ADMIN, viewerId);

      expect(result.personalInfo).toBeUndefined();
    });

    it('should not include providers when not requested even if available', async () => {
      const userId = TestUtils.generateUuid();
      const viewerId = TestUtils.generateUuid();
      const user = userEntity({ id: UserId.fromString(userId) });
      const userWithIncludes = {
        ...user,
        providers: ['GOOGLE']
      };

      userRepository.findByIdWithIncludes.mockResolvedValue(userWithIncludes as any);
      (AdminVisibilityRules.validateUserVisibility as jest.Mock).mockImplementation(() => {});

      const result = await useCase.execute(userId, [], UserRole.ADMIN, viewerId);

      expect(result.providers).toBeUndefined();
    });
  });
});

