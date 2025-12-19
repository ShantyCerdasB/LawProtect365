/**
 * @fileoverview TypeGuards Tests - Unit tests for TypeGuards
 * @summary Tests for type guard functions
 * @description Tests all type guard methods for Prisma enum validation.
 */

import { describe, it, expect } from '@jest/globals';
import { TypeGuards } from '../../../src/domain/guards/TypeGuards';
import { $Enums } from '@prisma/client';

describe('TypeGuards', () => {
  describe('isValidUserRole', () => {
    it('should return true for valid UserRole', () => {
      const validRoles = Object.values($Enums.UserRole);
      
      validRoles.forEach(role => {
        expect(TypeGuards.isValidUserRole(role)).toBe(true);
      });
    });

    it('should return false for invalid UserRole', () => {
      expect(TypeGuards.isValidUserRole('INVALID_ROLE')).toBe(false);
      expect(TypeGuards.isValidUserRole('')).toBe(false);
      expect(TypeGuards.isValidUserRole('customer')).toBe(false);
    });
  });

  describe('isValidUserAccountStatus', () => {
    it('should return true for valid UserAccountStatus', () => {
      const validStatuses = Object.values($Enums.UserAccountStatus);
      
      validStatuses.forEach(status => {
        expect(TypeGuards.isValidUserAccountStatus(status)).toBe(true);
      });
    });

    it('should return false for invalid UserAccountStatus', () => {
      expect(TypeGuards.isValidUserAccountStatus('INVALID_STATUS')).toBe(false);
      expect(TypeGuards.isValidUserAccountStatus('')).toBe(false);
      expect(TypeGuards.isValidUserAccountStatus('active')).toBe(false);
    });
  });

  describe('isValidOAuthProvider', () => {
    it('should return true for valid OAuthProvider', () => {
      const validProviders = Object.values($Enums.OAuthProvider);
      
      validProviders.forEach(provider => {
        expect(TypeGuards.isValidOAuthProvider(provider)).toBe(true);
      });
    });

    it('should return false for invalid OAuthProvider', () => {
      expect(TypeGuards.isValidOAuthProvider('INVALID_PROVIDER')).toBe(false);
      expect(TypeGuards.isValidOAuthProvider('')).toBe(false);
      expect(TypeGuards.isValidOAuthProvider('google')).toBe(false);
    });
  });

  describe('isValidUserRoleArray', () => {
    it('should return true for array of valid UserRoles', () => {
      const validRoles = Object.values($Enums.UserRole);
      expect(TypeGuards.isValidUserRoleArray(validRoles)).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(TypeGuards.isValidUserRoleArray([])).toBe(true);
    });

    it('should return false for array with invalid role', () => {
      const roles = [Object.values($Enums.UserRole)[0], 'INVALID_ROLE'];
      expect(TypeGuards.isValidUserRoleArray(roles)).toBe(false);
    });

    it('should return false for array with all invalid roles', () => {
      expect(TypeGuards.isValidUserRoleArray(['INVALID1', 'INVALID2'])).toBe(false);
    });
  });

  describe('isValidUserAccountStatusArray', () => {
    it('should return true for array of valid UserAccountStatuses', () => {
      const validStatuses = Object.values($Enums.UserAccountStatus);
      expect(TypeGuards.isValidUserAccountStatusArray(validStatuses)).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(TypeGuards.isValidUserAccountStatusArray([])).toBe(true);
    });

    it('should return false for array with invalid status', () => {
      const statuses = [Object.values($Enums.UserAccountStatus)[0], 'INVALID_STATUS'];
      expect(TypeGuards.isValidUserAccountStatusArray(statuses)).toBe(false);
    });
  });

  describe('isValidOAuthProviderArray', () => {
    it('should return true for array of valid OAuthProviders', () => {
      const validProviders = Object.values($Enums.OAuthProvider);
      expect(TypeGuards.isValidOAuthProviderArray(validProviders)).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(TypeGuards.isValidOAuthProviderArray([])).toBe(true);
    });

    it('should return false for array with invalid provider', () => {
      const providers = [Object.values($Enums.OAuthProvider)[0], 'INVALID_PROVIDER'];
      expect(TypeGuards.isValidOAuthProviderArray(providers)).toBe(false);
    });
  });

  describe('safeToUserRole', () => {
    it('should return UserRole for valid string', () => {
      const validRole = Object.values($Enums.UserRole)[0];
      const result = TypeGuards.safeToUserRole(validRole);
      
      expect(result).toBe(validRole);
    });

    it('should return undefined for invalid string', () => {
      expect(TypeGuards.safeToUserRole('INVALID_ROLE')).toBeUndefined();
      expect(TypeGuards.safeToUserRole('')).toBeUndefined();
    });
  });

  describe('safeToUserAccountStatus', () => {
    it('should return UserAccountStatus for valid string', () => {
      const validStatus = Object.values($Enums.UserAccountStatus)[0];
      const result = TypeGuards.safeToUserAccountStatus(validStatus);
      
      expect(result).toBe(validStatus);
    });

    it('should return undefined for invalid string', () => {
      expect(TypeGuards.safeToUserAccountStatus('INVALID_STATUS')).toBeUndefined();
      expect(TypeGuards.safeToUserAccountStatus('')).toBeUndefined();
    });
  });

  describe('safeToOAuthProvider', () => {
    it('should return OAuthProvider for valid string', () => {
      const validProvider = Object.values($Enums.OAuthProvider)[0];
      const result = TypeGuards.safeToOAuthProvider(validProvider);
      
      expect(result).toBe(validProvider);
    });

    it('should return undefined for invalid string', () => {
      expect(TypeGuards.safeToOAuthProvider('INVALID_PROVIDER')).toBeUndefined();
      expect(TypeGuards.safeToOAuthProvider('')).toBeUndefined();
    });
  });
});

