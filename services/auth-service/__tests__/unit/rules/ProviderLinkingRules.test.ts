/**
 * @fileoverview ProviderLinkingRules Tests - Unit tests for ProviderLinkingRules
 * @summary Tests for provider linking business rules
 * @description Tests all methods in ProviderLinkingRules class.
 */

import { describe, it, expect } from '@jest/globals';
import { ProviderLinkingRules } from '../../../src/domain/rules/ProviderLinkingRules';
import { OAuthProvider, LinkingMode, UserAccountStatus } from '../../../src/domain/enums';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { AuthServiceConfig } from '../../../src/config/AppConfig';
import { userEntity } from '../../helpers/builders/user';
import { oauthAccountEntity } from '../../helpers/builders/oauthAccount';
import { TestUtils } from '../../helpers/testUtils';

describe('ProviderLinkingRules', () => {
  const mockConfig: AuthServiceConfig = {
    features: {
      providerLinking: {
        allowedProviders: [OAuthProvider.GOOGLE, OAuthProvider.MICROSOFT_365],
        enabledModes: [LinkingMode.DIRECT, LinkingMode.FINALIZE],
        stateTtlSeconds: 300,
        enforceEmailMatch: false,
        maxAttemptsPerHour: 5
      }
    }
  } as AuthServiceConfig;

  describe('ensureProviderAllowed', () => {
    it('should not throw when provider is allowed', () => {
      expect(() => ProviderLinkingRules.ensureProviderAllowed(OAuthProvider.GOOGLE, mockConfig)).not.toThrow();
      expect(() => ProviderLinkingRules.ensureProviderAllowed(OAuthProvider.MICROSOFT_365, mockConfig)).not.toThrow();
    });

    it('should throw error when provider is not allowed', () => {
      expect(() => ProviderLinkingRules.ensureProviderAllowed(OAuthProvider.APPLE, mockConfig)).toThrow('Provider APPLE is not allowed for linking');
    });

    it('should handle empty allowed providers list', () => {
      const emptyConfig = {
        features: {
          providerLinking: {
            allowedProviders: []
          }
        }
      } as unknown as AuthServiceConfig;
      expect(() => ProviderLinkingRules.ensureProviderAllowed(OAuthProvider.GOOGLE, emptyConfig)).toThrow();
    });

    it('should handle missing providerLinking config', () => {
      const noConfig = {} as AuthServiceConfig;
      expect(() => ProviderLinkingRules.ensureProviderAllowed(OAuthProvider.GOOGLE, noConfig)).toThrow();
    });
  });

  describe('validateProviderAccountId', () => {
    it('should return false for empty account ID', () => {
      expect(ProviderLinkingRules.validateProviderAccountId(OAuthProvider.GOOGLE, '')).toBe(false);
      expect(ProviderLinkingRules.validateProviderAccountId(OAuthProvider.GOOGLE, '   ')).toBe(false);
    });

    it('should validate Google account ID format', () => {
      expect(ProviderLinkingRules.validateProviderAccountId(OAuthProvider.GOOGLE, '123456789')).toBe(true);
      expect(ProviderLinkingRules.validateProviderAccountId(OAuthProvider.GOOGLE, 'abc')).toBe(false);
    });

    it('should validate Microsoft 365 account ID format', () => {
      const validGuid = '12345678-1234-1234-1234-123456789012';
      expect(ProviderLinkingRules.validateProviderAccountId(OAuthProvider.MICROSOFT_365, validGuid)).toBe(true);
      expect(ProviderLinkingRules.validateProviderAccountId(OAuthProvider.MICROSOFT_365, 'invalid')).toBe(false);
    });

    it('should validate Apple account ID format', () => {
      expect(ProviderLinkingRules.validateProviderAccountId(OAuthProvider.APPLE, 'user.123-abc')).toBe(true);
      expect(ProviderLinkingRules.validateProviderAccountId(OAuthProvider.APPLE, 'user@123')).toBe(false);
    });

    it('should validate Cognito account ID format', () => {
      const validUuid = '12345678-1234-1234-1234-123456789012';
      expect(ProviderLinkingRules.validateProviderAccountId(OAuthProvider.COGNITO, validUuid)).toBe(true);
      expect(ProviderLinkingRules.validateProviderAccountId(OAuthProvider.COGNITO, 'invalid')).toBe(false);
    });

    it('should return true for unknown providers', () => {
      expect(ProviderLinkingRules.validateProviderAccountId('UNKNOWN' as any, 'any-id')).toBe(true);
    });
  });

  describe('checkForConflicts', () => {
    it('should not throw when no existing account', () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      expect(() => ProviderLinkingRules.checkForConflicts(null, userId)).not.toThrow();
    });

    it('should not throw when account is linked to same user', () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const account = oauthAccountEntity({ userId });
      expect(() => ProviderLinkingRules.checkForConflicts(account, userId)).not.toThrow();
    });

    it('should throw error when account is linked to different user', () => {
      const userId1 = UserId.fromString(TestUtils.generateUuid());
      const userId2 = UserId.fromString(TestUtils.generateUuid());
      const account = oauthAccountEntity({ userId: userId1 });
      expect(() => ProviderLinkingRules.checkForConflicts(account, userId2)).toThrow('OAuth account already linked to another user');
    });
  });

  describe('shouldAllowLinking', () => {
    it('should return true for ACTIVE user', () => {
      const user = userEntity({ status: UserAccountStatus.ACTIVE });
      expect(ProviderLinkingRules.shouldAllowLinking(user, OAuthProvider.GOOGLE)).toBe(true);
    });

    it('should return false for DELETED user', () => {
      const user = userEntity({ status: UserAccountStatus.DELETED });
      expect(ProviderLinkingRules.shouldAllowLinking(user, OAuthProvider.GOOGLE)).toBe(false);
    });

    it('should return false for SUSPENDED user', () => {
      const user = userEntity({ status: UserAccountStatus.SUSPENDED });
      expect(ProviderLinkingRules.shouldAllowLinking(user, OAuthProvider.GOOGLE)).toBe(false);
    });

    it('should return false for INACTIVE user', () => {
      const user = userEntity({ status: UserAccountStatus.INACTIVE });
      expect(ProviderLinkingRules.shouldAllowLinking(user, OAuthProvider.GOOGLE)).toBe(false);
    });

    it('should return true for PENDING_VERIFICATION user', () => {
      const user = userEntity({ status: UserAccountStatus.PENDING_VERIFICATION });
      expect(ProviderLinkingRules.shouldAllowLinking(user, OAuthProvider.GOOGLE)).toBe(true);
    });
  });

  describe('isModeSupported', () => {
    it('should return true when mode is enabled', () => {
      expect(ProviderLinkingRules.isModeSupported(LinkingMode.DIRECT, mockConfig)).toBe(true);
      expect(ProviderLinkingRules.isModeSupported(LinkingMode.FINALIZE, mockConfig)).toBe(true);
    });

    it('should return false when mode is not enabled', () => {
      expect(ProviderLinkingRules.isModeSupported(LinkingMode.REDIRECT, mockConfig)).toBe(false);
    });

    it('should handle empty enabled modes list', () => {
      const emptyConfig = {
        features: {
          providerLinking: {
            enabledModes: []
          }
        }
      } as unknown as AuthServiceConfig;
      expect(ProviderLinkingRules.isModeSupported(LinkingMode.DIRECT, emptyConfig)).toBe(false);
    });
  });

  describe('validateState', () => {
    it('should return false for empty state', () => {
      expect(ProviderLinkingRules.validateState('', mockConfig)).toBe(false);
      expect(ProviderLinkingRules.validateState('   ', mockConfig)).toBe(false);
    });

    it('should return truthy value for valid state', () => {
      const validState = Buffer.from(JSON.stringify({
        userId: TestUtils.generateUuid(),
        timestamp: Date.now(),
        nonce: 'test-nonce'
      })).toString('base64');
      const result = ProviderLinkingRules.validateState(validState, mockConfig);
      expect(result).toBeTruthy();
    });

    it('should return false for invalid base64', () => {
      expect(ProviderLinkingRules.validateState('invalid-base64!!!', mockConfig)).toBe(false);
    });

    it('should return false for state missing required fields', () => {
      const invalidState = Buffer.from(JSON.stringify({
        userId: TestUtils.generateUuid()
      })).toString('base64');
      const result = ProviderLinkingRules.validateState(invalidState, mockConfig);
      expect(result).toBeFalsy();
    });

    it('should return false for invalid JSON in state', () => {
      const invalidState = Buffer.from('not-json').toString('base64');
      expect(ProviderLinkingRules.validateState(invalidState, mockConfig)).toBe(false);
    });
  });

  describe('generateState', () => {
    it('should generate valid state parameter', () => {
      const userId = TestUtils.generateUuid();
      const state = ProviderLinkingRules.generateState(userId, OAuthProvider.GOOGLE, mockConfig);
      
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      expect(decoded.userId).toBe(userId);
      expect(decoded.provider).toBe(OAuthProvider.GOOGLE);
      expect(decoded.timestamp).toBeDefined();
      expect(decoded.nonce).toBeDefined();
    });
  });
});

