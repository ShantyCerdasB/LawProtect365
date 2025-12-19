/**
 * @fileoverview UserRegistrationRules Tests - Unit tests for UserRegistrationRules
 * @summary Tests for user registration business rules
 * @description Tests all methods in UserRegistrationRules class.
 */

import { describe, it, expect } from '@jest/globals';
import { UserRegistrationRules } from '../../../src/domain/rules/UserRegistrationRules';
import { UserRole, UserAccountStatus } from '../../../src/domain/enums';

describe('UserRegistrationRules', () => {
  describe('determineInitialRole', () => {
    it('should return intended role when valid', () => {
      expect(UserRegistrationRules.determineInitialRole(UserRole.CUSTOMER)).toBe(UserRole.CUSTOMER);
      expect(UserRegistrationRules.determineInitialRole(UserRole.LAWYER)).toBe(UserRole.LAWYER);
    });

    it('should return default role when intended role is UNASSIGNED', () => {
      expect(UserRegistrationRules.determineInitialRole(UserRole.UNASSIGNED)).toBe(UserRole.CUSTOMER);
    });

    it('should return default role when intended role is undefined', () => {
      expect(UserRegistrationRules.determineInitialRole(undefined)).toBe(UserRole.CUSTOMER);
    });

    it('should use custom default role', () => {
      expect(UserRegistrationRules.determineInitialRole(undefined, UserRole.LAWYER)).toBe(UserRole.LAWYER);
    });
  });

  describe('determineInitialStatus', () => {
    it('should return PENDING_VERIFICATION for LAWYER', () => {
      expect(UserRegistrationRules.determineInitialStatus(UserRole.LAWYER)).toBe(UserAccountStatus.PENDING_VERIFICATION);
    });

    it('should return ACTIVE for ADMIN', () => {
      expect(UserRegistrationRules.determineInitialStatus(UserRole.ADMIN)).toBe(UserAccountStatus.ACTIVE);
    });

    it('should return ACTIVE for SUPER_ADMIN', () => {
      expect(UserRegistrationRules.determineInitialStatus(UserRole.SUPER_ADMIN)).toBe(UserAccountStatus.ACTIVE);
    });

    it('should return ACTIVE for CUSTOMER', () => {
      expect(UserRegistrationRules.determineInitialStatus(UserRole.CUSTOMER)).toBe(UserAccountStatus.ACTIVE);
    });

    it('should return ACTIVE for UNASSIGNED', () => {
      expect(UserRegistrationRules.determineInitialStatus(UserRole.UNASSIGNED)).toBe(UserAccountStatus.ACTIVE);
    });

    it('should return ACTIVE for default case', () => {
      expect(UserRegistrationRules.determineInitialStatus('UNKNOWN' as any)).toBe(UserAccountStatus.ACTIVE);
    });
  });

  describe('isValidInitialRole', () => {
    it('should return true for valid roles', () => {
      expect(UserRegistrationRules.isValidInitialRole(UserRole.CUSTOMER)).toBe(true);
      expect(UserRegistrationRules.isValidInitialRole(UserRole.LAWYER)).toBe(true);
      expect(UserRegistrationRules.isValidInitialRole(UserRole.ADMIN)).toBe(true);
      expect(UserRegistrationRules.isValidInitialRole(UserRole.SUPER_ADMIN)).toBe(true);
    });

    it('should return false for UNASSIGNED role', () => {
      expect(UserRegistrationRules.isValidInitialRole(UserRole.UNASSIGNED)).toBe(false);
    });
  });

  describe('getRegistrationFlowDescription', () => {
    it('should return description for LAWYER', () => {
      expect(UserRegistrationRules.getRegistrationFlowDescription(UserRole.LAWYER)).toBe('Lawyer registration requires verification');
    });

    it('should return description for ADMIN', () => {
      expect(UserRegistrationRules.getRegistrationFlowDescription(UserRole.ADMIN)).toBe('Admin registration requires approval');
    });

    it('should return description for SUPER_ADMIN', () => {
      expect(UserRegistrationRules.getRegistrationFlowDescription(UserRole.SUPER_ADMIN)).toBe('Admin registration requires approval');
    });

    it('should return description for CUSTOMER', () => {
      expect(UserRegistrationRules.getRegistrationFlowDescription(UserRole.CUSTOMER)).toBe('Customer registration is immediate');
    });

    it('should return description for UNASSIGNED', () => {
      expect(UserRegistrationRules.getRegistrationFlowDescription(UserRole.UNASSIGNED)).toBe('Unassigned role requires role selection');
    });

    it('should return description for default case', () => {
      expect(UserRegistrationRules.getRegistrationFlowDescription('UNKNOWN' as any)).toBe('Unknown registration flow');
    });
  });

  describe('requiresVerification', () => {
    it('should return true for LAWYER', () => {
      expect(UserRegistrationRules.requiresVerification(UserRole.LAWYER)).toBe(true);
    });

    it('should return false for other roles', () => {
      expect(UserRegistrationRules.requiresVerification(UserRole.CUSTOMER)).toBe(false);
      expect(UserRegistrationRules.requiresVerification(UserRole.ADMIN)).toBe(false);
      expect(UserRegistrationRules.requiresVerification(UserRole.SUPER_ADMIN)).toBe(false);
    });
  });

  describe('canBeImmediatelyActive', () => {
    it('should return true for CUSTOMER', () => {
      expect(UserRegistrationRules.canBeImmediatelyActive(UserRole.CUSTOMER)).toBe(true);
    });

    it('should return true for ADMIN', () => {
      expect(UserRegistrationRules.canBeImmediatelyActive(UserRole.ADMIN)).toBe(true);
    });

    it('should return true for SUPER_ADMIN', () => {
      expect(UserRegistrationRules.canBeImmediatelyActive(UserRole.SUPER_ADMIN)).toBe(true);
    });

    it('should return false for LAWYER', () => {
      expect(UserRegistrationRules.canBeImmediatelyActive(UserRole.LAWYER)).toBe(false);
    });

    it('should return false for UNASSIGNED', () => {
      expect(UserRegistrationRules.canBeImmediatelyActive(UserRole.UNASSIGNED)).toBe(false);
    });
  });

  describe('getNextSteps', () => {
    it('should return steps for UNASSIGNED role', () => {
      const steps = UserRegistrationRules.getNextSteps(UserRole.UNASSIGNED, UserAccountStatus.ACTIVE);
      expect(steps).toContain('Select a role to continue');
    });

    it('should return steps for PENDING_VERIFICATION status', () => {
      const steps = UserRegistrationRules.getNextSteps(UserRole.LAWYER, UserAccountStatus.PENDING_VERIFICATION);
      expect(steps).toContain('Complete verification process');
    });

    it('should return steps for ACTIVE LAWYER', () => {
      const steps = UserRegistrationRules.getNextSteps(UserRole.LAWYER, UserAccountStatus.ACTIVE);
      expect(steps).toContain('Complete lawyer profile setup');
    });

    it('should return empty array for CUSTOMER ACTIVE', () => {
      const steps = UserRegistrationRules.getNextSteps(UserRole.CUSTOMER, UserAccountStatus.ACTIVE);
      expect(steps).toEqual([]);
    });

    it('should return multiple steps when applicable', () => {
      const steps = UserRegistrationRules.getNextSteps(UserRole.LAWYER, UserAccountStatus.PENDING_VERIFICATION);
      expect(steps.length).toBeGreaterThan(0);
    });
  });
});

