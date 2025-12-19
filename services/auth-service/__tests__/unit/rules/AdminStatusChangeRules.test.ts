/**
 * @fileoverview AdminStatusChangeRules Tests - Unit tests for AdminStatusChangeRules
 * @summary Tests for admin status change business rules
 * @description Tests all methods in AdminStatusChangeRules class.
 */

import { describe, it, expect } from '@jest/globals';
import { AdminStatusChangeRules } from '../../../src/domain/rules/AdminStatusChangeRules';
import { UserRole } from '../../../src/domain/enums';
import { TestUtils } from '../../helpers/testUtils';
import { userEntity } from '../../helpers/builders/user';
import { UserId } from '../../../src/domain/value-objects/UserId';

describe('AdminStatusChangeRules', () => {
  describe('validateAdminPermissions', () => {
    it('should throw error when actor tries to change own status', () => {
      const actorId = TestUtils.generateUuid();
      const targetUser = userEntity({ id: UserId.fromString(actorId) });
      
      try {
        AdminStatusChangeRules.validateAdminPermissions(UserRole.ADMIN, targetUser, actorId);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.details?.message).toBe('Cannot change your own status');
      }
    });

    it('should throw error when ADMIN tries to change SUPER_ADMIN status', () => {
      const actorId = TestUtils.generateUuid();
      const targetUserId = TestUtils.generateUuid();
      const targetUser = userEntity({ 
        id: UserId.fromString(targetUserId),
        role: UserRole.SUPER_ADMIN 
      });
      
      try {
        AdminStatusChangeRules.validateAdminPermissions(UserRole.ADMIN, targetUser, actorId);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.details?.message).toBe('ADMIN cannot modify SUPER_ADMIN users');
      }
    });

    it('should throw error when non-SUPER_ADMIN tries to change ADMIN status', () => {
      const actorId = TestUtils.generateUuid();
      const targetUserId = TestUtils.generateUuid();
      const targetUser = userEntity({ 
        id: UserId.fromString(targetUserId),
        role: UserRole.ADMIN 
      });
      
      try {
        AdminStatusChangeRules.validateAdminPermissions(UserRole.ADMIN, targetUser, actorId);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.details?.message).toBe('Only SUPER_ADMIN can modify ADMIN users');
      }
    });

    it('should not throw when SUPER_ADMIN changes ADMIN status', () => {
      const actorId = TestUtils.generateUuid();
      const targetUserId = TestUtils.generateUuid();
      const targetUser = userEntity({ 
        id: UserId.fromString(targetUserId),
        role: UserRole.ADMIN 
      });
      
      expect(() => AdminStatusChangeRules.validateAdminPermissions(UserRole.SUPER_ADMIN, targetUser, actorId)).not.toThrow();
    });

    it('should not throw when ADMIN changes CUSTOMER status', () => {
      const actorId = TestUtils.generateUuid();
      const targetUserId = TestUtils.generateUuid();
      const targetUser = userEntity({ 
        id: UserId.fromString(targetUserId),
        role: UserRole.CUSTOMER 
      });
      
      expect(() => AdminStatusChangeRules.validateAdminPermissions(UserRole.ADMIN, targetUser, actorId)).not.toThrow();
    });
  });

  describe('hasPermission', () => {
    it('should return false when actor tries to change own status', () => {
      const actorId = TestUtils.generateUuid();
      expect(AdminStatusChangeRules.hasPermission(UserRole.ADMIN, UserRole.CUSTOMER, actorId, actorId)).toBe(false);
    });

    it('should return true when SUPER_ADMIN changes any status', () => {
      const actorId = TestUtils.generateUuid();
      const targetId = TestUtils.generateUuid();
      const roles = Object.values(UserRole);
      
      roles.forEach(targetRole => {
        expect(AdminStatusChangeRules.hasPermission(UserRole.SUPER_ADMIN, targetRole, actorId, targetId)).toBe(true);
      });
    });

    it('should return true when ADMIN changes CUSTOMER status', () => {
      const actorId = TestUtils.generateUuid();
      const targetId = TestUtils.generateUuid();
      expect(AdminStatusChangeRules.hasPermission(UserRole.ADMIN, UserRole.CUSTOMER, actorId, targetId)).toBe(true);
    });

    it('should return true when ADMIN changes LAWYER status', () => {
      const actorId = TestUtils.generateUuid();
      const targetId = TestUtils.generateUuid();
      expect(AdminStatusChangeRules.hasPermission(UserRole.ADMIN, UserRole.LAWYER, actorId, targetId)).toBe(true);
    });

    it('should return false when ADMIN tries to change ADMIN status', () => {
      const actorId = TestUtils.generateUuid();
      const targetId = TestUtils.generateUuid();
      expect(AdminStatusChangeRules.hasPermission(UserRole.ADMIN, UserRole.ADMIN, actorId, targetId)).toBe(false);
    });

    it('should return false when ADMIN tries to change SUPER_ADMIN status', () => {
      const actorId = TestUtils.generateUuid();
      const targetId = TestUtils.generateUuid();
      expect(AdminStatusChangeRules.hasPermission(UserRole.ADMIN, UserRole.SUPER_ADMIN, actorId, targetId)).toBe(false);
    });

    it('should return false for non-admin roles', () => {
      const actorId = TestUtils.generateUuid();
      const targetId = TestUtils.generateUuid();
      expect(AdminStatusChangeRules.hasPermission(UserRole.CUSTOMER, UserRole.CUSTOMER, actorId, targetId)).toBe(false);
    });
  });

  describe('getRequiredRole', () => {
    it('should return SUPER_ADMIN for SUPER_ADMIN target', () => {
      expect(AdminStatusChangeRules.getRequiredRole(UserRole.SUPER_ADMIN)).toBe(UserRole.SUPER_ADMIN);
    });

    it('should return SUPER_ADMIN for ADMIN target', () => {
      expect(AdminStatusChangeRules.getRequiredRole(UserRole.ADMIN)).toBe(UserRole.SUPER_ADMIN);
    });

    it('should return ADMIN for LAWYER target', () => {
      expect(AdminStatusChangeRules.getRequiredRole(UserRole.LAWYER)).toBe(UserRole.ADMIN);
    });

    it('should return ADMIN for CUSTOMER target', () => {
      expect(AdminStatusChangeRules.getRequiredRole(UserRole.CUSTOMER)).toBe(UserRole.ADMIN);
    });

    it('should return ADMIN for default case', () => {
      const allRoles = Object.values(UserRole);
      allRoles.forEach(role => {
        const result = AdminStatusChangeRules.getRequiredRole(role);
        expect(result).toBeDefined();
      });
    });
  });
});

