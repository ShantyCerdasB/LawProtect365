/**
 * @fileoverview EnumMappers Tests - Unit tests for EnumMappers
 * @summary Tests for enum mapping functions
 * @description Tests all enum mapper methods for type-safe enum conversion.
 */

import { describe, it, expect } from '@jest/globals';
import { EnumMappers } from '../../../src/domain/mappers/EnumMappers';
import { $Enums } from '@prisma/client';

describe('EnumMappers', () => {
  describe('toPrismaUserRole', () => {
    it('should convert valid string to UserRole', () => {
      const validRoles = Object.values($Enums.UserRole);
      
      validRoles.forEach(role => {
        expect(EnumMappers.toPrismaUserRole(role)).toBe(role);
      });
    });

    it('should throw error for invalid UserRole', () => {
      expect(() => EnumMappers.toPrismaUserRole('INVALID_ROLE')).toThrow('Invalid UserRole');
      expect(() => EnumMappers.toPrismaUserRole('')).toThrow('Invalid UserRole');
    });
  });

  describe('toPrismaUserAccountStatus', () => {
    it('should convert valid string to UserAccountStatus', () => {
      const validStatuses = Object.values($Enums.UserAccountStatus);
      
      validStatuses.forEach(status => {
        expect(EnumMappers.toPrismaUserAccountStatus(status)).toBe(status);
      });
    });

    it('should throw error for invalid UserAccountStatus', () => {
      expect(() => EnumMappers.toPrismaUserAccountStatus('INVALID_STATUS')).toThrow('Invalid UserAccountStatus');
      expect(() => EnumMappers.toPrismaUserAccountStatus('')).toThrow('Invalid UserAccountStatus');
    });
  });

  describe('toPrismaOAuthProvider', () => {
    it('should convert valid string to OAuthProvider', () => {
      const validProviders = Object.values($Enums.OAuthProvider);
      
      validProviders.forEach(provider => {
        expect(EnumMappers.toPrismaOAuthProvider(provider)).toBe(provider);
      });
    });

    it('should throw error for invalid OAuthProvider', () => {
      expect(() => EnumMappers.toPrismaOAuthProvider('INVALID_PROVIDER')).toThrow('Invalid OAuthProvider');
      expect(() => EnumMappers.toPrismaOAuthProvider('')).toThrow('Invalid OAuthProvider');
    });
  });

  describe('toPrismaUserRoleArray', () => {
    it('should convert array of valid strings to UserRole array', () => {
      const validRoles = Object.values($Enums.UserRole);
      const result = EnumMappers.toPrismaUserRoleArray(validRoles);
      
      expect(result).toEqual(validRoles);
    });

    it('should handle empty array', () => {
      expect(EnumMappers.toPrismaUserRoleArray([])).toEqual([]);
    });

    it('should throw error for array with invalid role', () => {
      const roles = [Object.values($Enums.UserRole)[0], 'INVALID_ROLE'];
      expect(() => EnumMappers.toPrismaUserRoleArray(roles)).toThrow('Invalid UserRole');
    });
  });

  describe('toPrismaUserAccountStatusArray', () => {
    it('should convert array of valid strings to UserAccountStatus array', () => {
      const validStatuses = Object.values($Enums.UserAccountStatus);
      const result = EnumMappers.toPrismaUserAccountStatusArray(validStatuses);
      
      expect(result).toEqual(validStatuses);
    });

    it('should handle empty array', () => {
      expect(EnumMappers.toPrismaUserAccountStatusArray([])).toEqual([]);
    });

    it('should throw error for array with invalid status', () => {
      const statuses = [Object.values($Enums.UserAccountStatus)[0], 'INVALID_STATUS'];
      expect(() => EnumMappers.toPrismaUserAccountStatusArray(statuses)).toThrow('Invalid UserAccountStatus');
    });
  });

  describe('toPrismaOAuthProviderArray', () => {
    it('should convert array of valid strings to OAuthProvider array', () => {
      const validProviders = Object.values($Enums.OAuthProvider);
      const result = EnumMappers.toPrismaOAuthProviderArray(validProviders);
      
      expect(result).toEqual(validProviders);
    });

    it('should handle empty array', () => {
      expect(EnumMappers.toPrismaOAuthProviderArray([])).toEqual([]);
    });

    it('should throw error for array with invalid provider', () => {
      const providers = [Object.values($Enums.OAuthProvider)[0], 'INVALID_PROVIDER'];
      expect(() => EnumMappers.toPrismaOAuthProviderArray(providers)).toThrow('Invalid OAuthProvider');
    });
  });
});

