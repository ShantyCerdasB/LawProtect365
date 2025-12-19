/**
 * @fileoverview UserAccessRules Tests - Unit tests for UserAccessRules
 * @summary Tests for user access control rules
 * @description Tests all methods in UserAccessRules class.
 */

import { describe, it, expect } from '@jest/globals';
import { UserAccessRules } from '../../../src/domain/rules/UserAccessRules';
import { UserAccountStatus } from '../../../src/domain/enums';
import { AccessErrorCode } from '../../../src/domain/enums/AccessErrorCode';

describe('UserAccessRules', () => {
  describe('canSignIn', () => {
    it('should allow sign in for ACTIVE status', () => {
      const result = UserAccessRules.canSignIn(UserAccountStatus.ACTIVE);
      expect(result.canSignIn).toBe(true);
      expect(result.denyReason).toBeUndefined();
      expect(result.errorCode).toBeUndefined();
    });

    it('should allow sign in for PENDING_VERIFICATION when allowed', () => {
      const result = UserAccessRules.canSignIn(UserAccountStatus.PENDING_VERIFICATION, true);
      expect(result.canSignIn).toBe(true);
    });

    it('should deny sign in for PENDING_VERIFICATION when not allowed', () => {
      const result = UserAccessRules.canSignIn(UserAccountStatus.PENDING_VERIFICATION, false);
      expect(result.canSignIn).toBe(false);
      expect(result.denyReason).toBe('Account pending verification');
      expect(result.errorCode).toBe(AccessErrorCode.PENDING_VERIFICATION_BLOCKED);
    });

    it('should deny sign in for INACTIVE status', () => {
      const result = UserAccessRules.canSignIn(UserAccountStatus.INACTIVE);
      expect(result.canSignIn).toBe(false);
      expect(result.denyReason).toBe('Account is inactive');
      expect(result.errorCode).toBe(AccessErrorCode.ACCOUNT_INACTIVE);
    });

    it('should deny sign in for SUSPENDED status', () => {
      const result = UserAccessRules.canSignIn(UserAccountStatus.SUSPENDED);
      expect(result.canSignIn).toBe(false);
      expect(result.denyReason).toBe('Account is suspended');
      expect(result.errorCode).toBe(AccessErrorCode.ACCOUNT_SUSPENDED);
    });

    it('should deny sign in for DELETED status', () => {
      const result = UserAccessRules.canSignIn(UserAccountStatus.DELETED);
      expect(result.canSignIn).toBe(false);
      expect(result.denyReason).toBe('Account is deleted');
      expect(result.errorCode).toBe(AccessErrorCode.ACCOUNT_DELETED);
    });

    it('should handle unknown status with default case', () => {
      const result = UserAccessRules.canSignIn('UNKNOWN_STATUS' as any);
      expect(result.canSignIn).toBe(false);
      expect(result.denyReason).toBe('Unknown account status');
      expect(result.errorCode).toBe(AccessErrorCode.UNKNOWN_STATUS);
    });
  });

  describe('validateUserAccess', () => {
    it('should not throw for ACTIVE status', () => {
      expect(() => UserAccessRules.validateUserAccess(UserAccountStatus.ACTIVE)).not.toThrow();
    });

    it('should not throw for PENDING_VERIFICATION when allowed', () => {
      expect(() => UserAccessRules.validateUserAccess(UserAccountStatus.PENDING_VERIFICATION, true)).not.toThrow();
    });

    it('should throw userLifecycleViolation for PENDING_VERIFICATION when not allowed', () => {
      expect(() => UserAccessRules.validateUserAccess(UserAccountStatus.PENDING_VERIFICATION, false)).toThrow();
    });

    it('should throw accountSuspended for SUSPENDED status', () => {
      expect(() => UserAccessRules.validateUserAccess(UserAccountStatus.SUSPENDED)).toThrow();
    });

    it('should throw accountDeleted for DELETED status', () => {
      expect(() => UserAccessRules.validateUserAccess(UserAccountStatus.DELETED)).toThrow();
    });

    it('should throw userLifecycleViolation for INACTIVE status', () => {
      expect(() => UserAccessRules.validateUserAccess(UserAccountStatus.INACTIVE)).toThrow();
    });
  });

  describe('getStatusDescription', () => {
    it('should return description for ACTIVE', () => {
      expect(UserAccessRules.getStatusDescription(UserAccountStatus.ACTIVE)).toBe('Account is active and can sign in');
    });

    it('should return description for PENDING_VERIFICATION', () => {
      expect(UserAccessRules.getStatusDescription(UserAccountStatus.PENDING_VERIFICATION)).toBe('Account is pending verification');
    });

    it('should return description for INACTIVE', () => {
      expect(UserAccessRules.getStatusDescription(UserAccountStatus.INACTIVE)).toBe('Account is inactive and cannot sign in');
    });

    it('should return description for SUSPENDED', () => {
      expect(UserAccessRules.getStatusDescription(UserAccountStatus.SUSPENDED)).toBe('Account is suspended and cannot sign in');
    });

    it('should return description for DELETED', () => {
      expect(UserAccessRules.getStatusDescription(UserAccountStatus.DELETED)).toBe('Account is deleted and cannot sign in');
    });

    it('should return default description for unknown status', () => {
      expect(UserAccessRules.getStatusDescription('UNKNOWN' as any)).toBe('Unknown account status');
    });
  });

  describe('getAccessPolicyDescription', () => {
    it('should include PENDING_VERIFICATION when allowed', () => {
      const description = UserAccessRules.getAccessPolicyDescription(true);
      expect(description).toContain('PENDING_VERIFICATION');
    });

    it('should exclude PENDING_VERIFICATION when not allowed', () => {
      const description = UserAccessRules.getAccessPolicyDescription(false);
      expect(description).not.toContain('PENDING_VERIFICATION');
    });

    it('should include ACTIVE in allowed statuses', () => {
      const description = UserAccessRules.getAccessPolicyDescription(true);
      expect(description).toContain('ACTIVE');
    });

    it('should include denied statuses', () => {
      const description = UserAccessRules.getAccessPolicyDescription(true);
      expect(description).toContain('INACTIVE');
      expect(description).toContain('SUSPENDED');
      expect(description).toContain('DELETED');
    });
  });

  describe('isStatusTransitionAllowed', () => {
    it('should allow PENDING_VERIFICATION to ACTIVE', () => {
      expect(UserAccessRules.isStatusTransitionAllowed(UserAccountStatus.PENDING_VERIFICATION, UserAccountStatus.ACTIVE)).toBe(true);
    });

    it('should allow ACTIVE to INACTIVE', () => {
      expect(UserAccessRules.isStatusTransitionAllowed(UserAccountStatus.ACTIVE, UserAccountStatus.INACTIVE)).toBe(true);
    });

    it('should allow ACTIVE to SUSPENDED', () => {
      expect(UserAccessRules.isStatusTransitionAllowed(UserAccountStatus.ACTIVE, UserAccountStatus.SUSPENDED)).toBe(true);
    });

    it('should allow INACTIVE to ACTIVE', () => {
      expect(UserAccessRules.isStatusTransitionAllowed(UserAccountStatus.INACTIVE, UserAccountStatus.ACTIVE)).toBe(true);
    });

    it('should allow SUSPENDED to ACTIVE', () => {
      expect(UserAccessRules.isStatusTransitionAllowed(UserAccountStatus.SUSPENDED, UserAccountStatus.ACTIVE)).toBe(true);
    });

    it('should not allow DELETED to any status', () => {
      expect(UserAccessRules.isStatusTransitionAllowed(UserAccountStatus.DELETED, UserAccountStatus.ACTIVE)).toBe(false);
    });

    it('should not allow invalid transitions', () => {
      expect(UserAccessRules.isStatusTransitionAllowed(UserAccountStatus.ACTIVE, UserAccountStatus.PENDING_VERIFICATION)).toBe(false);
      expect(UserAccessRules.isStatusTransitionAllowed(UserAccountStatus.PENDING_VERIFICATION, UserAccountStatus.SUSPENDED)).toBe(false);
    });

    it('should handle unknown status with fallback', () => {
      expect(UserAccessRules.isStatusTransitionAllowed('UNKNOWN' as any, UserAccountStatus.ACTIVE)).toBe(false);
    });
  });

  describe('getBlockedStatuses', () => {
    it('should return blocked statuses', () => {
      const blocked = UserAccessRules.getBlockedStatuses();
      expect(blocked).toContain(UserAccountStatus.INACTIVE);
      expect(blocked).toContain(UserAccountStatus.SUSPENDED);
      expect(blocked).toContain(UserAccountStatus.DELETED);
    });
  });

  describe('getAllowedStatuses', () => {
    it('should include ACTIVE and PENDING_VERIFICATION when allowed', () => {
      const allowed = UserAccessRules.getAllowedStatuses(true);
      expect(allowed).toContain(UserAccountStatus.ACTIVE);
      expect(allowed).toContain(UserAccountStatus.PENDING_VERIFICATION);
    });

    it('should only include ACTIVE when PENDING_VERIFICATION not allowed', () => {
      const allowed = UserAccessRules.getAllowedStatuses(false);
      expect(allowed).toContain(UserAccountStatus.ACTIVE);
      expect(allowed).not.toContain(UserAccountStatus.PENDING_VERIFICATION);
    });
  });
});

