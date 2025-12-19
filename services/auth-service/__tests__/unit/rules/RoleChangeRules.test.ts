/**
 * @fileoverview RoleChangeRules Tests - Unit tests for RoleChangeRules
 * @summary Tests for role change business rules
 * @description Tests all methods in RoleChangeRules class.
 */

import { describe, it, expect } from '@jest/globals';
import { RoleChangeRules } from '../../../src/domain/rules/RoleChangeRules';
import { UserRole } from '../../../src/domain/enums';
import { TestUtils } from '../../helpers/testUtils';
import { userEntity } from '../../helpers/builders/user';
import { UserId } from '../../../src/domain/value-objects/UserId';

describe('RoleChangeRules', () => {
  describe('validateRoleChange', () => {
    it('should throw error when actor tries to change own role', () => {
      const actorId = TestUtils.generateUuid();
      const targetUser = userEntity({ id: UserId.fromString(actorId) });
      
      expect(() => RoleChangeRules.validateRoleChange(UserRole.ADMIN, targetUser, UserRole.CUSTOMER, actorId)).toThrow();
    });

    it('should throw error when ADMIN tries to change SUPER_ADMIN role', () => {
      const actorId = TestUtils.generateUuid();
      const targetUserId = TestUtils.generateUuid();
      const targetUser = userEntity({ 
        id: UserId.fromString(targetUserId),
        role: UserRole.SUPER_ADMIN 
      });
      
      expect(() => RoleChangeRules.validateRoleChange(UserRole.ADMIN, targetUser, UserRole.CUSTOMER, actorId)).toThrow();
    });

    it('should throw error when ADMIN tries to assign SUPER_ADMIN role', () => {
      const actorId = TestUtils.generateUuid();
      const targetUserId = TestUtils.generateUuid();
      const targetUser = userEntity({ 
        id: UserId.fromString(targetUserId),
        role: UserRole.CUSTOMER 
      });
      
      expect(() => RoleChangeRules.validateRoleChange(UserRole.ADMIN, targetUser, UserRole.SUPER_ADMIN, actorId)).toThrow();
    });

    it('should throw error when ADMIN tries to change other ADMIN role', () => {
      const actorId = TestUtils.generateUuid();
      const targetUserId = TestUtils.generateUuid();
      const targetUser = userEntity({ 
        id: UserId.fromString(targetUserId),
        role: UserRole.ADMIN 
      });
      
      expect(() => RoleChangeRules.validateRoleChange(UserRole.ADMIN, targetUser, UserRole.CUSTOMER, actorId)).toThrow();
    });

    it('should not throw when SUPER_ADMIN changes any role', () => {
      const actorId = TestUtils.generateUuid();
      const targetUserId = TestUtils.generateUuid();
      const targetUser = userEntity({ id: UserId.fromString(targetUserId) });
      
      expect(() => RoleChangeRules.validateRoleChange(UserRole.SUPER_ADMIN, targetUser, UserRole.ADMIN, actorId)).not.toThrow();
    });
  });

  describe('validateRoleTransition', () => {
    it('should not throw when role does not change', () => {
      expect(() => RoleChangeRules.validateRoleTransition(UserRole.CUSTOMER, UserRole.CUSTOMER)).not.toThrow();
    });

    it('should throw error when assigning EXTERNAL_USER to existing user', () => {
      try {
        RoleChangeRules.validateRoleTransition(UserRole.CUSTOMER, UserRole.EXTERNAL_USER);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.details?.message).toBe('Cannot assign EXTERNAL_USER role to existing users');
      }
    });

    it('should not throw when assigning EXTERNAL_USER from UNASSIGNED', () => {
      expect(() => RoleChangeRules.validateRoleTransition(UserRole.UNASSIGNED, UserRole.EXTERNAL_USER)).not.toThrow();
    });

    it('should throw error with first message when assigning EXTERNAL_USER', () => {
      try {
        RoleChangeRules.validateRoleTransition(UserRole.LAWYER, UserRole.EXTERNAL_USER);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.details?.message).toBe('Cannot assign EXTERNAL_USER role to existing users');
      }
    });

    it('should allow valid role transitions', () => {
      expect(() => RoleChangeRules.validateRoleTransition(UserRole.CUSTOMER, UserRole.LAWYER)).not.toThrow();
      expect(() => RoleChangeRules.validateRoleTransition(UserRole.LAWYER, UserRole.CUSTOMER)).not.toThrow();
    });
  });

  describe('isMfaRequiredForRole', () => {
    it('should return true for SUPER_ADMIN', () => {
      expect(RoleChangeRules.isMfaRequiredForRole(UserRole.SUPER_ADMIN)).toBe(true);
    });

    it('should return false for other roles', () => {
      expect(RoleChangeRules.isMfaRequiredForRole(UserRole.CUSTOMER)).toBe(false);
      expect(RoleChangeRules.isMfaRequiredForRole(UserRole.LAWYER)).toBe(false);
      expect(RoleChangeRules.isMfaRequiredForRole(UserRole.ADMIN)).toBe(false);
    });
  });

  describe('getRoleChangeEffects', () => {
    it('should require MFA for SUPER_ADMIN', () => {
      const effects = RoleChangeRules.getRoleChangeEffects(UserRole.SUPER_ADMIN);
      expect(effects.mfaRequired).toBe(true);
      expect(effects.globalSignOut).toBe(true);
    });

    it('should not require MFA for other roles', () => {
      const effects = RoleChangeRules.getRoleChangeEffects(UserRole.CUSTOMER);
      expect(effects.mfaRequired).toBe(false);
      expect(effects.globalSignOut).toBe(true);
    });

    it('should always require global sign out', () => {
      const roles = Object.values(UserRole);
      roles.forEach(role => {
        const effects = RoleChangeRules.getRoleChangeEffects(role);
        expect(effects.globalSignOut).toBe(true);
      });
    });
  });
});

