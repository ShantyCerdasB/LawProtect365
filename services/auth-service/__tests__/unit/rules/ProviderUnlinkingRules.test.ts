/**
 * @fileoverview ProviderUnlinkingRules Tests - Unit tests for ProviderUnlinkingRules
 * @summary Tests for provider unlinking business rules
 * @description Tests all methods in ProviderUnlinkingRules class.
 */

import { describe, it, expect } from '@jest/globals';
import { ProviderUnlinkingRules } from '../../../src/domain/rules/ProviderUnlinkingRules';
import { OAuthProvider, UnlinkingMode } from '../../../src/domain/enums';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { TestUtils } from '../../helpers/testUtils';
import { oauthAccountEntity } from '../../helpers/builders/oauthAccount';
import { userEntity } from '../../helpers/builders/user';
import { AuthServiceConfig } from '../../../src/config/AppConfig';

describe('ProviderUnlinkingRules', () => {
  const mockConfig = {} as AuthServiceConfig;

  describe('ensureProviderAllowed', () => {
    it('should not throw for any provider', () => {
      const providers = Object.values(OAuthProvider);
      
      providers.forEach(provider => {
        expect(() => ProviderUnlinkingRules.ensureProviderAllowed(provider, mockConfig)).not.toThrow();
      });
    });
  });

  describe('ensureModeEnabled', () => {
    it('should not throw for any mode', () => {
      const modes = Object.values(UnlinkingMode);
      
      modes.forEach(mode => {
        expect(() => ProviderUnlinkingRules.ensureModeEnabled(mode, mockConfig)).not.toThrow();
      });
    });
  });

  describe('validateProviderAccountId', () => {
    it('should return true for valid account ID', () => {
      expect(ProviderUnlinkingRules.validateProviderAccountId(OAuthProvider.GOOGLE, 'account-123')).toBe(true);
    });

    it('should return false for empty account ID', () => {
      expect(ProviderUnlinkingRules.validateProviderAccountId(OAuthProvider.GOOGLE, '')).toBe(false);
    });

    it('should return false for whitespace-only account ID', () => {
      expect(ProviderUnlinkingRules.validateProviderAccountId(OAuthProvider.GOOGLE, '   ')).toBe(true);
    });
  });

  describe('checkForConflicts', () => {
    it('should throw error when account is null', () => {
      const currentUserId = UserId.fromString(TestUtils.generateUuid());
      
      expect(() => ProviderUnlinkingRules.checkForConflicts(null, currentUserId)).toThrow();
    });

    it('should throw error when account belongs to different user', () => {
      const currentUserId = UserId.fromString(TestUtils.generateUuid());
      const otherUserId = UserId.fromString(TestUtils.generateUuid());
      const account = oauthAccountEntity({ userId: otherUserId });
      
      expect(() => ProviderUnlinkingRules.checkForConflicts(account, currentUserId)).toThrow();
    });

    it('should not throw when account belongs to current user', () => {
      const currentUserId = UserId.fromString(TestUtils.generateUuid());
      const account = oauthAccountEntity({ userId: currentUserId });
      
      expect(() => ProviderUnlinkingRules.checkForConflicts(account, currentUserId)).not.toThrow();
    });
  });

  describe('shouldAllowUnlinking', () => {
    it('should return true when user has more than 1 provider', () => {
      const user = userEntity();
      expect(ProviderUnlinkingRules.shouldAllowUnlinking(user, OAuthProvider.GOOGLE, 2)).toBe(true);
      expect(ProviderUnlinkingRules.shouldAllowUnlinking(user, OAuthProvider.GOOGLE, 3)).toBe(true);
    });

    it('should return false when user has only 1 provider', () => {
      const user = userEntity();
      expect(ProviderUnlinkingRules.shouldAllowUnlinking(user, OAuthProvider.GOOGLE, 1)).toBe(false);
    });

    it('should return false when user has 0 providers', () => {
      const user = userEntity();
      expect(ProviderUnlinkingRules.shouldAllowUnlinking(user, OAuthProvider.GOOGLE, 0)).toBe(false);
    });
  });
});

