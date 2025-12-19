/**
 * @fileoverview SetUserRoleAdminUseCase Tests - Unit tests for SetUserRoleAdminUseCase
 * @summary Tests for admin user role change use case
 * @description Tests all methods in SetUserRoleAdminUseCase including validation, Cognito updates, and auditing.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { SetUserRoleAdminUseCase } from '../../../../src/application/admin/SetUserRoleAdminUseCase';
import { UserService } from '../../../../src/services/UserService';
import { CognitoService } from '../../../../src/services/CognitoService';
import { AuditService } from '../../../../src/services/AuditService';
import { EventPublishingService } from '../../../../src/services/EventPublishingService';
import { UserRepository } from '../../../../src/repositories/UserRepository';
import { Logger } from '@lawprotect/shared-ts';
import { UserRole } from '../../../../src/domain/enums';
import { UserId } from '../../../../src/domain/value-objects/UserId';
import { userEntity } from '../../../helpers/builders/user';
import { TestUtils } from '../../../helpers/testUtils';
import { RoleChangeRules } from '../../../../src/domain/rules/RoleChangeRules';

jest.mock('../../../../src/domain/rules/RoleChangeRules');

describe('SetUserRoleAdminUseCase', () => {
  let useCase: SetUserRoleAdminUseCase;
  let userService: jest.Mocked<UserService>;
  let cognitoService: jest.Mocked<CognitoService>;
  let auditService: jest.Mocked<AuditService>;
  let eventPublishingService: jest.Mocked<EventPublishingService>;
  let userRepository: jest.Mocked<UserRepository>;
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    userService = {
      changeUserRole: jest.fn()
    } as any;

    cognitoService = {
      adminUpdateUserAttributes: jest.fn(),
      adminUserGlobalSignOut: jest.fn()
    } as any;

    auditService = {
      userRoleChanged: jest.fn()
    } as any;

    eventPublishingService = {
      publishUserRoleChanged: jest.fn()
    } as any;

    userRepository = {
      findById: jest.fn()
    } as any;

    logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    } as any;

    useCase = new SetUserRoleAdminUseCase(
      userService,
      cognitoService,
      auditService,
      eventPublishingService,
      userRepository,
      logger
    );

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should change user role successfully', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { role: UserRole.LAWYER };
      const targetUser = userEntity({ id: UserId.fromString(userId), role: UserRole.CUSTOMER });
      const updatedUser = userEntity({ id: UserId.fromString(userId), role: UserRole.LAWYER });

      userRepository.findById.mockResolvedValue(targetUser);
      (RoleChangeRules.validateRoleChange as jest.Mock).mockImplementation(() => {});
      (RoleChangeRules.validateRoleTransition as jest.Mock).mockImplementation(() => {});
      (RoleChangeRules.getRoleChangeEffects as jest.Mock).mockReturnValue({
        mfaRequired: false,
        globalSignOut: false
      });
      (RoleChangeRules.isMfaRequiredForRole as jest.Mock).mockReturnValue(false);
      cognitoService.adminUpdateUserAttributes.mockResolvedValue(undefined);
      userService.changeUserRole.mockResolvedValue(updatedUser);
      auditService.userRoleChanged.mockResolvedValue(undefined);
      eventPublishingService.publishUserRoleChanged.mockResolvedValue(undefined);

      const result = await useCase.execute(userId, request, UserRole.ADMIN, actorId);

      expect(userRepository.findById).toHaveBeenCalledWith(new UserId(userId));
      expect(RoleChangeRules.validateRoleChange).toHaveBeenCalledWith(
        UserRole.ADMIN,
        targetUser,
        UserRole.LAWYER,
        actorId
      );
      expect(RoleChangeRules.validateRoleTransition).toHaveBeenCalledWith(
        UserRole.CUSTOMER,
        UserRole.LAWYER
      );
      expect(cognitoService.adminUpdateUserAttributes).toHaveBeenCalledWith(
        targetUser.getCognitoSub().toString(),
        expect.objectContaining({
          'custom:role': UserRole.LAWYER,
          'custom:is_mfa_required': 'false'
        })
      );
      expect(userService.changeUserRole).toHaveBeenCalledWith(new UserId(userId), UserRole.LAWYER);
      expect(auditService.userRoleChanged).toHaveBeenCalled();
      expect(eventPublishingService.publishUserRoleChanged).toHaveBeenCalled();
      expect(result.id).toBe(userId);
      expect(result.role).toBe(UserRole.LAWYER);
      expect(logger.info).toHaveBeenCalledWith(
        'Executing SetUserRoleAdminUseCase',
        expect.objectContaining({ userId, newRole: UserRole.LAWYER })
      );
    });

    it('should return current state when role is already set', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { role: UserRole.CUSTOMER };
      const targetUser = userEntity({ id: UserId.fromString(userId), role: UserRole.CUSTOMER });

      userRepository.findById.mockResolvedValue(targetUser);
      (RoleChangeRules.validateRoleChange as jest.Mock).mockImplementation(() => {});
      (RoleChangeRules.isMfaRequiredForRole as jest.Mock).mockReturnValue(false);

      const result = await useCase.execute(userId, request, UserRole.ADMIN, actorId);

      expect(userService.changeUserRole).not.toHaveBeenCalled();
      expect(result.role).toBe(UserRole.CUSTOMER);
      expect(logger.info).toHaveBeenCalledWith(
        'Role already set, returning current state',
        expect.objectContaining({ userId, currentRole: UserRole.CUSTOMER })
      );
    });

    it('should throw error when user not found', async () => {
      const userId = TestUtils.generateUuid();
      const request = { role: UserRole.LAWYER };

      userRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(userId, request, UserRole.ADMIN, TestUtils.generateUuid())
      ).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Error in SetUserRoleAdminUseCase',
        expect.objectContaining({ userId })
      );
    });

    it('should throw error when role change validation fails', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { role: UserRole.LAWYER };
      const targetUser = userEntity({ id: UserId.fromString(userId) });
      const validationError = new Error('Invalid role change');

      userRepository.findById.mockResolvedValue(targetUser);
      (RoleChangeRules.validateRoleChange as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await expect(
        useCase.execute(userId, request, UserRole.ADMIN, actorId)
      ).rejects.toThrow(validationError);

      expect(userService.changeUserRole).not.toHaveBeenCalled();
    });

    it('should set MFA required when role requires it', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { role: UserRole.LAWYER };
      const targetUser = userEntity({ id: UserId.fromString(userId), role: UserRole.CUSTOMER });
      const updatedUser = userEntity({ id: UserId.fromString(userId), role: UserRole.LAWYER });

      userRepository.findById.mockResolvedValue(targetUser);
      (RoleChangeRules.validateRoleChange as jest.Mock).mockImplementation(() => {});
      (RoleChangeRules.validateRoleTransition as jest.Mock).mockImplementation(() => {});
      (RoleChangeRules.getRoleChangeEffects as jest.Mock).mockReturnValue({
        mfaRequired: true,
        globalSignOut: false
      });
      (RoleChangeRules.isMfaRequiredForRole as jest.Mock).mockReturnValue(true);
      cognitoService.adminUpdateUserAttributes.mockResolvedValue(undefined);
      userService.changeUserRole.mockResolvedValue(updatedUser);
      auditService.userRoleChanged.mockResolvedValue(undefined);
      eventPublishingService.publishUserRoleChanged.mockResolvedValue(undefined);

      const result = await useCase.execute(userId, request, UserRole.ADMIN, actorId);

      expect(cognitoService.adminUpdateUserAttributes).toHaveBeenCalledWith(
        targetUser.getCognitoSub().toString(),
        expect.objectContaining({
          'custom:is_mfa_required': 'true'
        })
      );
      expect(result.mfa.required).toBe(true);
    });

    it('should perform global sign out when required', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { role: UserRole.LAWYER };
      const targetUser = userEntity({ id: UserId.fromString(userId), role: UserRole.CUSTOMER });
      const updatedUser = userEntity({ id: UserId.fromString(userId), role: UserRole.LAWYER });

      userRepository.findById.mockResolvedValue(targetUser);
      (RoleChangeRules.validateRoleChange as jest.Mock).mockImplementation(() => {});
      (RoleChangeRules.validateRoleTransition as jest.Mock).mockImplementation(() => {});
      (RoleChangeRules.getRoleChangeEffects as jest.Mock).mockReturnValue({
        mfaRequired: false,
        globalSignOut: true
      });
      (RoleChangeRules.isMfaRequiredForRole as jest.Mock).mockReturnValue(false);
      cognitoService.adminUpdateUserAttributes.mockResolvedValue(undefined);
      cognitoService.adminUserGlobalSignOut.mockResolvedValue(undefined);
      userService.changeUserRole.mockResolvedValue(updatedUser);
      auditService.userRoleChanged.mockResolvedValue(undefined);
      eventPublishingService.publishUserRoleChanged.mockResolvedValue(undefined);

      await useCase.execute(userId, request, UserRole.ADMIN, actorId);

      expect(cognitoService.adminUserGlobalSignOut).toHaveBeenCalledWith(
        targetUser.getCognitoSub().toString()
      );
    });

    it('should throw error when Cognito update fails', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { role: UserRole.LAWYER };
      const targetUser = userEntity({ id: UserId.fromString(userId), role: UserRole.CUSTOMER });
      const cognitoError = new Error('Cognito error');

      userRepository.findById.mockResolvedValue(targetUser);
      (RoleChangeRules.validateRoleChange as jest.Mock).mockImplementation(() => {});
      (RoleChangeRules.validateRoleTransition as jest.Mock).mockImplementation(() => {});
      (RoleChangeRules.getRoleChangeEffects as jest.Mock).mockReturnValue({
        mfaRequired: false,
        globalSignOut: false
      });
      cognitoService.adminUpdateUserAttributes.mockRejectedValue(cognitoError);

      await expect(
        useCase.execute(userId, request, UserRole.ADMIN, actorId)
      ).rejects.toThrow();

      expect(userService.changeUserRole).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to execute Cognito actions for role change',
        expect.objectContaining({ cognitoSub: targetUser.getCognitoSub().toString() })
      );
    });

    it('should continue if audit event creation fails', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { role: UserRole.LAWYER };
      const targetUser = userEntity({ id: UserId.fromString(userId), role: UserRole.CUSTOMER });
      const updatedUser = userEntity({ id: UserId.fromString(userId), role: UserRole.LAWYER });

      userRepository.findById.mockResolvedValue(targetUser);
      (RoleChangeRules.validateRoleChange as jest.Mock).mockImplementation(() => {});
      (RoleChangeRules.validateRoleTransition as jest.Mock).mockImplementation(() => {});
      (RoleChangeRules.getRoleChangeEffects as jest.Mock).mockReturnValue({
        mfaRequired: false,
        globalSignOut: false
      });
      (RoleChangeRules.isMfaRequiredForRole as jest.Mock).mockReturnValue(false);
      cognitoService.adminUpdateUserAttributes.mockResolvedValue(undefined);
      userService.changeUserRole.mockResolvedValue(updatedUser);
      auditService.userRoleChanged.mockRejectedValue(new Error('Audit error'));
      eventPublishingService.publishUserRoleChanged.mockResolvedValue(undefined);

      const result = await useCase.execute(userId, request, UserRole.ADMIN, actorId);

      expect(result).toBeDefined();
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to create audit event for role change',
        expect.any(Object)
      );
    });

    it('should continue if event publishing fails', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { role: UserRole.LAWYER };
      const targetUser = userEntity({ id: UserId.fromString(userId), role: UserRole.CUSTOMER });
      const updatedUser = userEntity({ id: UserId.fromString(userId), role: UserRole.LAWYER });

      userRepository.findById.mockResolvedValue(targetUser);
      (RoleChangeRules.validateRoleChange as jest.Mock).mockImplementation(() => {});
      (RoleChangeRules.validateRoleTransition as jest.Mock).mockImplementation(() => {});
      (RoleChangeRules.getRoleChangeEffects as jest.Mock).mockReturnValue({
        mfaRequired: false,
        globalSignOut: false
      });
      (RoleChangeRules.isMfaRequiredForRole as jest.Mock).mockReturnValue(false);
      cognitoService.adminUpdateUserAttributes.mockResolvedValue(undefined);
      userService.changeUserRole.mockResolvedValue(updatedUser);
      auditService.userRoleChanged.mockResolvedValue(undefined);
      eventPublishingService.publishUserRoleChanged.mockRejectedValue(new Error('Publish error'));

      const result = await useCase.execute(userId, request, UserRole.ADMIN, actorId);

      expect(result).toBeDefined();
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to publish integration event for role change',
        expect.any(Object)
      );
    });

    it('should include reason in audit event when provided', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { role: UserRole.LAWYER, reason: 'Promoted to lawyer' };
      const targetUser = userEntity({ id: UserId.fromString(userId), role: UserRole.CUSTOMER });
      const updatedUser = userEntity({ id: UserId.fromString(userId), role: UserRole.LAWYER });

      userRepository.findById.mockResolvedValue(targetUser);
      (RoleChangeRules.validateRoleChange as jest.Mock).mockImplementation(() => {});
      (RoleChangeRules.validateRoleTransition as jest.Mock).mockImplementation(() => {});
      (RoleChangeRules.getRoleChangeEffects as jest.Mock).mockReturnValue({
        mfaRequired: false,
        globalSignOut: false
      });
      (RoleChangeRules.isMfaRequiredForRole as jest.Mock).mockReturnValue(false);
      cognitoService.adminUpdateUserAttributes.mockResolvedValue(undefined);
      userService.changeUserRole.mockResolvedValue(updatedUser);
      auditService.userRoleChanged.mockResolvedValue(undefined);
      eventPublishingService.publishUserRoleChanged.mockResolvedValue(undefined);

      await useCase.execute(userId, request, UserRole.ADMIN, actorId);

      expect(auditService.userRoleChanged).toHaveBeenCalledWith(
        userId,
        UserRole.CUSTOMER,
        UserRole.LAWYER,
        actorId,
        expect.objectContaining({
          reason: 'Promoted to lawyer',
          source: 'AdminRoleChange'
        })
      );
    });

    it('should handle error in execute and log it', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { role: UserRole.LAWYER };
      const error = new Error('Unexpected error');

      userRepository.findById.mockRejectedValue(error);

      await expect(useCase.execute(userId, request, UserRole.ADMIN, actorId)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        'Error in SetUserRoleAdminUseCase',
        expect.objectContaining({
          userId,
          error: 'Unexpected error'
        })
      );
    });

    it('should handle error when error has stack', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { role: UserRole.LAWYER };
      const error = new Error('Unexpected error');
      error.stack = 'Error stack trace';

      userRepository.findById.mockRejectedValue(error);

      await expect(useCase.execute(userId, request, UserRole.ADMIN, actorId)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        'Error in SetUserRoleAdminUseCase',
        expect.objectContaining({
          userId,
          error: 'Unexpected error',
          stack: 'Error stack trace'
        })
      );
    });

    it('should handle error when Cognito actions fail', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { role: UserRole.LAWYER };
      const targetUser = userEntity({ id: UserId.fromString(userId), role: UserRole.CUSTOMER });
      const cognitoError = new Error('Cognito error');

      userRepository.findById.mockResolvedValue(targetUser);
      (RoleChangeRules.validateRoleChange as jest.Mock).mockImplementation(() => {});
      (RoleChangeRules.validateRoleTransition as jest.Mock).mockImplementation(() => {});
      (RoleChangeRules.getRoleChangeEffects as jest.Mock).mockReturnValue({
        mfaRequired: false,
        globalSignOut: false
      });
      cognitoService.adminUpdateUserAttributes.mockRejectedValue(cognitoError);

      await expect(useCase.execute(userId, request, UserRole.ADMIN, actorId)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to execute Cognito actions for role change',
        expect.objectContaining({
          cognitoSub: targetUser.getCognitoSub().toString(),
          newRole: UserRole.LAWYER,
          error: 'Cognito error'
        })
      );
    });
  });
});

