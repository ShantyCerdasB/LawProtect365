/**
 * @fileoverview User.test.ts - Unit tests for User entity
 * @summary Tests for User entity behavior and business logic
 * @description Tests the User entity including creation, state management, and business methods.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { User } from '../../../src/domain/entities/User';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { CognitoSub } from '../../../src/domain/value-objects/CognitoSub';
import { Email } from '@lawprotect/shared-ts';
import { UserRole, UserAccountStatus } from '../../../src/domain/enums';
import { TestUtils } from '../../helpers/testUtils';

describe('User', () => {
  let userId: UserId;
  let cognitoSub: CognitoSub;
  let email: Email;
  let createdAt: Date;
  let updatedAt: Date;

  beforeEach(() => {
    userId = UserId.fromString(TestUtils.generateUuid());
    cognitoSub = CognitoSub.fromString(TestUtils.generateCognitoSub());
    email = Email.fromString(TestUtils.createTestEmail());
    createdAt = new Date('2024-01-01T00:00:00Z');
    updatedAt = new Date('2024-01-01T00:00:00Z');
  });

  describe('constructor', () => {
    it('should create a User instance with all required fields', () => {
      const user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.ACTIVE,
        UserRole.CUSTOMER,
        false,
        undefined,
        createdAt,
        updatedAt
      );

      expect(user.getId()).toEqual(userId);
      expect(user.getCognitoSub()).toEqual(cognitoSub);
      expect(user.getEmail()).toEqual(email);
      expect(user.getFirstName()).toBe('John');
      expect(user.getLastName()).toBe('Doe');
      expect(user.getStatus()).toBe(UserAccountStatus.ACTIVE);
      expect(user.getRole()).toBe(UserRole.CUSTOMER);
      expect(user.isMfaEnabled()).toBe(false);
      expect(user.getLastLoginAt()).toBeUndefined();
    });

    it('should create a User with MFA enabled', () => {
      const user = new User(
        userId,
        cognitoSub,
        email,
        'Jane',
        'Smith',
        UserAccountStatus.ACTIVE,
        UserRole.LAWYER,
        true,
        new Date('2024-01-02T00:00:00Z'),
        createdAt,
        updatedAt
      );

      expect(user.isMfaEnabled()).toBe(true);
      expect(user.getLastLoginAt()).toEqual(new Date('2024-01-02T00:00:00Z'));
    });
  });

  describe('fromPersistence', () => {
    it('should create User from persistence data', () => {
      const persistenceData = {
        id: userId.toString(),
        cognitoSub: cognitoSub.toString(),
        email: email.toString(),
        givenName: 'John',
        lastName: 'Doe',
        status: UserAccountStatus.ACTIVE,
        role: UserRole.CUSTOMER,
        mfaEnabled: false,
        lastLoginAt: null,
        createdAt,
        updatedAt
      };

      const user = User.fromPersistence(persistenceData);

      expect(user.getId().toString()).toBe(userId.toString());
      expect(user.getCognitoSub().toString()).toBe(cognitoSub.toString());
      expect(user.getFirstName()).toBe('John');
      expect(user.getLastName()).toBe('Doe');
      expect(user.getStatus()).toBe(UserAccountStatus.ACTIVE);
      expect(user.getRole()).toBe(UserRole.CUSTOMER);
    });

    it('should handle null givenName and lastName', () => {
      const persistenceData = {
        id: userId.toString(),
        cognitoSub: cognitoSub.toString(),
        email: email.toString(),
        givenName: null,
        lastName: null,
        status: UserAccountStatus.ACTIVE,
        role: UserRole.CUSTOMER,
        mfaEnabled: false,
        lastLoginAt: undefined,
        createdAt,
        updatedAt
      };

      const user = User.fromPersistence(persistenceData);

      expect(user.getFirstName()).toBe('');
      expect(user.getLastName()).toBe('');
    });

    it('should handle lastLoginAt from persistence', () => {
      const lastLoginDate = new Date('2024-01-15T00:00:00Z');
      const persistenceData = {
        id: userId.toString(),
        cognitoSub: cognitoSub.toString(),
        email: email.toString(),
        givenName: 'John',
        lastName: 'Doe',
        status: UserAccountStatus.ACTIVE,
        role: UserRole.CUSTOMER,
        mfaEnabled: true,
        lastLoginAt: lastLoginDate,
        createdAt,
        updatedAt
      };

      const user = User.fromPersistence(persistenceData);

      expect(user.getLastLoginAt()).toEqual(lastLoginDate);
    });
  });

  describe('getters', () => {
    let user: User;

    beforeEach(() => {
      user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.ACTIVE,
        UserRole.CUSTOMER,
        false,
        undefined,
        createdAt,
        updatedAt
      );
    });

    it('should return correct id', () => {
      expect(user.getId()).toEqual(userId);
    });

    it('should return correct cognitoSub', () => {
      expect(user.getCognitoSub()).toEqual(cognitoSub);
    });

    it('should return correct email', () => {
      expect(user.getEmail()).toEqual(email);
    });

    it('should return correct first name', () => {
      expect(user.getFirstName()).toBe('John');
    });

    it('should return correct last name', () => {
      expect(user.getLastName()).toBe('Doe');
    });

    it('should return full name', () => {
      expect(user.getFullName()).toBe('John Doe');
    });

    it('should return correct status', () => {
      expect(user.getStatus()).toBe(UserAccountStatus.ACTIVE);
    });

    it('should return correct role', () => {
      expect(user.getRole()).toBe(UserRole.CUSTOMER);
    });

    it('should return roles array', () => {
      expect(user.getRoles()).toEqual([UserRole.CUSTOMER]);
    });

    it('should return correct createdAt', () => {
      expect(user.getCreatedAt()).toEqual(createdAt);
    });

    it('should return correct updatedAt', () => {
      expect(user.getUpdatedAt()).toEqual(updatedAt);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the role', () => {
      const user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.ACTIVE,
        UserRole.ADMIN,
        false,
        undefined,
        createdAt,
        updatedAt
      );

      expect(user.hasRole(UserRole.ADMIN)).toBe(true);
    });

    it('should return false when user does not have the role', () => {
      const user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.ACTIVE,
        UserRole.CUSTOMER,
        false,
        undefined,
        createdAt,
        updatedAt
      );

      expect(user.hasRole(UserRole.ADMIN)).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has one of the roles', () => {
      const user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.ACTIVE,
        UserRole.LAWYER,
        false,
        undefined,
        createdAt,
        updatedAt
      );

      expect(user.hasAnyRole([UserRole.CUSTOMER, UserRole.LAWYER])).toBe(true);
    });

    it('should return false when user has none of the roles', () => {
      const user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.ACTIVE,
        UserRole.CUSTOMER,
        false,
        undefined,
        createdAt,
        updatedAt
      );

      expect(user.hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN])).toBe(false);
    });
  });

  describe('status checks', () => {
    it('should correctly identify active user', () => {
      const user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.ACTIVE,
        UserRole.CUSTOMER,
        false,
        undefined,
        createdAt,
        updatedAt
      );

      expect(user.isActive()).toBe(true);
      expect(user.isSuspended()).toBe(false);
      expect(user.isDeleted()).toBe(false);
      expect(user.isPendingVerification()).toBe(false);
    });

    it('should correctly identify suspended user', () => {
      const user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.SUSPENDED,
        UserRole.CUSTOMER,
        false,
        undefined,
        createdAt,
        updatedAt
      );

      expect(user.isActive()).toBe(false);
      expect(user.isSuspended()).toBe(true);
    });

    it('should correctly identify deleted user', () => {
      const user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.DELETED,
        UserRole.CUSTOMER,
        false,
        undefined,
        createdAt,
        updatedAt
      );

      expect(user.isDeleted()).toBe(true);
      expect(user.isActive()).toBe(false);
    });

    it('should correctly identify pending verification user', () => {
      const user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.PENDING_VERIFICATION,
        UserRole.CUSTOMER,
        false,
        undefined,
        createdAt,
        updatedAt
      );

      expect(user.isPendingVerification()).toBe(true);
      expect(user.isActive()).toBe(false);
    });
  });

  describe('updateStatus', () => {
    let user: User;

    beforeEach(() => {
      user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.ACTIVE,
        UserRole.CUSTOMER,
        false,
        undefined,
        createdAt,
        updatedAt
      );
    });

    it('should update user status', () => {
      user.updateStatus(UserAccountStatus.SUSPENDED);

      expect(user.getStatus()).toBe(UserAccountStatus.SUSPENDED);
      expect(user.isSuspended()).toBe(true);
    });

    it('should update status with reason', () => {
      user.updateStatus(UserAccountStatus.INACTIVE, 'User requested deactivation');

      expect(user.getStatus()).toBe(UserAccountStatus.INACTIVE);
    });

    it('should update status with suspendUntil date', () => {
      const suspendUntil = new Date('2024-12-31T23:59:59Z');
      user.updateStatus(UserAccountStatus.SUSPENDED, 'Violation of terms', suspendUntil);

      expect(user.getStatus()).toBe(UserAccountStatus.SUSPENDED);
    });

    it('should set deletedAt when status is DELETED', () => {
      user.updateStatus(UserAccountStatus.DELETED, 'Account deletion requested');

      expect(user.getStatus()).toBe(UserAccountStatus.DELETED);
      expect(user.isDeleted()).toBe(true);
    });
  });

  describe('updateRole', () => {
    let user: User;

    beforeEach(() => {
      user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.ACTIVE,
        UserRole.CUSTOMER,
        false,
        undefined,
        createdAt,
        updatedAt
      );
    });

    it('should update user role', () => {
      user.updateRole(UserRole.LAWYER);

      expect(user.getRole()).toBe(UserRole.LAWYER);
      expect(user.hasRole(UserRole.LAWYER)).toBe(true);
    });
  });

  describe('updateLastLogin', () => {
    let user: User;

    beforeEach(() => {
      user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.ACTIVE,
        UserRole.CUSTOMER,
        false,
        undefined,
        createdAt,
        updatedAt
      );
    });

    it('should update last login timestamp', () => {
      const beforeUpdate = new Date();
      user.updateLastLogin();
      const afterUpdate = new Date();

      const lastLogin = user.getLastLoginAt();
      expect(lastLogin).toBeDefined();
      expect(lastLogin!.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(lastLogin!.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });
  });

  describe('updateMfaEnabled', () => {
    let user: User;

    beforeEach(() => {
      user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.ACTIVE,
        UserRole.CUSTOMER,
        false,
        undefined,
        createdAt,
        updatedAt
      );
    });

    it('should enable MFA', () => {
      user.updateMfaEnabled(true);

      expect(user.isMfaEnabled()).toBe(true);
    });

    it('should disable MFA', () => {
      const mfaEnabledUser = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.ACTIVE,
        UserRole.CUSTOMER,
        true,
        undefined,
        createdAt,
        updatedAt
      );

      mfaEnabledUser.updateMfaEnabled(false);

      expect(mfaEnabledUser.isMfaEnabled()).toBe(false);
    });
  });

  describe('updateProfile', () => {
    let user: User;

    beforeEach(() => {
      user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.ACTIVE,
        UserRole.CUSTOMER,
        false,
        undefined,
        createdAt,
        updatedAt
      );
    });

    it('should update first and last name', () => {
      user.updateProfile('Jane', 'Smith');

      expect(user.getFirstName()).toBe('Jane');
      expect(user.getLastName()).toBe('Smith');
      expect(user.getFullName()).toBe('Jane Smith');
    });
  });

  describe('markPendingVerification', () => {
    let user: User;

    beforeEach(() => {
      user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.ACTIVE,
        UserRole.CUSTOMER,
        false,
        undefined,
        createdAt,
        updatedAt
      );
    });

    it('should set status to PENDING_VERIFICATION', () => {
      user.markPendingVerification();

      expect(user.getStatus()).toBe(UserAccountStatus.PENDING_VERIFICATION);
      expect(user.isPendingVerification()).toBe(true);
    });
  });

  describe('approveKyc', () => {
    let user: User;

    beforeEach(() => {
      user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.PENDING_VERIFICATION,
        UserRole.CUSTOMER,
        false,
        undefined,
        createdAt,
        updatedAt
      );
    });

    it('should set status to ACTIVE', () => {
      user.approveKyc();

      expect(user.getStatus()).toBe(UserAccountStatus.ACTIVE);
      expect(user.isActive()).toBe(true);
    });
  });

  describe('rejectKyc', () => {
    let user: User;

    beforeEach(() => {
      user = new User(
        userId,
        cognitoSub,
        email,
        'John',
        'Doe',
        UserAccountStatus.PENDING_VERIFICATION,
        UserRole.CUSTOMER,
        false,
        undefined,
        createdAt,
        updatedAt
      );
    });

    it('should set status to INACTIVE', () => {
      user.rejectKyc();

      expect(user.getStatus()).toBe(UserAccountStatus.INACTIVE);
      expect(user.isActive()).toBe(false);
    });
  });
});











