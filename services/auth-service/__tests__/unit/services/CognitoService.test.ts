/**
 * @fileoverview CognitoService Tests - Comprehensive unit tests for CognitoService
 * @summary Tests all Cognito service methods with full coverage
 * @description This test suite provides comprehensive coverage of CognitoService including
 * user management, MFA settings, OAuth provider operations, and error handling.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CognitoService } from '../../../src/services/CognitoService';
import { AdminGetUserCommand, AdminLinkProviderForUserCommand, AdminEnableUserCommand, AdminDisableUserCommand, AdminUserGlobalSignOutCommand, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { AdminGetUserCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { OAuthProvider } from '../../../src/domain/enums/OAuthProvider';
import { CognitoAttribute } from '../../../src/domain/enums/CognitoAttribute';
import { TestUtils, TEST_CONSTANTS } from '../../helpers/testUtils';
import { createLogger } from '@lawprotect/shared-ts';

describe('CognitoService', () => {
  let cognitoService: CognitoService;
  let mockClient: { send: jest.Mock };
  let logger: ReturnType<typeof createLogger>;
  const userPoolId = TEST_CONSTANTS.TEST_USER_POOL_ID;

  beforeEach(() => {
    mockClient = {
      send: jest.fn()
    };
    logger = createLogger({ service: 'test', component: 'test' });
    cognitoService = new CognitoService(mockClient as any, userPoolId, logger);
    jest.clearAllMocks();
  });

  describe('adminGetUser', () => {
    it('retrieves user successfully', async () => {
      const sub = TestUtils.generateUuid();
      const mockOutput: AdminGetUserCommandOutput = {
        Username: sub,
        UserAttributes: [],
        UserStatus: 'CONFIRMED',
        $metadata: {} as any
      };
      (mockClient.send as any).mockResolvedValue(mockOutput);

      const result = await cognitoService.adminGetUser(sub);

      expect(mockClient.send).toHaveBeenCalledWith(expect.any(AdminGetUserCommand));
      expect(result).toEqual(mockOutput);
    });

    it('throws cognitoUserNotFound when user not found', async () => {
      const sub = TestUtils.generateUuid();
      const error = new Error('User not found');
      error.name = 'UserNotFoundException';
      (mockClient.send as any).mockRejectedValue(error);

      await expect(cognitoService.adminGetUser(sub)).rejects.toThrow();
    });

    it('throws cognitoUserCreationFailed on other errors', async () => {
      const sub = TestUtils.generateUuid();
      const error = new Error('Network error');
      (mockClient.send as any).mockRejectedValue(error);

      await expect(cognitoService.adminGetUser(sub)).rejects.toThrow();
    });
  });

  describe('parseAdminUser', () => {
    it('parses user with MFA enabled', () => {
      const user: AdminGetUserCommandOutput = {
        Username: 'test-user',
        UserAttributes: [],
        UserMFASettingList: ['SOFTWARE_TOKEN_MFA'],
        UserStatus: 'CONFIRMED',
        $metadata: {} as any
      };

      const result = cognitoService.parseAdminUser(user);

      expect(result.mfaEnabled).toBe(true);
      expect(result.identities).toEqual([]);
    });

    it('parses user with social identities', () => {
      const identitiesJson = JSON.stringify([
        { providerName: 'Google', userId: 'google-123' },
        { providerName: 'Microsoft', user_id: 'ms-456' }
      ]);
      const user: AdminGetUserCommandOutput = {
        Username: 'test-user',
        UserAttributes: [
          { Name: CognitoAttribute.IDENTITIES, Value: identitiesJson }
        ],
        UserStatus: 'CONFIRMED',
        $metadata: {} as any
      };

      const result = cognitoService.parseAdminUser(user);

      expect(result.identities).toHaveLength(2);
      expect(result.identities[0].provider).toBe(OAuthProvider.GOOGLE);
      expect(result.identities[1].provider).toBe(OAuthProvider.MICROSOFT_365);
    });

    it('handles empty identities', () => {
      const user: AdminGetUserCommandOutput = {
        Username: 'test-user',
        UserAttributes: [],
        UserStatus: 'CONFIRMED',
        $metadata: {} as any
      };

      const result = cognitoService.parseAdminUser(user);

      expect(result.identities).toEqual([]);
    });

    it('filters identities without providerAccountId', () => {
      const identitiesJson = JSON.stringify([
        { providerName: 'Google', userId: 'google-123' },
        { providerName: 'Microsoft' }
      ]);
      const user: AdminGetUserCommandOutput = {
        Username: 'test-user',
        UserAttributes: [
          { Name: CognitoAttribute.IDENTITIES, Value: identitiesJson }
        ],
        UserStatus: 'CONFIRMED',
        $metadata: {} as any
      };

      const result = cognitoService.parseAdminUser(user);

      expect(result.identities).toHaveLength(1);
    });
  });

  describe('parseMfaSettings', () => {
    it('parses MFA settings with MFA enabled', () => {
      const user: AdminGetUserCommandOutput = {
        Username: 'test-user',
        UserAttributes: [
          { Name: CognitoAttribute.PREFERRED_MFA_SETTING, Value: 'SOFTWARE_TOKEN_MFA' }
        ],
        UserMFASettingList: ['SOFTWARE_TOKEN_MFA'],
        UserStatus: 'CONFIRMED',
        $metadata: {} as any
      };

      const result = cognitoService.parseMfaSettings(user);

      expect(result.mfaEnabled).toBe(true);
      expect(result.preferredMfaSetting).toBe('SOFTWARE_TOKEN_MFA');
    });

    it('parses MFA settings with custom MFA required', () => {
      const user: AdminGetUserCommandOutput = {
        Username: 'test-user',
        UserAttributes: [
          { Name: CognitoAttribute.CUSTOM_MFA_REQUIRED, Value: 'true' }
        ],
        UserStatus: 'CONFIRMED',
        $metadata: {} as any
      };

      const result = cognitoService.parseMfaSettings(user);

      expect(result.isMfaRequiredAttr).toBe(true);
    });
  });

  describe('getUserAttributes', () => {
    it('returns map of user attributes', () => {
      const user: AdminGetUserCommandOutput = {
        Username: 'test-user',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'name', Value: 'Test User' }
        ],
        UserStatus: 'CONFIRMED',
        $metadata: {} as any
      };

      const result = cognitoService.getUserAttributes(user);

      expect(result.get('email')).toBe('test@example.com');
      expect(result.get('name')).toBe('Test User');
    });
  });

  describe('getCustomAttributes', () => {
    it('returns only custom attributes', () => {
      const user: AdminGetUserCommandOutput = {
        Username: 'test-user',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'custom:role', Value: 'admin' },
          { Name: 'custom:department', Value: 'IT' }
        ],
        UserStatus: 'CONFIRMED',
        $metadata: {} as any
      };

      const result = cognitoService.getCustomAttributes(user);

      expect(result.size).toBe(2);
      expect(result.get('custom:role')).toBe('admin');
      expect(result.get('custom:department')).toBe('IT');
    });
  });

  describe('adminLinkProviderForUser', () => {
    it('links provider successfully', async () => {
      const destinationSub = TestUtils.generateUuid();
      const sourceProvider = 'Google';
      const sourceUserId = 'google-123';
      (mockClient.send as any).mockResolvedValue({});

      await cognitoService.adminLinkProviderForUser(destinationSub, sourceProvider, sourceUserId);

      expect(mockClient.send).toHaveBeenCalledWith(expect.any(AdminLinkProviderForUserCommand));
    });

    it('throws error on link failure', async () => {
      const destinationSub = TestUtils.generateUuid();
      const sourceProvider = 'Google';
      const sourceUserId = 'google-123';
      const error = new Error('Link failed');
      (mockClient.send as any).mockRejectedValue(error);

      await expect(cognitoService.adminLinkProviderForUser(destinationSub, sourceProvider, sourceUserId)).rejects.toThrow();
    });
  });

  describe('generateHostedUiUrl', () => {
    it('generates hosted UI URL for Google', async () => {
      const provider = OAuthProvider.GOOGLE;
      const state = 'test-state';
      const successUrl = 'https://example.com/success';
      const failureUrl = 'https://example.com/failure';
      process.env.AWS_REGION = 'us-east-1';
      process.env.COGNITO_CLIENT_ID = 'test-client-id';

      const url = await cognitoService.generateHostedUiUrl(provider, state, successUrl, failureUrl);

      expect(url).toContain('oauth2/authorize');
      expect(url).toContain('identity_provider=Google');
      expect(url).toContain(`state=${state}`);
    });
  });

  describe('validateIdToken', () => {
    it('validates Google ID token', async () => {
      const provider = OAuthProvider.GOOGLE;
      const payload = { sub: 'google-123', email: 'test@example.com', name: 'Test User' };
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;

      const result = await cognitoService.validateIdToken(provider, token);

      expect(result.provider).toBe(provider);
      expect(result.providerAccountId).toBe('google-123');
      expect(result.email).toBe('test@example.com');
    });

    it('validates Microsoft ID token', async () => {
      const provider = OAuthProvider.MICROSOFT_365;
      const payload = { oid: 'ms-123', email: 'test@example.com' };
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;

      const result = await cognitoService.validateIdToken(provider, token);

      expect(result.providerAccountId).toBe('ms-123');
    });

    it('throws error for invalid JWT structure', async () => {
      const provider = OAuthProvider.GOOGLE;
      const invalidToken = 'invalid-token';

      await expect(cognitoService.validateIdToken(provider, invalidToken)).rejects.toThrow();
    });
  });

  describe('exchangeCodeForToken', () => {
    it('throws error as not implemented', async () => {
      const provider = OAuthProvider.GOOGLE;
      const code = 'auth-code';

      await expect(cognitoService.exchangeCodeForToken(provider, code)).rejects.toThrow('not implemented');
    });
  });

  describe('adminUnlinkProviderForUser', () => {
    it('logs unlink operation', async () => {
      const destinationSub = TestUtils.generateUuid();
      const sourceProvider = 'Google';
      const sourceUserId = 'google-123';
      const loggerSpy = jest.spyOn(logger, 'info');

      await cognitoService.adminUnlinkProviderForUser(destinationSub, sourceProvider, sourceUserId);

      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('adminEnableUser', () => {
    it('enables user successfully', async () => {
      const sub = TestUtils.generateUuid();
      (mockClient.send as any).mockResolvedValue({});
      const loggerSpy = jest.spyOn(logger, 'info');

      await cognitoService.adminEnableUser(sub);

      expect(mockClient.send).toHaveBeenCalledWith(expect.any(AdminEnableUserCommand));
      expect(loggerSpy).toHaveBeenCalled();
    });

    it('throws error on enable failure', async () => {
      const sub = TestUtils.generateUuid();
      const error = new Error('Enable failed');
      (mockClient.send as any).mockRejectedValue(error);
      const loggerSpy = jest.spyOn(logger, 'error');

      await expect(cognitoService.adminEnableUser(sub)).rejects.toThrow();
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('adminDisableUser', () => {
    it('disables user successfully', async () => {
      const sub = TestUtils.generateUuid();
      (mockClient.send as any).mockResolvedValue({});
      const loggerSpy = jest.spyOn(logger, 'info');

      await cognitoService.adminDisableUser(sub);

      expect(mockClient.send).toHaveBeenCalledWith(expect.any(AdminDisableUserCommand));
      expect(loggerSpy).toHaveBeenCalled();
    });

    it('throws error on disable failure', async () => {
      const sub = TestUtils.generateUuid();
      const error = new Error('Disable failed');
      (mockClient.send as any).mockRejectedValue(error);
      const loggerSpy = jest.spyOn(logger, 'error');

      await expect(cognitoService.adminDisableUser(sub)).rejects.toThrow();
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('adminUserGlobalSignOut', () => {
    it('performs global sign out successfully', async () => {
      const sub = TestUtils.generateUuid();
      (mockClient.send as any).mockResolvedValue({});
      const loggerSpy = jest.spyOn(logger, 'info');

      await cognitoService.adminUserGlobalSignOut(sub);

      expect(mockClient.send).toHaveBeenCalledWith(expect.any(AdminUserGlobalSignOutCommand));
      expect(loggerSpy).toHaveBeenCalled();
    });

    it('throws error on sign out failure', async () => {
      const sub = TestUtils.generateUuid();
      const error = new Error('Sign out failed');
      (mockClient.send as any).mockRejectedValue(error);
      const loggerSpy = jest.spyOn(logger, 'error');

      await expect(cognitoService.adminUserGlobalSignOut(sub)).rejects.toThrow();
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('adminUpdateUserAttributes', () => {
    it('updates user attributes successfully', async () => {
      const sub = TestUtils.generateUuid();
      const attributes = { email: 'new@example.com', name: 'New Name' };
      (mockClient.send as any).mockResolvedValue({});
      const loggerSpy = jest.spyOn(logger, 'info');

      await cognitoService.adminUpdateUserAttributes(sub, attributes);

      expect(mockClient.send).toHaveBeenCalledWith(expect.any(AdminUpdateUserAttributesCommand));
      expect(loggerSpy).toHaveBeenCalled();
    });

    it('throws error on update failure', async () => {
      const sub = TestUtils.generateUuid();
      const attributes = { email: 'new@example.com' };
      const error = new Error('Update failed');
      (mockClient.send as any).mockRejectedValue(error);
      const loggerSpy = jest.spyOn(logger, 'error');

      await expect(cognitoService.adminUpdateUserAttributes(sub, attributes)).rejects.toThrow();
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('parseAdminUser edge cases', () => {
    it('handles preferredMfaSetting from attributes', () => {
      const user: AdminGetUserCommandOutput = {
        Username: 'test-user',
        UserAttributes: [
          { Name: 'preferred_mfa_setting', Value: 'SOFTWARE_TOKEN_MFA' }
        ],
        UserStatus: 'CONFIRMED',
        $metadata: {} as any
      };

      const result = cognitoService.parseAdminUser(user);

      expect(result.mfaEnabled).toBe(true);
    });

    it('handles Apple provider in identities', () => {
      const identitiesJson = JSON.stringify([
        { providerName: 'SignInWithApple', userId: 'apple-123' }
      ]);
      const user: AdminGetUserCommandOutput = {
        Username: 'test-user',
        UserAttributes: [
          { Name: CognitoAttribute.IDENTITIES, Value: identitiesJson }
        ],
        UserStatus: 'CONFIRMED',
        $metadata: {} as any
      };

      const result = cognitoService.parseAdminUser(user);

      expect(result.identities[0].provider).toBe(OAuthProvider.APPLE);
    });

    it('handles unknown provider in identities', () => {
      const identitiesJson = JSON.stringify([
        { providerName: 'UnknownProvider', userId: 'unknown-123' }
      ]);
      const user: AdminGetUserCommandOutput = {
        Username: 'test-user',
        UserAttributes: [
          { Name: CognitoAttribute.IDENTITIES, Value: identitiesJson }
        ],
        UserStatus: 'CONFIRMED',
        $metadata: {} as any
      };

      const result = cognitoService.parseAdminUser(user);

      expect(result.identities[0].provider).toBe(OAuthProvider.COGNITO);
    });
  });

  describe('parseMfaSettings edge cases', () => {
    it('handles empty UserMFASettingList', () => {
      const user: AdminGetUserCommandOutput = {
        Username: 'test-user',
        UserAttributes: [],
        UserStatus: 'CONFIRMED',
        $metadata: {} as any
      };

      const result = cognitoService.parseMfaSettings(user);

      expect(result.mfaEnabled).toBe(false);
      expect(result.userMfaSettingList).toBeUndefined();
    });

    it('handles preferredMfaSetting from attributes', () => {
      const user: AdminGetUserCommandOutput = {
        Username: 'test-user',
        UserAttributes: [
          { Name: CognitoAttribute.PREFERRED_MFA_SETTING, Value: 'SOFTWARE_TOKEN_MFA' }
        ],
        UserStatus: 'CONFIRMED',
        $metadata: {} as any
      };

      const result = cognitoService.parseMfaSettings(user);

      expect(result.preferredMfaSetting).toBe('SOFTWARE_TOKEN_MFA');
    });
  });

  describe('validateIdToken edge cases', () => {
    it('validates Apple ID token', async () => {
      const provider = OAuthProvider.APPLE;
      const payload = { sub: 'apple-123', email: 'test@example.com' };
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;

      const result = await cognitoService.validateIdToken(provider, token);

      expect(result.providerAccountId).toBe('apple-123');
    });

    it('validates token with given_name and family_name', async () => {
      const provider = OAuthProvider.GOOGLE;
      const payload = { sub: 'google-123', given_name: 'John', family_name: 'Doe' };
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;

      const result = await cognitoService.validateIdToken(provider, token);

      expect(result.name).toBe('John');
    });

    it('handles decode error in validateIdToken', async () => {
      const provider = OAuthProvider.GOOGLE;
      const invalidToken = 'header.invalid-base64.signature';

      await expect(cognitoService.validateIdToken(provider, invalidToken)).rejects.toThrow();
    });
  });

  describe('generateHostedUiUrl edge cases', () => {
    it('generates URL for Microsoft provider', async () => {
      const provider = OAuthProvider.MICROSOFT_365;
      const state = 'test-state';
      const successUrl = 'https://example.com/success';
      const failureUrl = 'https://example.com/failure';
      process.env.AWS_REGION = 'us-west-2';
      process.env.COGNITO_CLIENT_ID = 'test-client-id';

      const url = await cognitoService.generateHostedUiUrl(provider, state, successUrl, failureUrl);

      expect(url).toContain('identity_provider=Microsoft');
    });

    it('generates URL for Apple provider', async () => {
      const provider = OAuthProvider.APPLE;
      const state = 'test-state';
      const successUrl = 'https://example.com/success';
      const failureUrl = 'https://example.com/failure';
      process.env.AWS_REGION = 'eu-west-1';
      process.env.COGNITO_CLIENT_ID = 'test-client-id';

      const url = await cognitoService.generateHostedUiUrl(provider, state, successUrl, failureUrl);

      expect(url).toContain('identity_provider=SignInWithApple');
    });

    it('uses default region when AWS_REGION not set', async () => {
      const provider = OAuthProvider.GOOGLE;
      const state = 'test-state';
      const successUrl = 'https://example.com/success';
      const failureUrl = 'https://example.com/failure';
      delete process.env.AWS_REGION;
      process.env.COGNITO_CLIENT_ID = 'test-client-id';

      const url = await cognitoService.generateHostedUiUrl(provider, state, successUrl, failureUrl);

      expect(url).toContain('us-east-1');
    });
  });
});

