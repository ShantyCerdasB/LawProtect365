/**
 * @fileoverview SetUserStatusAdminUseCase Tests - Unit tests for SetUserStatusAdminUseCase
 * @summary Tests for admin user status change use case
 * @description Tests all methods in SetUserStatusAdminUseCase including validation, Cognito updates, and auditing.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { SetUserStatusAdminUseCase } from '../../../../src/application/admin/SetUserStatusAdminUseCase';
import { UserService } from '../../../../src/services/UserService';
import { CognitoService } from '../../../../src/services/CognitoService';
import { AuditService } from '../../../../src/services/AuditService';
import { EventPublishingService } from '../../../../src/services/EventPublishingService';
import { UserRepository } from '../../../../src/repositories/UserRepository';
import { Logger } from '@lawprotect/shared-ts';
import { UserRole, UserAccountStatus } from '../../../../src/domain/enums';
import { UserId } from '../../../../src/domain/value-objects/UserId';
import { userEntity } from '../../../helpers/builders/user';
import { TestUtils } from '../../../helpers/testUtils';
import { AdminStatusChangeRules, UserLifecycleRules } from '../../../../src/domain/rules';

jest.mock('../../../../src/domain/rules/AdminStatusChangeRules');
jest.mock('../../../../src/domain/rules/UserLifecycleRules');

describe('SetUserStatusAdminUseCase', () => {
  let useCase: SetUserStatusAdminUseCase;
  let userService: jest.Mocked<UserService>;
  let cognitoService: jest.Mocked<CognitoService>;
  let auditService: jest.Mocked<AuditService>;
  let eventPublishingService: jest.Mocked<EventPublishingService>;
  let userRepository: jest.Mocked<UserRepository>;
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    userService = {
      changeUserStatus: jest.fn()
    } as any;

    cognitoService = {
      adminEnableUser: jest.fn(),
      adminDisableUser: jest.fn(),
      adminUserGlobalSignOut: jest.fn()
    } as any;

    auditService = {
      userStatusChanged: jest.fn()
    } as any;

    eventPublishingService = {
      publishUserStatusChanged: jest.fn()
    } as any;

    userRepository = {
      findById: jest.fn()
    } as any;

    logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    } as any;

    useCase = new SetUserStatusAdminUseCase(
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
    it('should change user status successfully', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { status: UserAccountStatus.SUSPENDED };
      const targetUser = userEntity({ id: UserId.fromString(userId), status: UserAccountStatus.ACTIVE });
      const updatedUser = userEntity({ id: UserId.fromString(userId), status: UserAccountStatus.SUSPENDED });
      (updatedUser as any).getSuspendedUntil = jest.fn().mockReturnValue(undefined);
      (updatedUser as any).getDeactivationReason = jest.fn().mockReturnValue(undefined);

      userRepository.findById.mockResolvedValue(targetUser);
      (AdminStatusChangeRules.validateAdminPermissions as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.validateTransition as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.validatePendingVerificationTransition as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.getStatusEffects as jest.Mock).mockReturnValue({
        enableUser: false,
        disableUser: true,
        globalSignOut: true
      });
      cognitoService.adminDisableUser.mockResolvedValue(undefined);
      cognitoService.adminUserGlobalSignOut.mockResolvedValue(undefined);
      userService.changeUserStatus.mockResolvedValue(updatedUser);
      auditService.userStatusChanged.mockResolvedValue(undefined);
      eventPublishingService.publishUserStatusChanged.mockResolvedValue(undefined);

      const result = await useCase.execute(userId, request, UserRole.ADMIN, actorId);

      expect(userRepository.findById).toHaveBeenCalledWith(new UserId(userId));
      expect(AdminStatusChangeRules.validateAdminPermissions).toHaveBeenCalledWith(
        UserRole.ADMIN,
        targetUser,
        actorId
      );
      expect(UserLifecycleRules.validateTransition).toHaveBeenCalledWith(
        UserAccountStatus.ACTIVE,
        UserAccountStatus.SUSPENDED
      );
      expect(cognitoService.adminDisableUser).toHaveBeenCalledWith(
        targetUser.getCognitoSub().toString()
      );
      expect(cognitoService.adminUserGlobalSignOut).toHaveBeenCalledWith(
        targetUser.getCognitoSub().toString()
      );
      expect(userService.changeUserStatus).toHaveBeenCalledWith(
        new UserId(userId),
        UserAccountStatus.SUSPENDED,
        new UserId(actorId),
        undefined,
        undefined
      );
      expect(auditService.userStatusChanged).toHaveBeenCalled();
      expect(eventPublishingService.publishUserStatusChanged).toHaveBeenCalled();
      expect(result.id).toBe(userId);
      expect(result.status).toBe(UserAccountStatus.SUSPENDED);
      expect(logger.info).toHaveBeenCalledWith(
        'Executing SetUserStatusAdminUseCase',
        expect.objectContaining({ userId, newStatus: UserAccountStatus.SUSPENDED })
      );
    });

    it('should return current state when status is already set', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { status: UserAccountStatus.ACTIVE };
      const targetUser = userEntity({ id: UserId.fromString(userId), status: UserAccountStatus.ACTIVE });
      (targetUser as any).getSuspendedUntil = jest.fn().mockReturnValue(undefined);
      (targetUser as any).getDeactivationReason = jest.fn().mockReturnValue(undefined);
      (targetUser as any).getDeletedAt = jest.fn().mockReturnValue(undefined);

      userRepository.findById.mockResolvedValue(targetUser);
      (AdminStatusChangeRules.validateAdminPermissions as jest.Mock).mockImplementation(() => {});

      const result = await useCase.execute(userId, request, UserRole.ADMIN, actorId);

      expect(userService.changeUserStatus).not.toHaveBeenCalled();
      expect(result.status).toBe(UserAccountStatus.ACTIVE);
      expect(logger.info).toHaveBeenCalledWith(
        'Status already set, returning current state',
        expect.objectContaining({ userId, currentStatus: UserAccountStatus.ACTIVE })
      );
    });

    it('should throw error when user not found', async () => {
      const userId = TestUtils.generateUuid();
      const request = { status: UserAccountStatus.SUSPENDED };

      userRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(userId, request, UserRole.ADMIN, TestUtils.generateUuid())
      ).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Error in SetUserStatusAdminUseCase',
        expect.objectContaining({ userId })
      );
    });

    it('should throw error when admin permissions validation fails', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { status: UserAccountStatus.SUSPENDED };
      const targetUser = userEntity({ id: UserId.fromString(userId) });
      const validationError = new Error('Insufficient permissions');

      userRepository.findById.mockResolvedValue(targetUser);
      (AdminStatusChangeRules.validateAdminPermissions as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await expect(
        useCase.execute(userId, request, UserRole.ADMIN, actorId)
      ).rejects.toThrow(validationError);

      expect(userService.changeUserStatus).not.toHaveBeenCalled();
    });

    it('should enable user when status effects require it', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { status: UserAccountStatus.ACTIVE };
      const targetUser = userEntity({ id: UserId.fromString(userId), status: UserAccountStatus.INACTIVE });
      const updatedUser = userEntity({ id: UserId.fromString(userId), status: UserAccountStatus.ACTIVE });
      (updatedUser as any).getSuspendedUntil = jest.fn().mockReturnValue(undefined);
      (updatedUser as any).getDeactivationReason = jest.fn().mockReturnValue(undefined);
      (updatedUser as any).getDeletedAt = jest.fn().mockReturnValue(undefined);

      userRepository.findById.mockResolvedValue(targetUser);
      (AdminStatusChangeRules.validateAdminPermissions as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.validateTransition as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.validatePendingVerificationTransition as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.getStatusEffects as jest.Mock).mockReturnValue({
        enableUser: true,
        disableUser: false,
        globalSignOut: false
      });
      cognitoService.adminEnableUser.mockResolvedValue(undefined);
      userService.changeUserStatus.mockResolvedValue(updatedUser);
      auditService.userStatusChanged.mockResolvedValue(undefined);
      eventPublishingService.publishUserStatusChanged.mockResolvedValue(undefined);

      await useCase.execute(userId, request, UserRole.ADMIN, actorId);

      expect(cognitoService.adminEnableUser).toHaveBeenCalledWith(
        targetUser.getCognitoSub().toString()
      );
      expect(cognitoService.adminDisableUser).not.toHaveBeenCalled();
    });

    it('should include suspendedUntil in response when status is SUSPENDED', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const suspendUntil = new Date('2025-12-31T23:59:59Z');
      const request = { status: UserAccountStatus.SUSPENDED, suspendUntil: suspendUntil.toISOString() };
      const targetUser = userEntity({ id: UserId.fromString(userId), status: UserAccountStatus.ACTIVE });
      const updatedUser = userEntity({
        id: UserId.fromString(userId),
        status: UserAccountStatus.SUSPENDED
      });
      (updatedUser as any).getSuspendedUntil = jest.fn().mockReturnValue(suspendUntil);
      (updatedUser as any).getDeactivationReason = jest.fn().mockReturnValue(undefined);
      (updatedUser as any).getDeletedAt = jest.fn().mockReturnValue(undefined);

      userRepository.findById.mockResolvedValue(targetUser);
      (AdminStatusChangeRules.validateAdminPermissions as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.validateTransition as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.validatePendingVerificationTransition as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.getStatusEffects as jest.Mock).mockReturnValue({
        enableUser: false,
        disableUser: true,
        globalSignOut: true
      });
      cognitoService.adminDisableUser.mockResolvedValue(undefined);
      cognitoService.adminUserGlobalSignOut.mockResolvedValue(undefined);
      userService.changeUserStatus.mockResolvedValue(updatedUser);
      auditService.userStatusChanged.mockResolvedValue(undefined);
      eventPublishingService.publishUserStatusChanged.mockResolvedValue(undefined);

      const result = await useCase.execute(userId, request, UserRole.ADMIN, actorId);

      expect(userService.changeUserStatus).toHaveBeenCalledWith(
        new UserId(userId),
        UserAccountStatus.SUSPENDED,
        new UserId(actorId),
        undefined,
        suspendUntil
      );
      expect(result.suspendedUntil).toBe(suspendUntil.toISOString());
    });

    it('should include deactivationReason in response when available', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { status: UserAccountStatus.INACTIVE, reason: 'User requested deactivation' };
      const targetUser = userEntity({ id: UserId.fromString(userId), status: UserAccountStatus.ACTIVE });
      const updatedUser = userEntity({
        id: UserId.fromString(userId),
        status: UserAccountStatus.INACTIVE
      });
      (updatedUser as any).getDeactivationReason = jest.fn().mockReturnValue('User requested deactivation');

      userRepository.findById.mockResolvedValue(targetUser);
      (AdminStatusChangeRules.validateAdminPermissions as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.validateTransition as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.validatePendingVerificationTransition as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.getStatusEffects as jest.Mock).mockReturnValue({
        enableUser: false,
        disableUser: true,
        globalSignOut: false
      });
      cognitoService.adminDisableUser.mockResolvedValue(undefined);
      userService.changeUserStatus.mockResolvedValue(updatedUser);
      auditService.userStatusChanged.mockResolvedValue(undefined);
      eventPublishingService.publishUserStatusChanged.mockResolvedValue(undefined);

      const result = await useCase.execute(userId, request, UserRole.ADMIN, actorId);

      expect(userService.changeUserStatus).toHaveBeenCalledWith(
        new UserId(userId),
        UserAccountStatus.INACTIVE,
        new UserId(actorId),
        'User requested deactivation',
        undefined
      );
      expect(result.deactivationReason).toBe('User requested deactivation');
    });

    it('should include deletedAt in response when status is DELETED', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const deletedAt = new Date();
      const request = { status: UserAccountStatus.DELETED };
      const targetUser = userEntity({ id: UserId.fromString(userId), status: UserAccountStatus.ACTIVE });
      const updatedUser = userEntity({
        id: UserId.fromString(userId),
        status: UserAccountStatus.DELETED
      });
      (updatedUser as any).getDeletedAt = jest.fn().mockReturnValue(deletedAt);
      (updatedUser as any).getSuspendedUntil = jest.fn().mockReturnValue(undefined);
      (updatedUser as any).getDeactivationReason = jest.fn().mockReturnValue(undefined);

      userRepository.findById.mockResolvedValue(targetUser);
      (AdminStatusChangeRules.validateAdminPermissions as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.validateTransition as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.validatePendingVerificationTransition as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.getStatusEffects as jest.Mock).mockReturnValue({
        enableUser: false,
        disableUser: true,
        globalSignOut: true
      });
      cognitoService.adminDisableUser.mockResolvedValue(undefined);
      cognitoService.adminUserGlobalSignOut.mockResolvedValue(undefined);
      userService.changeUserStatus.mockResolvedValue(updatedUser);
      auditService.userStatusChanged.mockResolvedValue(undefined);
      eventPublishingService.publishUserStatusChanged.mockResolvedValue(undefined);

      const result = await useCase.execute(userId, request, UserRole.ADMIN, actorId);

      expect(result.deletedAt).toBe(deletedAt.toISOString());
    });

    it('should continue if audit event creation fails', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { status: UserAccountStatus.SUSPENDED };
      const targetUser = userEntity({ id: UserId.fromString(userId), status: UserAccountStatus.ACTIVE });
      const updatedUser = userEntity({ id: UserId.fromString(userId), status: UserAccountStatus.SUSPENDED });
      (updatedUser as any).getSuspendedUntil = jest.fn().mockReturnValue(undefined);
      (updatedUser as any).getDeactivationReason = jest.fn().mockReturnValue(undefined);

      userRepository.findById.mockResolvedValue(targetUser);
      (AdminStatusChangeRules.validateAdminPermissions as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.validateTransition as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.validatePendingVerificationTransition as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.getStatusEffects as jest.Mock).mockReturnValue({
        enableUser: false,
        disableUser: true,
        globalSignOut: true
      });
      cognitoService.adminDisableUser.mockResolvedValue(undefined);
      cognitoService.adminUserGlobalSignOut.mockResolvedValue(undefined);
      userService.changeUserStatus.mockResolvedValue(updatedUser);
      auditService.userStatusChanged.mockRejectedValue(new Error('Audit error'));
      eventPublishingService.publishUserStatusChanged.mockResolvedValue(undefined);

      const result = await useCase.execute(userId, request, UserRole.ADMIN, actorId);

      expect(result).toBeDefined();
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to create audit event for status change',
        expect.any(Object)
      );
    });

    it('should continue if event publishing fails', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { status: UserAccountStatus.SUSPENDED };
      const targetUser = userEntity({ id: UserId.fromString(userId), status: UserAccountStatus.ACTIVE });
      const updatedUser = userEntity({ id: UserId.fromString(userId), status: UserAccountStatus.SUSPENDED });
      (updatedUser as any).getSuspendedUntil = jest.fn().mockReturnValue(undefined);
      (updatedUser as any).getDeactivationReason = jest.fn().mockReturnValue(undefined);

      userRepository.findById.mockResolvedValue(targetUser);
      (AdminStatusChangeRules.validateAdminPermissions as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.validateTransition as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.validatePendingVerificationTransition as jest.Mock).mockImplementation(() => {});
      (UserLifecycleRules.getStatusEffects as jest.Mock).mockReturnValue({
        enableUser: false,
        disableUser: true,
        globalSignOut: true
      });
      cognitoService.adminDisableUser.mockResolvedValue(undefined);
      cognitoService.adminUserGlobalSignOut.mockResolvedValue(undefined);
      userService.changeUserStatus.mockResolvedValue(updatedUser);
      auditService.userStatusChanged.mockResolvedValue(undefined);
      eventPublishingService.publishUserStatusChanged.mockRejectedValue(new Error('Publish error'));

      const result = await useCase.execute(userId, request, UserRole.ADMIN, actorId);

      expect(result).toBeDefined();
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to publish integration event for status change',
        expect.any(Object)
      );
    });

    it('should handle error in execute and log it', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { status: UserAccountStatus.SUSPENDED };
      const error = new Error('Unexpected error');

      userRepository.findById.mockRejectedValue(error);

      await expect(useCase.execute(userId, request, UserRole.ADMIN, actorId)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        'Error in SetUserStatusAdminUseCase',
        expect.objectContaining({
          userId,
          error: 'Unexpected error'
        })
      );
    });

    it('should handle error when error has stack', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const request = { status: UserAccountStatus.SUSPENDED };
      const error = new Error('Unexpected error');
      error.stack = 'Error stack trace';

      userRepository.findById.mockRejectedValue(error);

      await expect(useCase.execute(userId, request, UserRole.ADMIN, actorId)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        'Error in SetUserStatusAdminUseCase',
        expect.objectContaining({
          userId,
          error: 'Unexpected error',
          stack: 'Error stack trace'
        })
      );
    });
  });
});

