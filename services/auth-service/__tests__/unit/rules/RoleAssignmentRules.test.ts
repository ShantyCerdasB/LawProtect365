/**
 * @fileoverview RoleAssignmentRules Tests - Unit tests for RoleAssignmentRules
 * @summary Tests for role assignment business rules
 * @description Tests all methods in RoleAssignmentRules class.
 */

import { describe, it, expect } from '@jest/globals';
import { RoleAssignmentRules } from '../../../src/domain/rules/RoleAssignmentRules';
import { UserRole, UserAccountStatus } from '../../../src/domain/enums';

describe('RoleAssignmentRules', () => {
  describe('validateRoleAssignment', () => {
    it('should throw error for DELETED user status', () => {
      try {
        RoleAssignmentRules.validateRoleAssignment(
          UserRole.ADMIN,
          UserAccountStatus.DELETED,
          UserRole.CUSTOMER,
          []
        );
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.details).toBe('Cannot assign roles to deleted users');
        expect(error.message).toBe('Invalid role assignment');
      }
    });

    it('should throw error for PENDING_VERIFICATION user status', () => {
      try {
        RoleAssignmentRules.validateRoleAssignment(
          UserRole.ADMIN,
          UserAccountStatus.PENDING_VERIFICATION,
          UserRole.CUSTOMER,
          []
        );
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.details).toBe('Cannot assign roles to unverified users');
        expect(error.message).toBe('Invalid role assignment');
      }
    });

    it('should not throw for ACTIVE user status', () => {
      expect(() => RoleAssignmentRules.validateRoleAssignment(
        UserRole.ADMIN,
        UserAccountStatus.ACTIVE,
        UserRole.CUSTOMER,
        []
      )).not.toThrow();
    });

    it('should validate role hierarchy', () => {
      expect(() => RoleAssignmentRules.validateRoleAssignment(
        UserRole.CUSTOMER,
        UserAccountStatus.ACTIVE,
        UserRole.ADMIN,
        []
      )).toThrow();
    });

    it('should validate role conflicts when SUPER_ADMIN has other roles', () => {
      expect(() => RoleAssignmentRules.validateRoleAssignment(
        UserRole.SUPER_ADMIN,
        UserAccountStatus.ACTIVE,
        UserRole.SUPER_ADMIN,
        [UserRole.CUSTOMER]
      )).toThrow();
    });

    it('should validate role conflicts when assigning to SUPER_ADMIN user', () => {
      expect(() => RoleAssignmentRules.validateRoleAssignment(
        UserRole.SUPER_ADMIN,
        UserAccountStatus.ACTIVE,
        UserRole.CUSTOMER,
        [UserRole.SUPER_ADMIN]
      )).toThrow();
    });
  });

  describe('validateRoleRemoval', () => {
    it('should throw error when removing last role', () => {
      try {
        RoleAssignmentRules.validateRoleRemoval(
          UserRole.ADMIN,
          UserRole.CUSTOMER,
          [UserRole.CUSTOMER]
        );
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.details).toBe('Cannot remove the last role from a user');
        expect(error.message).toBe('Invalid role assignment');
      }
    });

    it('should not throw when multiple roles exist', () => {
      expect(() => RoleAssignmentRules.validateRoleRemoval(
        UserRole.ADMIN,
        UserRole.CUSTOMER,
        [UserRole.CUSTOMER, UserRole.LAWYER]
      )).not.toThrow();
    });

    it('should validate role hierarchy for removal', () => {
      expect(() => RoleAssignmentRules.validateRoleRemoval(
        UserRole.CUSTOMER,
        UserRole.ADMIN,
        [UserRole.ADMIN, UserRole.CUSTOMER]
      )).toThrow();
    });
  });

  describe('getMinimumRoleLevel', () => {
    it('should return ADMIN for CUSTOMER', () => {
      expect(RoleAssignmentRules.getMinimumRoleLevel(UserRole.CUSTOMER)).toBe(UserRole.ADMIN);
    });

    it('should return ADMIN for LAWYER', () => {
      expect(RoleAssignmentRules.getMinimumRoleLevel(UserRole.LAWYER)).toBe(UserRole.ADMIN);
    });

    it('should return SUPER_ADMIN for ADMIN', () => {
      expect(RoleAssignmentRules.getMinimumRoleLevel(UserRole.ADMIN)).toBe(UserRole.SUPER_ADMIN);
    });

    it('should return SUPER_ADMIN for SUPER_ADMIN', () => {
      expect(RoleAssignmentRules.getMinimumRoleLevel(UserRole.SUPER_ADMIN)).toBe(UserRole.SUPER_ADMIN);
    });

    it('should return ADMIN for UNASSIGNED', () => {
      expect(RoleAssignmentRules.getMinimumRoleLevel(UserRole.UNASSIGNED)).toBe(UserRole.ADMIN);
    });

    it('should return ADMIN for EXTERNAL_USER', () => {
      expect(RoleAssignmentRules.getMinimumRoleLevel(UserRole.EXTERNAL_USER)).toBe(UserRole.ADMIN);
    });
  });
});

