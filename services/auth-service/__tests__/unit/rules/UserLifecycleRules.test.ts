/**
 * @fileoverview UserLifecycleRules Tests - Unit tests for UserLifecycleRules
 * @summary Tests for user lifecycle and status transition rules
 * @description Tests all methods in UserLifecycleRules class.
 */

import { describe, it, expect } from '@jest/globals';
import { UserLifecycleRules } from '../../../src/domain/rules/UserLifecycleRules';
import { UserAccountStatus, UserRole } from '../../../src/domain/enums';
import { userEntity } from '../../helpers/builders/user';

describe('UserLifecycleRules', () => {
  describe('isValidTransition', () => {
    it('should return true for valid ACTIVE transitions', () => {
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.ACTIVE, UserAccountStatus.SUSPENDED)).toBe(true);
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.ACTIVE, UserAccountStatus.INACTIVE)).toBe(true);
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.ACTIVE, UserAccountStatus.DELETED)).toBe(true);
    });

    it('should return false for invalid ACTIVE transitions', () => {
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.ACTIVE, UserAccountStatus.PENDING_VERIFICATION)).toBe(false);
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.ACTIVE, UserAccountStatus.ACTIVE)).toBe(false);
    });

    it('should return true for valid SUSPENDED transitions', () => {
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.SUSPENDED, UserAccountStatus.ACTIVE)).toBe(true);
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.SUSPENDED, UserAccountStatus.INACTIVE)).toBe(true);
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.SUSPENDED, UserAccountStatus.DELETED)).toBe(true);
    });

    it('should return true for valid INACTIVE transitions', () => {
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.INACTIVE, UserAccountStatus.ACTIVE)).toBe(true);
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.INACTIVE, UserAccountStatus.SUSPENDED)).toBe(true);
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.INACTIVE, UserAccountStatus.DELETED)).toBe(true);
    });

    it('should return true for valid PENDING_VERIFICATION transitions', () => {
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.PENDING_VERIFICATION, UserAccountStatus.ACTIVE)).toBe(true);
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.PENDING_VERIFICATION, UserAccountStatus.DELETED)).toBe(true);
    });

    it('should return false for invalid PENDING_VERIFICATION transitions', () => {
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.PENDING_VERIFICATION, UserAccountStatus.SUSPENDED)).toBe(false);
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.PENDING_VERIFICATION, UserAccountStatus.INACTIVE)).toBe(false);
    });

    it('should return false for any DELETED transitions', () => {
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.DELETED, UserAccountStatus.ACTIVE)).toBe(false);
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.DELETED, UserAccountStatus.SUSPENDED)).toBe(false);
      expect(UserLifecycleRules.isValidTransition(UserAccountStatus.DELETED, UserAccountStatus.DELETED)).toBe(false);
    });
  });

  describe('validateTransition', () => {
    it('should not throw for valid transitions', () => {
      expect(() => UserLifecycleRules.validateTransition(UserAccountStatus.ACTIVE, UserAccountStatus.SUSPENDED)).not.toThrow();
      expect(() => UserLifecycleRules.validateTransition(UserAccountStatus.SUSPENDED, UserAccountStatus.ACTIVE)).not.toThrow();
    });

    it('should throw error for invalid transitions', () => {
      try {
        UserLifecycleRules.validateTransition(UserAccountStatus.ACTIVE, UserAccountStatus.PENDING_VERIFICATION);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.details?.message).toContain('Invalid transition');
      }
      
      try {
        UserLifecycleRules.validateTransition(UserAccountStatus.DELETED, UserAccountStatus.ACTIVE);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.details?.message).toContain('Invalid transition');
      }
    });
  });

  describe('isPendingVerificationAllowed', () => {
    it('should return true for LAWYER role', () => {
      expect(UserLifecycleRules.isPendingVerificationAllowed(UserRole.LAWYER)).toBe(true);
    });

    it('should return false for non-LAWYER roles', () => {
      expect(UserLifecycleRules.isPendingVerificationAllowed(UserRole.CUSTOMER)).toBe(false);
      expect(UserLifecycleRules.isPendingVerificationAllowed(UserRole.ADMIN)).toBe(false);
      expect(UserLifecycleRules.isPendingVerificationAllowed(UserRole.SUPER_ADMIN)).toBe(false);
    });
  });

  describe('validatePendingVerificationTransition', () => {
    it('should not throw when transitioning to PENDING_VERIFICATION for LAWYER', () => {
      const user = userEntity({ role: UserRole.LAWYER });
      expect(() => UserLifecycleRules.validatePendingVerificationTransition(user, UserAccountStatus.PENDING_VERIFICATION)).not.toThrow();
    });

    it('should throw when transitioning to PENDING_VERIFICATION for non-LAWYER', () => {
      const user = userEntity({ role: UserRole.CUSTOMER });
      try {
        UserLifecycleRules.validatePendingVerificationTransition(user, UserAccountStatus.PENDING_VERIFICATION);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.details?.message).toBe('PENDING_VERIFICATION is only allowed for LAWYER role');
      }
    });

    it('should not throw when transitioning to non-PENDING_VERIFICATION status', () => {
      const user = userEntity({ role: UserRole.CUSTOMER });
      expect(() => UserLifecycleRules.validatePendingVerificationTransition(user, UserAccountStatus.ACTIVE)).not.toThrow();
      expect(() => UserLifecycleRules.validatePendingVerificationTransition(user, UserAccountStatus.SUSPENDED)).not.toThrow();
    });
  });

  describe('getStatusEffects', () => {
    it('should return correct effects for ACTIVE status', () => {
      const effects = UserLifecycleRules.getStatusEffects(UserAccountStatus.ACTIVE);
      expect(effects).toEqual({ enableUser: true, disableUser: false, globalSignOut: false });
    });

    it('should return correct effects for SUSPENDED status', () => {
      const effects = UserLifecycleRules.getStatusEffects(UserAccountStatus.SUSPENDED);
      expect(effects).toEqual({ enableUser: false, disableUser: true, globalSignOut: true });
    });

    it('should return correct effects for INACTIVE status', () => {
      const effects = UserLifecycleRules.getStatusEffects(UserAccountStatus.INACTIVE);
      expect(effects).toEqual({ enableUser: false, disableUser: true, globalSignOut: true });
    });

    it('should return correct effects for DELETED status', () => {
      const effects = UserLifecycleRules.getStatusEffects(UserAccountStatus.DELETED);
      expect(effects).toEqual({ enableUser: false, disableUser: true, globalSignOut: true });
    });

    it('should return correct effects for PENDING_VERIFICATION status', () => {
      const effects = UserLifecycleRules.getStatusEffects(UserAccountStatus.PENDING_VERIFICATION);
      expect(effects).toEqual({ enableUser: false, disableUser: false, globalSignOut: false });
    });

    it('should return default effects for unknown status', () => {
      const effects = UserLifecycleRules.getStatusEffects('UNKNOWN' as any);
      expect(effects).toEqual({ enableUser: false, disableUser: false, globalSignOut: false });
    });
  });
});

