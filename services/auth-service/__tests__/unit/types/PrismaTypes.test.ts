/**
 * @fileoverview PrismaTypes Tests - Unit tests for PrismaTypes
 * @summary Tests for Prisma type aliases and enum extractors
 * @description Tests type aliases and utility methods for Prisma enum extraction.
 */

import { describe, it, expect } from '@jest/globals';
import { PrismaEnumExtractor } from '../../../src/domain/types/PrismaTypes';
import { $Enums } from '@prisma/client';

describe('PrismaEnumExtractor', () => {
  describe('getUserRoleValues', () => {
    it('should return all UserRole values', () => {
      const values = PrismaEnumExtractor.getUserRoleValues();

      expect(values).toBeDefined();
      expect(Array.isArray(values)).toBe(true);
      expect(values.length).toBeGreaterThan(0);
      expect(values).toEqual(Object.values($Enums.UserRole));
    });
  });

  describe('getUserAccountStatusValues', () => {
    it('should return all UserAccountStatus values', () => {
      const values = PrismaEnumExtractor.getUserAccountStatusValues();

      expect(values).toBeDefined();
      expect(Array.isArray(values)).toBe(true);
      expect(values.length).toBeGreaterThan(0);
      expect(values).toEqual(Object.values($Enums.UserAccountStatus));
    });
  });

  describe('getOAuthProviderValues', () => {
    it('should return all OAuthProvider values', () => {
      const values = PrismaEnumExtractor.getOAuthProviderValues();

      expect(values).toBeDefined();
      expect(Array.isArray(values)).toBe(true);
      expect(values.length).toBeGreaterThan(0);
      expect(values).toEqual(Object.values($Enums.OAuthProvider));
    });
  });
});

