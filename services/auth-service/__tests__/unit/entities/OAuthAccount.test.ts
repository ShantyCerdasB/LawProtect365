/**
 * @fileoverview OAuthAccount.test.ts - Unit tests for OAuthAccount entity
 * @summary Tests for OAuthAccount entity behavior
 * @description Tests the OAuthAccount entity including creation, state management, and business methods.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { OAuthAccount } from '../../../src/domain/entities/OAuthAccount';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { OAuthProvider } from '../../../src/domain/enums/OAuthProvider';
import { TestUtils } from '../../helpers/testUtils';

describe('OAuthAccount', () => {
  let userId: UserId;
  let linkedAt: Date;
  let lastUsedAt: Date;

  beforeEach(() => {
    userId = UserId.fromString(TestUtils.generateUuid());
    linkedAt = new Date('2024-01-01T00:00:00Z');
    lastUsedAt = new Date('2024-01-15T00:00:00Z');
  });

  describe('constructor', () => {
    it('should create an OAuthAccount instance with all required fields', () => {
      const account = new OAuthAccount(
        'account-id-123',
        userId,
        OAuthProvider.GOOGLE,
        'provider-id-123',
        'user@google.com',
        'John Doe',
        true,
        linkedAt,
        lastUsedAt
      );

      expect(account.getId()).toBe('account-id-123');
      expect(account.getUserId()).toEqual(userId);
      expect(account.getProvider()).toBe(OAuthProvider.GOOGLE);
      expect(account.getProviderId()).toBe('provider-id-123');
      expect(account.getProviderEmail()).toBe('user@google.com');
      expect(account.getProviderName()).toBe('John Doe');
      expect(account.getIsPrimary()).toBe(true);
      expect(account.getLinkedAt()).toEqual(linkedAt);
      expect(account.getLastUsedAt()).toEqual(lastUsedAt);
    });

    it('should create an OAuthAccount without lastUsedAt', () => {
      const account = new OAuthAccount(
        'account-id-123',
        userId,
        OAuthProvider.MICROSOFT_365,
        'provider-id-456',
        'user@microsoft.com',
        'Jane Smith',
        false,
        linkedAt,
        undefined
      );

      expect(account.getLastUsedAt()).toBeUndefined();
      expect(account.getIsPrimary()).toBe(false);
    });
  });

  describe('fromPersistence', () => {
    it('should create OAuthAccount from persistence data', () => {
      const persistenceData = {
        id: 'account-id-123',
        userId: userId.toString(),
        provider: OAuthProvider.GOOGLE,
        providerId: 'provider-id-123',
        providerEmail: 'user@google.com',
        providerName: 'John Doe',
        isPrimary: true,
        linkedAt,
        lastUsedAt
      };

      const account = OAuthAccount.fromPersistence(persistenceData);

      expect(account.getId()).toBe('account-id-123');
      expect(account.getUserId().toString()).toBe(userId.toString());
      expect(account.getProvider()).toBe(OAuthProvider.GOOGLE);
      expect(account.getProviderId()).toBe('provider-id-123');
      expect(account.getProviderEmail()).toBe('user@google.com');
      expect(account.getProviderName()).toBe('John Doe');
      expect(account.getIsPrimary()).toBe(true);
    });

    it('should handle false isPrimary from persistence', () => {
      const persistenceData = {
        id: 'account-id-123',
        userId: userId.toString(),
        provider: OAuthProvider.APPLE,
        providerId: 'provider-id-456',
        providerEmail: 'user@apple.com',
        providerName: 'Jane Smith',
        isPrimary: false,
        linkedAt,
        lastUsedAt: null
      };

      const account = OAuthAccount.fromPersistence(persistenceData);

      expect(account.getIsPrimary()).toBe(false);
      expect(account.getLastUsedAt()).toBeUndefined();
    });

    it('should default isPrimary to false if not provided', () => {
      const persistenceData = {
        id: 'account-id-123',
        userId: userId.toString(),
        provider: OAuthProvider.GOOGLE,
        providerId: 'provider-id-123',
        providerEmail: 'user@google.com',
        providerName: 'John Doe',
        linkedAt,
        lastUsedAt
      };

      const account = OAuthAccount.fromPersistence(persistenceData);

      expect(account.getIsPrimary()).toBe(false);
    });
  });

  describe('getters', () => {
    let account: OAuthAccount;

    beforeEach(() => {
      account = new OAuthAccount(
        'account-id-123',
        userId,
        OAuthProvider.GOOGLE,
        'provider-id-123',
        'user@google.com',
        'John Doe',
        true,
        linkedAt,
        lastUsedAt
      );
    });

    it('should return correct id', () => {
      expect(account.getId()).toBe('account-id-123');
    });

    it('should return correct userId', () => {
      expect(account.getUserId()).toEqual(userId);
    });

    it('should return correct provider', () => {
      expect(account.getProvider()).toBe(OAuthProvider.GOOGLE);
    });

    it('should return correct providerId', () => {
      expect(account.getProviderId()).toBe('provider-id-123');
    });

    it('should return correct providerEmail', () => {
      expect(account.getProviderEmail()).toBe('user@google.com');
    });

    it('should return correct providerName', () => {
      expect(account.getProviderName()).toBe('John Doe');
    });

    it('should return correct isPrimary', () => {
      expect(account.getIsPrimary()).toBe(true);
    });

    it('should return correct linkedAt', () => {
      expect(account.getLinkedAt()).toEqual(linkedAt);
    });

    it('should return correct lastUsedAt', () => {
      expect(account.getLastUsedAt()).toEqual(lastUsedAt);
    });

    it('should return linkedAt as createdAt', () => {
      expect(account.getCreatedAt()).toEqual(linkedAt);
    });
  });

  describe('updateLastUsed', () => {
    let account: OAuthAccount;

    beforeEach(() => {
      account = new OAuthAccount(
        'account-id-123',
        userId,
        OAuthProvider.GOOGLE,
        'provider-id-123',
        'user@google.com',
        'John Doe',
        true,
        linkedAt,
        undefined
      );
    });

    it('should update lastUsedAt timestamp', () => {
      const beforeUpdate = new Date();
      account.updateLastUsed();
      const afterUpdate = new Date();

      const lastUsed = account.getLastUsedAt();
      expect(lastUsed).toBeDefined();
      expect(lastUsed!.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(lastUsed!.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });
  });

  describe('setAsPrimary', () => {
    let account: OAuthAccount;

    beforeEach(() => {
      account = new OAuthAccount(
        'account-id-123',
        userId,
        OAuthProvider.GOOGLE,
        'provider-id-123',
        'user@google.com',
        'John Doe',
        false,
        linkedAt,
        lastUsedAt
      );
    });

    it('should set account as primary', () => {
      account.setAsPrimary();

      expect(account.getIsPrimary()).toBe(true);
    });
  });

  describe('removePrimaryStatus', () => {
    let account: OAuthAccount;

    beforeEach(() => {
      account = new OAuthAccount(
        'account-id-123',
        userId,
        OAuthProvider.GOOGLE,
        'provider-id-123',
        'user@google.com',
        'John Doe',
        true,
        linkedAt,
        lastUsedAt
      );
    });

    it('should remove primary status', () => {
      account.removePrimaryStatus();

      expect(account.getIsPrimary()).toBe(false);
    });
  });

  describe('different providers', () => {
    it('should create account for Microsoft 365', () => {
      const account = new OAuthAccount(
        'account-id-123',
        userId,
        OAuthProvider.MICROSOFT_365,
        'provider-id-123',
        'user@microsoft.com',
        'Jane Smith',
        false,
        linkedAt,
        undefined
      );

      expect(account.getProvider()).toBe(OAuthProvider.MICROSOFT_365);
    });

    it('should create account for Apple', () => {
      const account = new OAuthAccount(
        'account-id-123',
        userId,
        OAuthProvider.APPLE,
        'provider-id-123',
        'user@icloud.com',
        'Bob Apple',
        false,
        linkedAt,
        undefined
      );

      expect(account.getProvider()).toBe(OAuthProvider.APPLE);
    });

    it('should create account for Cognito', () => {
      const account = new OAuthAccount(
        'account-id-123',
        userId,
        OAuthProvider.COGNITO,
        'provider-id-123',
        'user@cognito.com',
        'Cognito User',
        false,
        linkedAt,
        undefined
      );

      expect(account.getProvider()).toBe(OAuthProvider.COGNITO);
    });
  });
});

