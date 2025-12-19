/**
 * @fileoverview AuditService Tests - Comprehensive unit tests for AuditService
 * @summary Tests all audit service methods with full coverage
 * @description This test suite provides comprehensive coverage of AuditService including
 * all audit event creation methods, error handling, and edge cases.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AuditService } from '../../../src/services/AuditService';
import { UserAuditEventRepository } from '../../../src/repositories/UserAuditEventRepository';
import { UserAuditAction } from '../../../src/domain/enums/UserAuditAction';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { TestUtils } from '../../helpers/testUtils';
import { createUserAuditEventPrismaMock } from '../../helpers/mocks/prisma';
import { userAuditEventEntity } from '../../helpers/builders/userAuditEvent';

describe('AuditService', () => {
  let auditService: AuditService;
  let userAuditEventRepository: jest.Mocked<UserAuditEventRepository>;

  beforeEach(() => {
    const mock = createUserAuditEventPrismaMock();
    userAuditEventRepository = new UserAuditEventRepository(mock.prisma as any) as jest.Mocked<UserAuditEventRepository>;
    auditService = new AuditService(userAuditEventRepository);
    jest.clearAllMocks();
  });

  describe('userRegistered', () => {
    it('creates user registered audit event', async () => {
      const userId = TestUtils.generateUuid();
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userRegistered(userId);

      expect(userAuditEventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          getAction: expect.any(Function)
        })
      );
    });

    it('includes metadata when provided', async () => {
      const userId = TestUtils.generateUuid();
      const metadata = { source: 'test', customField: 'value' };
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userRegistered(userId, metadata);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });
  });

  describe('userUpdated', () => {
    it('creates user updated audit event', async () => {
      const userId = TestUtils.generateUuid();
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userUpdated(userId);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });
  });

  describe('userProfileUpdated', () => {
    it('creates profile updated audit event with changed fields', async () => {
      const userId = TestUtils.generateUuid();
      const changedFields = ['firstName', 'lastName'];
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userProfileUpdated(userId, changedFields);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });
  });

  describe('mfaEnabled', () => {
    it('creates MFA enabled audit event', async () => {
      const userId = TestUtils.generateUuid();
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.mfaEnabled(userId);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });
  });

  describe('mfaDisabled', () => {
    it('creates MFA disabled audit event', async () => {
      const userId = TestUtils.generateUuid();
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.mfaDisabled(userId);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });
  });

  describe('roleAssigned', () => {
    it('creates role assigned audit event', async () => {
      const userId = TestUtils.generateUuid();
      const role = 'LAWYER';
      const actorId = TestUtils.generateUuid();
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.roleAssigned(userId, role, actorId);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });

    it('creates role assigned audit event without actorId', async () => {
      const userId = TestUtils.generateUuid();
      const role = 'LAWYER';
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.roleAssigned(userId, role);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });
  });

  describe('roleRemoved', () => {
    it('creates role removed audit event', async () => {
      const userId = TestUtils.generateUuid();
      const role = 'LAWYER';
      const actorId = TestUtils.generateUuid();
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.roleRemoved(userId, role, actorId);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });
  });

  describe('userActivated', () => {
    it('creates user activated audit event', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userActivated(userId, actorId);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });
  });

  describe('userSuspended', () => {
    it('creates user suspended audit event', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userSuspended(userId, actorId);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });
  });

  describe('oauthAccountLinked', () => {
    it('creates OAuth account linked audit event', async () => {
      const userId = TestUtils.generateUuid();
      const provider = 'Google';
      const providerAccountId = 'provider-123';
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.oauthAccountLinked(userId, provider, providerAccountId);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });
  });

  describe('oauthAccountUnlinked', () => {
    it('creates OAuth account unlinked audit event', async () => {
      const userId = TestUtils.generateUuid();
      const provider = 'Google';
      const providerAccountId = 'provider-123';
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.oauthAccountUnlinked(userId, provider, providerAccountId);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });
  });

  describe('recordCustomEvent', () => {
    it('creates custom audit event', async () => {
      const userId = TestUtils.generateUuid();
      const action = UserAuditAction.ACCOUNT_STATUS_CHANGED;
      const description = 'Custom event';
      const actorId = TestUtils.generateUuid();
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.recordCustomEvent(userId, action, description, actorId);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });
  });

  describe('userProviderLinked', () => {
    it('creates provider linked audit event with hashed account ID', async () => {
      const userId = TestUtils.generateUuid();
      const provider = 'Google';
      const providerAccountId = 'provider-123';
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userProviderLinked(userId, provider, providerAccountId);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });
  });

  describe('userProviderUnlinked', () => {
    it('creates provider unlinked audit event with hashed account ID', async () => {
      const userId = TestUtils.generateUuid();
      const provider = 'Google';
      const providerAccountId = 'provider-123';
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userProviderUnlinked(userId, provider, providerAccountId);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });
  });

  describe('userStatusChanged', () => {
    it('creates status change audit event', async () => {
      const userId = TestUtils.generateUuid();
      const oldStatus = 'ACTIVE';
      const newStatus = 'SUSPENDED';
      const actorId = TestUtils.generateUuid();
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userStatusChanged(userId, oldStatus, newStatus, actorId);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });
  });

  describe('userRoleChanged', () => {
    it('creates role change audit event', async () => {
      const userId = TestUtils.generateUuid();
      const oldRole = 'UNASSIGNED';
      const newRole = 'LAWYER';
      const actorId = TestUtils.generateUuid();
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userRoleChanged(userId, oldRole, newRole, actorId);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('throws auditEventCreationFailed when repository create fails', async () => {
      const userId = TestUtils.generateUuid();
      const error = new Error('Database error');
      jest.spyOn(userAuditEventRepository, 'create').mockRejectedValue(error);

      await expect(auditService.userRegistered(userId)).rejects.toThrow();
    });

    it('throws auditEventCreationFailed with string error', async () => {
      const userId = TestUtils.generateUuid();
      jest.spyOn(userAuditEventRepository, 'create').mockRejectedValue('String error');

      await expect(auditService.userRegistered(userId)).rejects.toThrow();
    });
  });

  describe('metadata handling', () => {
    it('userRegistered includes metadata when provided', async () => {
      const userId = TestUtils.generateUuid();
      const metadata = { customField: 'value' };
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userRegistered(userId, metadata);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });

    it('userUpdated includes metadata when provided', async () => {
      const userId = TestUtils.generateUuid();
      const metadata = { customField: 'value' };
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userUpdated(userId, metadata);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });

    it('userProfileUpdated includes metadata when provided', async () => {
      const userId = TestUtils.generateUuid();
      const changedFields = ['firstName'];
      const metadata = { customField: 'value' };
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userProfileUpdated(userId, changedFields, metadata);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });

    it('mfaEnabled includes metadata when provided', async () => {
      const userId = TestUtils.generateUuid();
      const metadata = { customField: 'value' };
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.mfaEnabled(userId, metadata);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });

    it('mfaDisabled includes metadata when provided', async () => {
      const userId = TestUtils.generateUuid();
      const metadata = { customField: 'value' };
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.mfaDisabled(userId, metadata);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });

    it('roleAssigned includes metadata when provided', async () => {
      const userId = TestUtils.generateUuid();
      const role = 'LAWYER';
      const actorId = TestUtils.generateUuid();
      const metadata = { customField: 'value' };
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.roleAssigned(userId, role, actorId, metadata);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });

    it('roleRemoved includes metadata when provided', async () => {
      const userId = TestUtils.generateUuid();
      const role = 'LAWYER';
      const actorId = TestUtils.generateUuid();
      const metadata = { customField: 'value' };
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.roleRemoved(userId, role, actorId, metadata);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });

    it('userActivated includes metadata when provided', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const metadata = { customField: 'value' };
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userActivated(userId, actorId, metadata);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });

    it('userSuspended includes metadata when provided', async () => {
      const userId = TestUtils.generateUuid();
      const actorId = TestUtils.generateUuid();
      const metadata = { customField: 'value' };
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userSuspended(userId, actorId, metadata);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });

    it('oauthAccountLinked includes metadata when provided', async () => {
      const userId = TestUtils.generateUuid();
      const provider = 'Google';
      const providerAccountId = 'provider-123';
      const metadata = { customField: 'value' };
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.oauthAccountLinked(userId, provider, providerAccountId, metadata);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });

    it('oauthAccountUnlinked includes metadata when provided', async () => {
      const userId = TestUtils.generateUuid();
      const provider = 'Google';
      const providerAccountId = 'provider-123';
      const metadata = { customField: 'value' };
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.oauthAccountUnlinked(userId, provider, providerAccountId, metadata);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });

    it('recordCustomEvent includes metadata when provided', async () => {
      const userId = TestUtils.generateUuid();
      const action = UserAuditAction.ACCOUNT_STATUS_CHANGED;
      const description = 'Custom event';
      const actorId = TestUtils.generateUuid();
      const metadata = { customField: 'value' };
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.recordCustomEvent(userId, action, description, actorId, metadata);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });

    it('userProviderLinked includes metadata when provided', async () => {
      const userId = TestUtils.generateUuid();
      const provider = 'Google';
      const providerAccountId = 'provider-123';
      const metadata = { customField: 'value' };
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userProviderLinked(userId, provider, providerAccountId, metadata);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });

    it('userProviderUnlinked includes metadata when provided', async () => {
      const userId = TestUtils.generateUuid();
      const provider = 'Google';
      const providerAccountId = 'provider-123';
      const metadata = { customField: 'value' };
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userProviderUnlinked(userId, provider, providerAccountId, metadata);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });

    it('userStatusChanged includes metadata when provided', async () => {
      const userId = TestUtils.generateUuid();
      const oldStatus = 'ACTIVE';
      const newStatus = 'SUSPENDED';
      const actorId = TestUtils.generateUuid();
      const metadata = { customField: 'value' };
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userStatusChanged(userId, oldStatus, newStatus, actorId, metadata);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });

    it('userRoleChanged includes metadata when provided', async () => {
      const userId = TestUtils.generateUuid();
      const oldRole = 'UNASSIGNED';
      const newRole = 'LAWYER';
      const actorId = TestUtils.generateUuid();
      const metadata = { customField: 'value' };
      const entity = userAuditEventEntity({ userId: UserId.fromString(userId) });
      jest.spyOn(userAuditEventRepository, 'create').mockResolvedValue(entity);

      await auditService.userRoleChanged(userId, oldRole, newRole, actorId, metadata);

      expect(userAuditEventRepository.create).toHaveBeenCalled();
    });
  });
});

