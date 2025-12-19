/**
 * @fileoverview AdminVisibilityRules Tests - Unit tests for AdminVisibilityRules
 * @summary Tests for admin visibility business rules
 * @description Tests all methods in AdminVisibilityRules class.
 */

import { describe, it, expect } from '@jest/globals';
import { AdminVisibilityRules } from '../../../src/domain/rules/AdminVisibilityRules';
import { UserRole } from '../../../src/domain/enums';
import { TestUtils } from '../../helpers/testUtils';
import { userEntity } from '../../helpers/builders/user';
import { UserId } from '../../../src/domain/value-objects/UserId';

describe('AdminVisibilityRules', () => {
  describe('canViewUser', () => {
    it('should return true when SUPER_ADMIN views any role', () => {
      const roles = Object.values(UserRole);
      
      roles.forEach(targetRole => {
        expect(AdminVisibilityRules.canViewUser(UserRole.SUPER_ADMIN, targetRole)).toBe(true);
      });
    });

    it('should return true when ADMIN views non-SUPER_ADMIN roles', () => {
      expect(AdminVisibilityRules.canViewUser(UserRole.ADMIN, UserRole.ADMIN)).toBe(true);
      expect(AdminVisibilityRules.canViewUser(UserRole.ADMIN, UserRole.CUSTOMER)).toBe(true);
      expect(AdminVisibilityRules.canViewUser(UserRole.ADMIN, UserRole.LAWYER)).toBe(true);
    });

    it('should return false when ADMIN views SUPER_ADMIN', () => {
      expect(AdminVisibilityRules.canViewUser(UserRole.ADMIN, UserRole.SUPER_ADMIN)).toBe(false);
    });

    it('should return false for non-admin roles', () => {
      expect(AdminVisibilityRules.canViewUser(UserRole.CUSTOMER, UserRole.CUSTOMER)).toBe(false);
      expect(AdminVisibilityRules.canViewUser(UserRole.LAWYER, UserRole.CUSTOMER)).toBe(false);
    });
  });

  describe('getVisibleRoles', () => {
    it('should return all roles for SUPER_ADMIN', () => {
      const roles = AdminVisibilityRules.getVisibleRoles(UserRole.SUPER_ADMIN);
      
      expect(roles).toEqual(Object.values(UserRole));
    });

    it('should return all roles except SUPER_ADMIN for ADMIN', () => {
      const roles = AdminVisibilityRules.getVisibleRoles(UserRole.ADMIN);
      
      expect(roles).not.toContain(UserRole.SUPER_ADMIN);
      expect(roles.length).toBe(Object.values(UserRole).length - 1);
    });

    it('should return empty array for non-admin roles', () => {
      expect(AdminVisibilityRules.getVisibleRoles(UserRole.CUSTOMER)).toEqual([]);
      expect(AdminVisibilityRules.getVisibleRoles(UserRole.LAWYER)).toEqual([]);
    });
  });

  describe('hasAdminPrivileges', () => {
    it('should return true for ADMIN and SUPER_ADMIN', () => {
      expect(AdminVisibilityRules.hasAdminPrivileges(UserRole.ADMIN)).toBe(true);
      expect(AdminVisibilityRules.hasAdminPrivileges(UserRole.SUPER_ADMIN)).toBe(true);
    });

    it('should return false for non-admin roles', () => {
      expect(AdminVisibilityRules.hasAdminPrivileges(UserRole.CUSTOMER)).toBe(false);
      expect(AdminVisibilityRules.hasAdminPrivileges(UserRole.LAWYER)).toBe(false);
    });
  });

  describe('validateUserVisibility', () => {
    it('should throw error when viewer tries to view themselves', () => {
      const viewerId = TestUtils.generateUuid();
      const targetUser = userEntity({ id: UserId.fromString(viewerId) });
      
      try {
        AdminVisibilityRules.validateUserVisibility(UserRole.ADMIN, targetUser, viewerId);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.details?.message).toBe('Use /me endpoint for self-lookup');
      }
    });

    it('should throw error when ADMIN tries to view SUPER_ADMIN', () => {
      const viewerId = TestUtils.generateUuid();
      const targetUserId = TestUtils.generateUuid();
      const targetUser = userEntity({ 
        id: UserId.fromString(targetUserId),
        role: UserRole.SUPER_ADMIN 
      });
      
      try {
        AdminVisibilityRules.validateUserVisibility(UserRole.ADMIN, targetUser, viewerId);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.details?.message).toBe('Insufficient permissions to view this user');
      }
    });

    it('should not throw when SUPER_ADMIN views any user', () => {
      const viewerId = TestUtils.generateUuid();
      const targetUserId = TestUtils.generateUuid();
      const targetUser = userEntity({ id: UserId.fromString(targetUserId) });
      
      expect(() => AdminVisibilityRules.validateUserVisibility(UserRole.SUPER_ADMIN, targetUser, viewerId)).not.toThrow();
    });

    it('should not throw when ADMIN views non-SUPER_ADMIN user', () => {
      const viewerId = TestUtils.generateUuid();
      const targetUserId = TestUtils.generateUuid();
      const targetUser = userEntity({ 
        id: UserId.fromString(targetUserId),
        role: UserRole.CUSTOMER 
      });
      
      expect(() => AdminVisibilityRules.validateUserVisibility(UserRole.ADMIN, targetUser, viewerId)).not.toThrow();
    });

    it('should throw error when non-admin tries to view user', () => {
      const viewerId = TestUtils.generateUuid();
      const targetUserId = TestUtils.generateUuid();
      const targetUser = userEntity({ id: UserId.fromString(targetUserId) });
      
      try {
        AdminVisibilityRules.validateUserVisibility(UserRole.CUSTOMER, targetUser, viewerId);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.details?.message).toBe('Insufficient permissions to view this user');
      }
    });
  });
});

