/**
 * @fileoverview GetMeUseCase Tests - Unit tests for GetMeUseCase
 * @summary Tests for user profile retrieval use case
 * @description Tests all methods in GetMeUseCase including conditional data fetching and response building.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GetMeUseCase } from '../../../../src/application/users/GetMeUseCase';
import { UserService } from '../../../../src/services/UserService';
import { OAuthAccountRepository } from '../../../../src/repositories/OAuthAccountRepository';
import { Logger } from '@lawprotect/shared-ts';
import { userEntity } from '../../../helpers/builders/user';
import { TestUtils } from '../../../helpers/testUtils';
import { CognitoSub } from '../../../../src/domain/value-objects/CognitoSub';
import { UserId } from '../../../../src/domain/value-objects/UserId';
import { oauthAccountEntity } from '../../../helpers/builders/oauthAccount';
import { OAuthProvider, UserAccountStatus, UserRole } from '../../../../src/domain/enums';
import { userPersonalInfoEntity } from '../../../helpers/builders/userPersonalInfo';

describe('GetMeUseCase', () => {
  let useCase: GetMeUseCase;
  let userService: jest.Mocked<UserService>;
  let oauthAccountRepository: jest.Mocked<OAuthAccountRepository>;
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    userService = {
      findByCognitoSub: jest.fn(),
      getPersonalInfo: jest.fn()
    } as any;

    oauthAccountRepository = {
      listByUserId: jest.fn()
    } as any;

    logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    } as any;

    useCase = new GetMeUseCase(userService, oauthAccountRepository, logger);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should retrieve user profile without includes', async () => {
      const cognitoSub = TestUtils.generateCognitoSub();
      const user = userEntity({ cognitoSub: CognitoSub.fromString(cognitoSub) });

      userService.findByCognitoSub.mockResolvedValue(user);

      const result = await useCase.execute({
        cognitoSub,
        includeFlags: ''
      });

      expect(userService.findByCognitoSub).toHaveBeenCalledWith(cognitoSub);
      expect(result.user.id).toBe(user.getId().toString());
      expect(result.user.email).toBe(user.getEmail()?.toString());
      expect(result.user.role).toBe(user.getRole());
      expect(result.user.status).toBe(user.getStatus());
      expect(result.user.providers).toBeUndefined();
      expect(result.user.personalInfo).toBeUndefined();
      expect(result.user.claims).toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith(
        'Starting GetMe use case',
        expect.objectContaining({ cognitoSub })
      );
    });

    it('should retrieve user profile with providers include', async () => {
      const cognitoSub = TestUtils.generateCognitoSub();
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, cognitoSub: CognitoSub.fromString(cognitoSub) });
      const accounts = [
        oauthAccountEntity({ userId, provider: OAuthProvider.GOOGLE }),
        oauthAccountEntity({ userId, provider: OAuthProvider.MICROSOFT_365 })
      ];

      userService.findByCognitoSub.mockResolvedValue(user);
      oauthAccountRepository.listByUserId.mockResolvedValue(accounts as any);

      const result = await useCase.execute({
        cognitoSub,
        includeFlags: 'idp'
      });

      expect(oauthAccountRepository.listByUserId).toHaveBeenCalledWith(userId.toString());
      expect(result.user.providers).toBeDefined();
      expect(result.user.providers?.length).toBe(2);
      expect(result.user.providers?.[0].provider).toBe(OAuthProvider.GOOGLE);
      expect(result.user.providers?.[1].provider).toBe(OAuthProvider.MICROSOFT_365);
    });

    it('should retrieve user profile with profile include', async () => {
      const cognitoSub = TestUtils.generateCognitoSub();
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, cognitoSub: CognitoSub.fromString(cognitoSub) });
      const personalInfo = userPersonalInfoEntity({
        userId,
        phone: '+1234567890',
        locale: 'en-US',
        timeZone: 'America/New_York'
      });

      userService.findByCognitoSub.mockResolvedValue(user);
      userService.getPersonalInfo.mockResolvedValue(personalInfo);

      const result = await useCase.execute({
        cognitoSub,
        includeFlags: 'profile'
      });

      expect(userService.getPersonalInfo).toHaveBeenCalledWith(userId);
      expect(result.user.personalInfo).toBeDefined();
      expect(result.user.personalInfo?.phone).toBe('+1234567890');
      expect(result.user.personalInfo?.locale).toBe('en-US');
      expect(result.user.personalInfo?.timeZone).toBe('America/New_York');
    });

    it('should retrieve user profile with claims include', async () => {
      const cognitoSub = TestUtils.generateCognitoSub();
      const user = userEntity({ cognitoSub: CognitoSub.fromString(cognitoSub) });

      userService.findByCognitoSub.mockResolvedValue(user);

      const result = await useCase.execute({
        cognitoSub,
        includeFlags: 'claims'
      });

      expect(result.user.claims).toBeDefined();
    });

    it('should retrieve user profile with all includes', async () => {
      const cognitoSub = TestUtils.generateCognitoSub();
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, cognitoSub: CognitoSub.fromString(cognitoSub) });
      const accounts = [oauthAccountEntity({ userId, provider: OAuthProvider.GOOGLE })];
      const personalInfo = userPersonalInfoEntity({
        userId,
        phone: '+1234567890',
        locale: 'en-US',
        timeZone: 'America/New_York'
      });

      userService.findByCognitoSub.mockResolvedValue(user);
      oauthAccountRepository.listByUserId.mockResolvedValue(accounts as any);
      userService.getPersonalInfo.mockResolvedValue(personalInfo);

      const result = await useCase.execute({
        cognitoSub,
        includeFlags: 'idp,profile,claims'
      });

      expect(result.user.providers).toBeDefined();
      expect(result.user.personalInfo).toBeDefined();
      expect(result.user.claims).toBeDefined();
    });

    it('should throw error when user not found', async () => {
      const cognitoSub = TestUtils.generateCognitoSub();

      userService.findByCognitoSub.mockResolvedValue(null);

      await expect(
        useCase.execute({
          cognitoSub,
          includeFlags: ''
        })
      ).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'GetMe use case failed',
        expect.objectContaining({ cognitoSub })
      );
    });

    it('should return empty providers array when repository fails', async () => {
      const cognitoSub = TestUtils.generateCognitoSub();
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, cognitoSub: CognitoSub.fromString(cognitoSub) });

      userService.findByCognitoSub.mockResolvedValue(user);
      oauthAccountRepository.listByUserId.mockRejectedValue(new Error('Repository error'));

      const result = await useCase.execute({
        cognitoSub,
        includeFlags: 'idp'
      });

      expect(result.user.providers).toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to retrieve OAuth providers',
        expect.objectContaining({ userId: userId.toString() })
      );
    });

    it('should include pending verification header when user is pending verification', async () => {
      const cognitoSub = TestUtils.generateCognitoSub();
      const user = userEntity({
        cognitoSub: CognitoSub.fromString(cognitoSub),
        status: UserAccountStatus.PENDING_VERIFICATION,
        role: UserRole.LAWYER
      });

      userService.findByCognitoSub.mockResolvedValue(user);

      const result = await useCase.execute({
        cognitoSub,
        includeFlags: ''
      });

      expect(result.headers).toBeDefined();
      expect(result.headers?.['X-User-Pending-Verification']).toBe('true');
    });

    it('should not include headers when not needed', async () => {
      const cognitoSub = TestUtils.generateCognitoSub();
      const user = userEntity({ cognitoSub: CognitoSub.fromString(cognitoSub) });

      userService.findByCognitoSub.mockResolvedValue(user);

      const result = await useCase.execute({
        cognitoSub,
        includeFlags: ''
      });

      expect(result.headers).toBeUndefined();
    });

    it('should log successful completion', async () => {
      const cognitoSub = TestUtils.generateCognitoSub();
      const user = userEntity({ cognitoSub: CognitoSub.fromString(cognitoSub) });

      userService.findByCognitoSub.mockResolvedValue(user);

      await useCase.execute({
        cognitoSub,
        includeFlags: ''
      });

      expect(logger.info).toHaveBeenCalledWith(
        'GetMe use case completed successfully',
        expect.objectContaining({
          userId: user.getId().toString(),
          role: user.getRole(),
          status: user.getStatus()
        })
      );
    });
  });
});

