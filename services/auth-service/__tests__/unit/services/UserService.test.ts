/**
 * @fileoverview UserService Tests - Comprehensive unit tests for UserService
 * @summary Tests all user service methods with full coverage
 * @description This test suite provides comprehensive coverage of UserService including
 * user creation, updates, OAuth linking, profile management, and business rules.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { UserService } from '../../../src/services/UserService';
import { UserRepository } from '../../../src/repositories/UserRepository';
import { OAuthAccountRepository } from '../../../src/repositories/OAuthAccountRepository';
import { UserPersonalInfoRepository } from '../../../src/repositories/UserPersonalInfoRepository';
import { EventPublishingService } from '../../../src/services/EventPublishingService';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { CognitoSub } from '../../../src/domain/value-objects/CognitoSub';
import { UserRole, UserAccountStatus } from '../../../src/domain/enums';
import { Email } from '@lawprotect/shared-ts';
import { User } from '../../../src/domain/entities/User';
import { TestUtils } from '../../helpers/testUtils';
import { userEntity } from '../../helpers/builders/user';
import { userPersonalInfoEntity } from '../../helpers/builders/userPersonalInfo';
import { createUserPrismaMock, createOAuthAccountPrismaMock, createUserPersonalInfoPrismaMock } from '../../helpers/mocks/prisma';
import { OAuthAccount } from '../../../src/domain/entities/OAuthAccount';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  let oauthAccountRepository: jest.Mocked<OAuthAccountRepository>;
  let userPersonalInfoRepository: jest.Mocked<UserPersonalInfoRepository>;
  let eventPublishingService: jest.Mocked<EventPublishingService>;

  beforeEach(() => {
    const userMock = createUserPrismaMock();
    const oauthMock = createOAuthAccountPrismaMock();
    const personalInfoMock = createUserPersonalInfoPrismaMock();

    userRepository = new UserRepository(userMock.prisma as any) as jest.Mocked<UserRepository>;
    oauthAccountRepository = new OAuthAccountRepository(oauthMock.prisma as any) as jest.Mocked<OAuthAccountRepository>;
    userPersonalInfoRepository = new UserPersonalInfoRepository(personalInfoMock.prisma as any) as jest.Mocked<UserPersonalInfoRepository>;
    const mockPublish = jest.fn();
    (mockPublish as any).mockResolvedValue(undefined);
    eventPublishingService = {
      publishUserUpdated: mockPublish,
      publishUserRegistered: mockPublish,
      publishUserRoleChanged: mockPublish,
      publishUserStatusChanged: mockPublish,
      publishMfaStatusChanged: mockPublish,
      publishOAuthAccountLinked: mockPublish,
      publishOAuthAccountUnlinked: mockPublish,
      publishUserProviderLinked: mockPublish,
      publishUserProviderUnlinked: mockPublish,
      publishCustomEvent: mockPublish
    } as any;

    userService = new UserService(
      userRepository,
      oauthAccountRepository,
      userPersonalInfoRepository,
      eventPublishingService
    );
    jest.clearAllMocks();
  });

  describe('upsertOnPostAuth', () => {
    it('creates new user when not exists', async () => {
      const input = {
        cognitoSub: TestUtils.generateCognitoSub(),
        email: 'test@example.com',
        givenName: 'John',
        familyName: 'Doe',
        mfaEnabled: false
      };
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ 
        id: userId,
        cognitoSub: CognitoSub.fromString(input.cognitoSub),
        email: Email.fromString(input.email),
        firstName: input.givenName,
        lastName: input.familyName
      });
      jest.spyOn(userRepository, 'findByCognitoSub').mockResolvedValue(null);
      jest.spyOn(User, 'fromPersistence').mockReturnValue(user);
      jest.spyOn(userRepository, 'create').mockResolvedValue(user);

      const result = await userService.upsertOnPostAuth(input);

      expect(result.created).toBe(true);
      expect(result.mfaChanged).toBe(false);
      expect(userRepository.create).toHaveBeenCalled();
    });

    it('updates existing user', async () => {
      const input = {
        cognitoSub: TestUtils.generateCognitoSub(),
        email: 'test@example.com',
        givenName: 'Jane',
        familyName: 'Smith',
        mfaEnabled: true
      };
      const existingUser = userEntity({ mfaEnabled: false });
      const updatedUser = userEntity({ mfaEnabled: true });
      jest.spyOn(userRepository, 'findByCognitoSub').mockResolvedValue(existingUser);
      jest.spyOn(userRepository, 'update').mockResolvedValue(updatedUser);

      const result = await userService.upsertOnPostAuth(input);

      expect(result.created).toBe(false);
      expect(result.mfaChanged).toBe(true);
      expect(userRepository.update).toHaveBeenCalled();
    });

    it('handles creation error', async () => {
      const input = {
        cognitoSub: TestUtils.generateCognitoSub(),
        email: 'test@example.com',
        mfaEnabled: false
      };
      jest.spyOn(userRepository, 'findByCognitoSub').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockRejectedValue(new Error('Creation failed'));

      await expect(userService.upsertOnPostAuth(input)).rejects.toThrow();
    });

    it('handles update error', async () => {
      const input = {
        cognitoSub: TestUtils.generateCognitoSub(),
        email: 'test@example.com',
        mfaEnabled: false
      };
      const existingUser = userEntity();
      jest.spyOn(userRepository, 'findByCognitoSub').mockResolvedValue(existingUser);
      jest.spyOn(userRepository, 'update').mockRejectedValue(new Error('Update failed'));

      await expect(userService.upsertOnPostAuth(input)).rejects.toThrow();
    });
  });

  describe('linkProviderIdentities', () => {
    it('links provider identities', async () => {
      const userId = TestUtils.generateUuid();
      const identities = [
        { provider: 'GOOGLE' as any, providerAccountId: 'google-123' },
        { provider: 'MICROSOFT_365' as any, providerAccountId: 'ms-456' }
      ];
      jest.spyOn(oauthAccountRepository, 'upsert').mockResolvedValue({} as OAuthAccount);

      await userService.linkProviderIdentities(userId, identities);

      expect(oauthAccountRepository.upsert).toHaveBeenCalledTimes(2);
    });

    it('handles empty identities array', async () => {
      const userId = TestUtils.generateUuid();
      jest.spyOn(oauthAccountRepository, 'upsert').mockResolvedValue({} as OAuthAccount);

      await userService.linkProviderIdentities(userId, []);

      expect(oauthAccountRepository.upsert).not.toHaveBeenCalled();
    });

    it('handles null identities', async () => {
      const userId = TestUtils.generateUuid();
      jest.spyOn(oauthAccountRepository, 'upsert').mockResolvedValue({} as OAuthAccount);

      await userService.linkProviderIdentities(userId, null as any);

      expect(oauthAccountRepository.upsert).not.toHaveBeenCalled();
    });
  });

  describe('findByCognitoSub', () => {
    it('finds user by cognito sub', async () => {
      const cognitoSub = TestUtils.generateCognitoSub();
      const user = userEntity({ cognitoSub });
      jest.spyOn(userRepository, 'findByCognitoSub').mockResolvedValue(user);

      const result = await userService.findByCognitoSub(cognitoSub);

      expect(result).toEqual(user);
    });

    it('returns null when user not found', async () => {
      const cognitoSub = TestUtils.generateCognitoSub();
      jest.spyOn(userRepository, 'findByCognitoSub').mockResolvedValue(null);

      const result = await userService.findByCognitoSub(cognitoSub);

      expect(result).toBeNull();
    });
  });

  describe('registerOnConfirmation', () => {
    it('creates new user on confirmation', async () => {
      const input = {
        cognitoSub: TestUtils.generateCognitoSub(),
        email: 'test@example.com',
        givenName: 'John',
        familyName: 'Doe',
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      };
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ 
        id: userId,
        cognitoSub: CognitoSub.fromString(input.cognitoSub),
        email: Email.fromString(input.email),
        firstName: input.givenName,
        lastName: input.familyName
      });
      jest.spyOn(userRepository, 'findByCognitoSub').mockResolvedValue(null);
      jest.spyOn(User, 'fromPersistence').mockReturnValue(user);
      jest.spyOn(userRepository, 'create').mockResolvedValue(user);

      const result = await userService.registerOnConfirmation(input);

      expect(result.created).toBe(true);
      expect(userRepository.create).toHaveBeenCalled();
    });

    it('updates existing user on confirmation', async () => {
      const input = {
        cognitoSub: TestUtils.generateCognitoSub(),
        email: 'new@example.com',
        givenName: 'Jane',
        familyName: 'Smith',
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      };
      const existingUser = userEntity({ cognitoSub: input.cognitoSub, email: Email.fromString('old@example.com') });
      const updatedUser = userEntity({ cognitoSub: input.cognitoSub, email: Email.fromString(input.email!) });
      jest.spyOn(userRepository, 'findByCognitoSub').mockResolvedValue(existingUser);
      jest.spyOn(userRepository, 'update').mockResolvedValue(updatedUser);

      const result = await userService.registerOnConfirmation(input);

      expect(result.created).toBe(false);
      expect(userRepository.update).toHaveBeenCalled();
    });

    it('handles registration error', async () => {
      const input = {
        cognitoSub: TestUtils.generateCognitoSub(),
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      };
      jest.spyOn(userRepository, 'findByCognitoSub').mockRejectedValue(new Error('Database error'));

      await expect(userService.registerOnConfirmation(input)).rejects.toThrow();
    });
  });

  describe('getPersonalInfo', () => {
    it('gets user personal info', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const personalInfo = userPersonalInfoEntity({ userId });
      jest.spyOn(userPersonalInfoRepository, 'findByUserId').mockResolvedValue(personalInfo);

      const result = await userService.getPersonalInfo(userId);

      expect(result).toEqual(personalInfo);
    });

    it('returns null when personal info not found', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      jest.spyOn(userPersonalInfoRepository, 'findByUserId').mockResolvedValue(null);

      const result = await userService.getPersonalInfo(userId);

      expect(result).toBeNull();
    });
  });

  describe('updatePersonalInfo', () => {
    it('updates existing personal info', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const existing = userPersonalInfoEntity({ userId });
      const updated = userPersonalInfoEntity({ userId, phone: '+1234567890' });
      jest.spyOn(userPersonalInfoRepository, 'findByUserId').mockResolvedValue(existing);
      jest.spyOn(userPersonalInfoRepository, 'update').mockResolvedValue(updated);

      const result = await userService.updatePersonalInfo(userId, { phone: '+1234567890' });

      expect(result).toEqual(updated);
    });

    it('creates new personal info when not exists', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const newPersonalInfo = userPersonalInfoEntity({ userId });
      jest.spyOn(userPersonalInfoRepository, 'findByUserId').mockResolvedValue(null);
      jest.spyOn(userPersonalInfoRepository, 'create').mockResolvedValue(newPersonalInfo);

      const result = await userService.updatePersonalInfo(userId, { phone: '+1234567890' });

      expect(result).toEqual(newPersonalInfo);
    });
  });

  describe('changeUserStatus', () => {
    it('changes user status successfully', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const actorId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, status: UserAccountStatus.ACTIVE });
      const updatedUser = userEntity({ id: userId, status: UserAccountStatus.SUSPENDED });
      jest.spyOn(userRepository, 'findById').mockResolvedValue(user);
      jest.spyOn(userRepository, 'update').mockResolvedValue(updatedUser);

      const result = await userService.changeUserStatus(userId, UserAccountStatus.SUSPENDED, actorId);

      expect(result).toEqual(updatedUser);
    });

    it('throws error when user not found', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const actorId = UserId.fromString(TestUtils.generateUuid());
      jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

      await expect(userService.changeUserStatus(userId, UserAccountStatus.SUSPENDED, actorId)).rejects.toThrow();
    });
  });

  describe('changeUserRole', () => {
    it('changes user role successfully', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, role: UserRole.CUSTOMER });
      const updatedUser = userEntity({ id: userId, role: UserRole.LAWYER });
      jest.spyOn(userRepository, 'findById').mockResolvedValue(user);
      jest.spyOn(userRepository, 'update').mockResolvedValue(updatedUser);

      const result = await userService.changeUserRole(userId, UserRole.LAWYER);

      expect(result).toEqual(updatedUser);
    });

    it('throws error when user not found', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

      await expect(userService.changeUserRole(userId, UserRole.LAWYER)).rejects.toThrow();
    });
  });

  describe('updateUserProfile', () => {
    it('updates user profile successfully', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, status: UserAccountStatus.ACTIVE, firstName: 'John' });
      const updatedUser = userEntity({ id: userId, firstName: 'Jane' });
      const personalInfo = userPersonalInfoEntity({ userId });
      const request = { givenName: 'Jane' };
      jest.spyOn(userRepository, 'findById').mockResolvedValue(user);
      jest.spyOn(userPersonalInfoRepository, 'findByUserId').mockResolvedValue(personalInfo);
      jest.spyOn(userRepository, 'updateProfile').mockResolvedValue(updatedUser);
      (eventPublishingService.publishUserUpdated as any).mockResolvedValue(undefined);

      const result = await userService.updateUserProfile(userId, request);

      expect(result.givenName).toBe('Jane');
      expect(eventPublishingService.publishUserUpdated).toHaveBeenCalled();
    });

    it('throws error when user not found', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const request = { givenName: 'Jane' };
      jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

      await expect(userService.updateUserProfile(userId, request)).rejects.toThrow();
    });

    it('throws error when account is locked', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, status: UserAccountStatus.INACTIVE });
      const request = { givenName: 'Jane' };
      jest.spyOn(userRepository, 'findById').mockResolvedValue(user);

      await expect(userService.updateUserProfile(userId, request)).rejects.toThrow();
    });

    it('throws error when account is suspended', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, status: UserAccountStatus.SUSPENDED });
      const request = { givenName: 'Jane' };
      jest.spyOn(userRepository, 'findById').mockResolvedValue(user);

      await expect(userService.updateUserProfile(userId, request)).rejects.toThrow();
    });

    it('returns unchanged response when no changes detected', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, status: UserAccountStatus.ACTIVE, givenName: 'John' });
      const personalInfo = userPersonalInfoEntity({ userId });
      const request = { givenName: 'John' };
      jest.spyOn(userRepository, 'findById').mockResolvedValue(user);
      jest.spyOn(userPersonalInfoRepository, 'findByUserId').mockResolvedValue(personalInfo);

      const result = await userService.updateUserProfile(userId, request);

      expect(result.meta.changed).toBe(false);
    });

    it('updates personal info when provided', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, status: UserAccountStatus.ACTIVE });
      const personalInfo = userPersonalInfoEntity({ userId });
      const updatedPersonalInfo = userPersonalInfoEntity({ userId, phone: '+1234567890' });
      const request = { personalInfo: { phone: '+1234567890' } };
      jest.spyOn(userRepository, 'findById').mockResolvedValue(user);
      jest.spyOn(userPersonalInfoRepository, 'findByUserId').mockResolvedValue(personalInfo);
      jest.spyOn(userPersonalInfoRepository, 'upsertByUserId').mockResolvedValue(updatedPersonalInfo);
      jest.spyOn(eventPublishingService, 'publishUserUpdated').mockResolvedValue(undefined);

      const result = await userService.updateUserProfile(userId, request);

      expect(result.personalInfo.phone).toBe('+1234567890');
    });

    it('updates name when provided', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, status: UserAccountStatus.ACTIVE, firstName: 'John', lastName: 'Doe' });
      const personalInfo = userPersonalInfoEntity({ userId });
      const updatedUser = userEntity({ id: userId, firstName: 'Jane', lastName: 'Smith' });
      const request = { name: 'Jane Smith' };
      jest.spyOn(userRepository, 'findById').mockResolvedValue(user);
      jest.spyOn(userPersonalInfoRepository, 'findByUserId').mockResolvedValue(personalInfo);
      jest.spyOn(userRepository, 'updateProfile').mockResolvedValue(updatedUser);
      jest.spyOn(eventPublishingService, 'publishUserUpdated').mockResolvedValue(undefined);

      const result = await userService.updateUserProfile(userId, request);

      expect(result.name).toBe('Jane Smith');
    });

    it('updates lastName when provided', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, status: UserAccountStatus.ACTIVE, lastName: 'Doe' });
      const personalInfo = userPersonalInfoEntity({ userId });
      const updatedUser = userEntity({ id: userId, lastName: 'Smith' });
      const request = { lastName: 'Smith' };
      jest.spyOn(userRepository, 'findById').mockResolvedValue(user);
      jest.spyOn(userPersonalInfoRepository, 'findByUserId').mockResolvedValue(personalInfo);
      jest.spyOn(userRepository, 'updateProfile').mockResolvedValue(updatedUser);
      jest.spyOn(eventPublishingService, 'publishUserUpdated').mockResolvedValue(undefined);

      const result = await userService.updateUserProfile(userId, request);

      expect(result.lastName).toBe('Smith');
    });

    it('updates locale when provided', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, status: UserAccountStatus.ACTIVE });
      const personalInfo = userPersonalInfoEntity({ userId, locale: 'en' });
      const updatedPersonalInfo = userPersonalInfoEntity({ userId, locale: 'es' });
      const request = { personalInfo: { locale: 'es' } };
      jest.spyOn(userRepository, 'findById').mockResolvedValue(user);
      jest.spyOn(userPersonalInfoRepository, 'findByUserId').mockResolvedValue(personalInfo);
      jest.spyOn(userPersonalInfoRepository, 'upsertByUserId').mockResolvedValue(updatedPersonalInfo);
      jest.spyOn(eventPublishingService, 'publishUserUpdated').mockResolvedValue(undefined);

      const result = await userService.updateUserProfile(userId, request);

      expect(result.personalInfo.locale).toBe('es');
    });

    it('updates timeZone when provided', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, status: UserAccountStatus.ACTIVE });
      const personalInfo = userPersonalInfoEntity({ userId, timeZone: 'UTC' });
      const updatedPersonalInfo = userPersonalInfoEntity({ userId, timeZone: 'America/New_York' });
      const request = { personalInfo: { timeZone: 'America/New_York' } };
      jest.spyOn(userRepository, 'findById').mockResolvedValue(user);
      jest.spyOn(userPersonalInfoRepository, 'findByUserId').mockResolvedValue(personalInfo);
      jest.spyOn(userPersonalInfoRepository, 'upsertByUserId').mockResolvedValue(updatedPersonalInfo);
      jest.spyOn(eventPublishingService, 'publishUserUpdated').mockResolvedValue(undefined);

      const result = await userService.updateUserProfile(userId, request);

      expect(result.personalInfo.timeZone).toBe('America/New_York');
    });

    it('handles error and throws InternalError', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const request = { givenName: 'Jane' };
      jest.spyOn(userRepository, 'findById').mockRejectedValue(new Error('Database error'));

      await expect(userService.updateUserProfile(userId, request)).rejects.toThrow('User update failed');
    });

    it('throws error when user status is DELETED', async () => {
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, status: UserAccountStatus.DELETED });
      const request = { givenName: 'Jane' };
      jest.spyOn(userRepository, 'findById').mockResolvedValue(user);

      await expect(userService.updateUserProfile(userId, request)).rejects.toThrow();
    });
  });

  describe('determineUserStatus', () => {
    it('returns ACTIVE for UNASSIGNED role', () => {
      const result = (userService as any).determineUserStatus(UserRole.UNASSIGNED);
      expect(result).toBe(UserAccountStatus.ACTIVE);
    });

    it('returns PENDING_VERIFICATION for LAWYER role', () => {
      const result = (userService as any).determineUserStatus(UserRole.LAWYER);
      expect(result).toBe(UserAccountStatus.PENDING_VERIFICATION);
    });

    it('returns ACTIVE for default case', () => {
      const result = (userService as any).determineUserStatus(UserRole.CUSTOMER);
      expect(result).toBe(UserAccountStatus.ACTIVE);
    });
  });
});

