/**
 * @fileoverview ClaimsMappingRules Tests - Unit tests for ClaimsMappingRules
 * @summary Tests for JWT claims mapping rules
 * @description Tests all methods in ClaimsMappingRules class.
 */

import { describe, it, expect } from '@jest/globals';
import { ClaimsMappingRules } from '../../../src/domain/rules/ClaimsMappingRules';
import { UserRole, UserAccountStatus } from '../../../src/domain/enums';
import { UserClaimsData, MfaClaimsData } from '../../../src/domain/interfaces';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { TestUtils } from '../../helpers/testUtils';

describe('ClaimsMappingRules', () => {
  const userClaimsData: UserClaimsData = {
    userId: UserId.fromString(TestUtils.generateUuid()),
    role: UserRole.CUSTOMER,
    status: UserAccountStatus.ACTIVE
  };

  const mfaClaimsData: MfaClaimsData = {
    isMfaRequired: false,
    isMfaEnabled: false
  };

  describe('buildCoreClaims', () => {
    it('should build core claims with role, status, and user_id', () => {
      const claims = ClaimsMappingRules.buildCoreClaims(userClaimsData);
      expect(claims['custom:role']).toBe(UserRole.CUSTOMER);
      expect(claims['custom:account_status']).toBe(UserAccountStatus.ACTIVE);
      expect(claims['custom:user_id']).toBe(userClaimsData.userId.toString());
    });
  });

  describe('buildMfaClaims', () => {
    it('should build MFA claims with is_mfa_required and mfa_enabled', () => {
      const claims = ClaimsMappingRules.buildMfaClaims(mfaClaimsData);
      expect(claims['custom:is_mfa_required']).toBe(false);
      expect(claims['custom:mfa_enabled']).toBe(false);
    });

    it('should build MFA claims with true values', () => {
      const data: MfaClaimsData = { isMfaRequired: true, isMfaEnabled: true };
      const claims = ClaimsMappingRules.buildMfaClaims(data);
      expect(claims['custom:is_mfa_required']).toBe(true);
      expect(claims['custom:mfa_enabled']).toBe(true);
    });
  });

  describe('buildAllClaims', () => {
    it('should combine core and MFA claims', () => {
      const claims = ClaimsMappingRules.buildAllClaims(userClaimsData, mfaClaimsData);
      expect(claims['custom:role']).toBe(UserRole.CUSTOMER);
      expect(claims['custom:account_status']).toBe(UserAccountStatus.ACTIVE);
      expect(claims['custom:user_id']).toBe(userClaimsData.userId.toString());
      expect(claims['custom:is_mfa_required']).toBe(false);
      expect(claims['custom:mfa_enabled']).toBe(false);
    });
  });

  describe('toClaimsOverrideDetails', () => {
    it('should create claims override details with claims', () => {
      const claims = { 'custom:role': UserRole.CUSTOMER };
      const details = ClaimsMappingRules.toClaimsOverrideDetails(claims);
      expect(details.claimsToAddOrOverride).toEqual(claims);
      expect(details.claimsToSuppress).toEqual([]);
    });

    it('should include claimsToSuppress when provided', () => {
      const claims = { 'custom:role': UserRole.CUSTOMER };
      const suppress = ['custom:old_claim'];
      const details = ClaimsMappingRules.toClaimsOverrideDetails(claims, suppress);
      expect(details.claimsToSuppress).toEqual(suppress);
    });
  });

  describe('validateClaims', () => {
    it('should return true for valid claims', () => {
      const claims = {
        'custom:role': UserRole.CUSTOMER,
        'custom:account_status': UserAccountStatus.ACTIVE,
        'custom:user_id': TestUtils.generateUuid()
      };
      expect(ClaimsMappingRules.validateClaims(claims)).toBe(true);
    });

    it('should return false when missing required claims', () => {
      const claims = { 'custom:role': UserRole.CUSTOMER };
      expect(ClaimsMappingRules.validateClaims(claims)).toBe(false);
    });

    it('should return false when claim values are not strings', () => {
      const claims = {
        'custom:role': 123,
        'custom:account_status': UserAccountStatus.ACTIVE,
        'custom:user_id': TestUtils.generateUuid()
      };
      expect(ClaimsMappingRules.validateClaims(claims)).toBe(false);
    });
  });

  describe('getDefaultClaims', () => {
    it('should return default claims structure', () => {
      const claims = ClaimsMappingRules.getDefaultClaims();
      expect(claims['custom:role']).toBe(UserRole.UNASSIGNED);
      expect(claims['custom:account_status']).toBe(UserAccountStatus.PENDING_VERIFICATION);
      expect(claims['custom:user_id']).toBe('');
      expect(claims['custom:is_mfa_required']).toBe(false);
      expect(claims['custom:mfa_enabled']).toBe(false);
    });
  });

  describe('isMfaRequiredByPolicy', () => {
    it('should return customMfaRequired when provided', () => {
      expect(ClaimsMappingRules.isMfaRequiredByPolicy(UserRole.CUSTOMER, true)).toBe(true);
      expect(ClaimsMappingRules.isMfaRequiredByPolicy(UserRole.CUSTOMER, false)).toBe(false);
    });

    it('should return true for SUPER_ADMIN when customMfaRequired not provided', () => {
      expect(ClaimsMappingRules.isMfaRequiredByPolicy(UserRole.SUPER_ADMIN)).toBe(true);
    });

    it('should return false for non-SUPER_ADMIN when customMfaRequired not provided', () => {
      expect(ClaimsMappingRules.isMfaRequiredByPolicy(UserRole.CUSTOMER)).toBe(false);
    });
  });

  describe('getClaimsSizeEstimate', () => {
    it('should return size estimate for claims', () => {
      const claims = { 'custom:role': UserRole.CUSTOMER };
      const size = ClaimsMappingRules.getClaimsSizeEstimate(claims);
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThan(0);
    });
  });

  describe('filterEssentialClaims', () => {
    it('should filter to essential claims only', () => {
      const claims = {
        'custom:role': UserRole.CUSTOMER,
        'custom:account_status': UserAccountStatus.ACTIVE,
        'custom:user_id': TestUtils.generateUuid(),
        'custom:is_mfa_required': false,
        'custom:mfa_enabled': false,
        'custom:extra': 'should be removed'
      };
      const filtered = ClaimsMappingRules.filterEssentialClaims(claims);
      expect(filtered).not.toHaveProperty('custom:extra');
      expect(filtered).toHaveProperty('custom:role');
      expect(filtered).toHaveProperty('custom:account_status');
      expect(filtered).toHaveProperty('custom:user_id');
      expect(filtered).toHaveProperty('custom:is_mfa_required');
      expect(filtered).toHaveProperty('custom:mfa_enabled');
    });
  });
});

