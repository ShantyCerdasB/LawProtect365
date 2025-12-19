/**
 * @fileoverview Cognito API Tests - Unit tests for Cognito OAuth functions
 * @summary Tests for cognitoApi.ts module
 */

import { exchangeCodeForTokens, generateCognitoAuthUrl } from '../../../../src/modules/auth/api/cognitoApi';
import type { CognitoConfig } from '../../../../src/modules/auth/types';

describe('cognitoApi', () => {
  const mockConfig: CognitoConfig = {
    userPoolId: 'us-east-1_test123',
    domain: 'test-domain',
    clientId: 'test-client-id',
    region: 'us-east-1',
    callbackUrl: 'https://app.example.com/callback',
  };

  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens (lines 39-63)', async () => {
      const mockResponse = {
        id_token: 'id-token-123',
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await exchangeCodeForTokens(mockConfig, {
        code: 'auth-code-123',
        redirect_uri: 'https://app.example.com/callback',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-domain.auth.us-east-1.amazoncognito.com/oauth2/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: expect.stringContaining('grant_type=authorization_code'),
        }
      );

      const callBody = (global.fetch as jest.Mock).mock.calls[0][1].body;
      expect(callBody).toContain('client_id=test-client-id');
      expect(callBody).toContain('code=auth-code-123');
      expect(callBody).toContain('redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback');
    });

    it('should throw error when token exchange fails', async () => {
      const errorResponse = {
        error: 'invalid_grant',
        error_description: 'Invalid authorization code',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => errorResponse,
      });

      await expect(
        exchangeCodeForTokens(mockConfig, {
          code: 'invalid-code',
          redirect_uri: 'https://app.example.com/callback',
        })
      ).rejects.toThrow('Token exchange failed: 400 Bad Request');

      const error = await exchangeCodeForTokens(mockConfig, {
        code: 'invalid-code',
        redirect_uri: 'https://app.example.com/callback',
      }).catch((e) => e);

      expect(error.message).toContain('Token exchange failed');
      expect(error.message).toContain(JSON.stringify(errorResponse));
    });

    it('should handle non-JSON error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Not JSON');
        },
      });

      await expect(
        exchangeCodeForTokens(mockConfig, {
          code: 'code-123',
          redirect_uri: 'https://app.example.com/callback',
        })
      ).rejects.toThrow('Token exchange failed: 500 Internal Server Error');
    });
  });

  describe('generateCognitoAuthUrl', () => {
    it('should generate auth URL for Google provider (lines 93-113)', () => {
      const url = generateCognitoAuthUrl(mockConfig, 'google');

      expect(url).toContain('https://test-domain.auth.us-east-1.amazoncognito.com/oauth2/authorize');
      expect(url).toContain('response_type=code');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback');
      expect(url).toContain('identity_provider=accounts.google.com');
      expect(url).toContain('scope=openid+email+profile');
    });

    it('should generate auth URL for Outlook provider', () => {
      const url = generateCognitoAuthUrl(mockConfig, 'outlook');

      expect(url).toContain('identity_provider=login.microsoftonline.com');
    });

    it('should generate auth URL for Apple provider', () => {
      const url = generateCognitoAuthUrl(mockConfig, 'apple');

      expect(url).toContain('identity_provider=SignInWithApple');
    });

    it('should include state parameter when provided', () => {
      const state = 'random-state-string-123';
      const url = generateCognitoAuthUrl(mockConfig, 'google', state);

      expect(url).toContain(`state=${state}`);
    });

    it('should not include state parameter when not provided', () => {
      const url = generateCognitoAuthUrl(mockConfig, 'google');

      expect(url).not.toContain('state=');
    });

    it('should use correct region in URL', () => {
      const configWithRegion: CognitoConfig = {
        ...mockConfig,
        region: 'eu-west-1',
      };

      const url = generateCognitoAuthUrl(configWithRegion, 'google');

      expect(url).toContain('test-domain.auth.eu-west-1.amazoncognito.com');
    });
  });
});

