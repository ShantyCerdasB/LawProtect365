/**
 * @fileoverview UserVisibilityRules Tests - Unit tests for UserVisibilityRules
 * @summary Tests for user visibility and data exposure rules
 * @description Tests all methods in UserVisibilityRules class.
 */

import { describe, it, expect } from '@jest/globals';
import { UserVisibilityRules } from '../../../src/domain/rules/UserVisibilityRules';
import { UserRole, UserAccountStatus } from '../../../src/domain/enums';
import { userEntity } from '../../helpers/builders/user';
import { userPersonalInfoEntity } from '../../helpers/builders/userPersonalInfo';

describe('UserVisibilityRules', () => {
  describe('getMfaStatus', () => {
    it('should return required true for SUPER_ADMIN', () => {
      const user = userEntity({ role: UserRole.SUPER_ADMIN, mfaEnabled: false });
      const status = UserVisibilityRules.getMfaStatus(user);
      expect(status.required).toBe(true);
      expect(status.enabled).toBe(false);
    });

    it('should return required false for non-SUPER_ADMIN', () => {
      const user = userEntity({ role: UserRole.CUSTOMER, mfaEnabled: true });
      const status = UserVisibilityRules.getMfaStatus(user);
      expect(status.required).toBe(false);
      expect(status.enabled).toBe(true);
    });

    it('should return enabled status from user', () => {
      const user = userEntity({ mfaEnabled: true });
      const status = UserVisibilityRules.getMfaStatus(user);
      expect(status.enabled).toBe(true);
    });
  });

  describe('getIdentityInfo', () => {
    it('should return cognitoSub', () => {
      const user = userEntity();
      const info = UserVisibilityRules.getIdentityInfo(user);
      expect(info).toHaveProperty('cognitoSub');
      expect(typeof info.cognitoSub).toBe('string');
    });
  });

  describe('getPersonalInfo', () => {
    it('should return null when personalInfo is null', () => {
      const user = userEntity();
      const result = UserVisibilityRules.getPersonalInfo(user, null);
      expect(result).toBeNull();
    });

    it('should return personal info when provided', () => {
      const user = userEntity();
      const personalInfo = userPersonalInfoEntity({ userId: user.getId() });
      const result = UserVisibilityRules.getPersonalInfo(user, personalInfo);
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('phone');
      expect(result).toHaveProperty('locale');
      expect(result).toHaveProperty('timeZone');
    });
  });

  describe('getClaimsInfo', () => {
    it('should return claims info with role and status', () => {
      const user = userEntity({ role: UserRole.CUSTOMER });
      const info = UserVisibilityRules.getClaimsInfo(user);
      expect(info.role).toBe(UserRole.CUSTOMER);
      expect(info.account_status).toBe(user.getStatus());
      expect(info.user_id).toBe(user.getId().toString());
    });

    it('should return is_mfa_required true for SUPER_ADMIN', () => {
      const user = userEntity({ role: UserRole.SUPER_ADMIN, mfaEnabled: false });
      const info = UserVisibilityRules.getClaimsInfo(user);
      expect(info.is_mfa_required).toBe(true);
    });

    it('should return is_mfa_required false for non-SUPER_ADMIN', () => {
      const user = userEntity({ role: UserRole.CUSTOMER });
      const info = UserVisibilityRules.getClaimsInfo(user);
      expect(info.is_mfa_required).toBe(false);
    });

    it('should return mfa_enabled from user', () => {
      const user = userEntity({ mfaEnabled: true });
      const info = UserVisibilityRules.getClaimsInfo(user);
      expect(info.mfa_enabled).toBe(true);
    });
  });

  describe('getMetaInfo', () => {
    it('should return meta info with timestamps', () => {
      const user = userEntity();
      const info = UserVisibilityRules.getMetaInfo(user);
      expect(info).toHaveProperty('createdAt');
      expect(info).toHaveProperty('updatedAt');
      expect(info.lastLoginAt).toBeNull();
    });

    it('should return lastLoginAt when available', () => {
      const lastLoginAt = new Date();
      const user = userEntity({ lastLoginAt });
      const info = UserVisibilityRules.getMetaInfo(user);
      expect(info.lastLoginAt).toBe(lastLoginAt.toISOString());
    });
  });

  describe('shouldIncludePendingVerificationHeader', () => {
    it('should return true for PENDING_VERIFICATION LAWYER', () => {
      const user = userEntity({ 
        role: UserRole.LAWYER, 
        status: UserAccountStatus.PENDING_VERIFICATION 
      });
      expect(UserVisibilityRules.shouldIncludePendingVerificationHeader(user)).toBe(true);
    });

    it('should return false for non-LAWYER', () => {
      const user = userEntity({ 
        role: UserRole.CUSTOMER, 
        status: UserAccountStatus.PENDING_VERIFICATION 
      });
      expect(UserVisibilityRules.shouldIncludePendingVerificationHeader(user)).toBe(false);
    });

    it('should return false for ACTIVE LAWYER', () => {
      const user = userEntity({ 
        role: UserRole.LAWYER, 
        status: UserAccountStatus.ACTIVE 
      });
      expect(UserVisibilityRules.shouldIncludePendingVerificationHeader(user)).toBe(false);
    });
  });

  describe('getDisplayName', () => {
    it('should return firstName and lastName when both present', () => {
      const user = userEntity({ firstName: 'John', lastName: 'Doe' });
      expect(UserVisibilityRules.getDisplayName(user)).toBe('John Doe');
    });

    it('should return firstName when lastName missing', () => {
      const user = userEntity({ firstName: 'John', lastName: '' });
      expect(UserVisibilityRules.getDisplayName(user)).toBe('John');
    });

    it('should return email when name missing', () => {
      const user = userEntity({ firstName: '', lastName: '' });
      const displayName = UserVisibilityRules.getDisplayName(user);
      expect(displayName).toBe(user.getEmail().toString());
    });

    it('should return email when everything missing', () => {
      const user = userEntity({ firstName: '', lastName: '' });
      const email = user.getEmail().toString();
      const displayName = UserVisibilityRules.getDisplayName(user);
      expect(displayName).toBe(email);
    });

    it('should return firstName when lastName is empty string', () => {
      const user = userEntity({ firstName: 'Jane', lastName: '' });
      expect(UserVisibilityRules.getDisplayName(user)).toBe('Jane');
    });

    it('should return email when firstName is empty but lastName exists', () => {
      const user = userEntity({ firstName: '', lastName: 'Smith' });
      expect(UserVisibilityRules.getDisplayName(user)).toBe(user.getEmail().toString());
    });
  });
});

