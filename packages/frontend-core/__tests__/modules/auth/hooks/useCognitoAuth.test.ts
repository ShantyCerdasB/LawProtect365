/**
 * @fileoverview useCognitoAuth Hook Tests - Unit tests for Cognito OAuth hook
 * @summary Tests for useCognitoAuth.ts module
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useCognitoAuth } from '../../../../src/modules/auth/hooks/useCognitoAuth';
import { exchangeCodeForTokens, generateCognitoAuthUrl } from '../../../../src/modules/auth/api/cognitoApi';
import type { CognitoConfig } from '../../../../src/modules/auth/types';

jest.mock('../../../../src/modules/auth/api/cognitoApi');

describe('useCognitoAuth', () => {
  const mockConfig: CognitoConfig = {
    userPoolId: 'us-east-1_test123',
    domain: 'test-domain',
    clientId: 'test-client-id',
    region: 'us-east-1',
    callbackUrl: 'https://app.example.com/callback',
  };

  const mockDeepLinkPort = {
    openUrl: jest.fn(),
    getInitialUrl: jest.fn().mockResolvedValue(null),
    addListener: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (generateCognitoAuthUrl as jest.Mock).mockReturnValue('https://test-auth-url.com');
    (exchangeCodeForTokens as jest.Mock).mockResolvedValue({
      id_token: 'id-token',
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });
  });

  describe('initiateAuth', () => {
    it('should generate auth URL and open via deepLinkPort when provided (lines 40-48)', () => {
      const { result } = renderHook(() =>
        useCognitoAuth({
          config: mockConfig,
          deepLinkPort: mockDeepLinkPort,
        })
      );

      act(() => {
        result.current.initiateAuth('google', 'state-123');
      });

      expect(generateCognitoAuthUrl).toHaveBeenCalledWith(mockConfig, 'google', 'state-123');
      expect(mockDeepLinkPort.openUrl).toHaveBeenCalledWith('https://test-auth-url.com');
    });

    it('should use window.location.href when deepLinkPort is not provided and window exists', () => {
      const originalWindow = global.window;
      const mockLocation = {
        href: '',
      };
      Object.defineProperty(global, 'window', {
        value: {
          location: mockLocation,
        },
        writable: true,
      });

      const { result } = renderHook(() =>
        useCognitoAuth({
          config: mockConfig,
        })
      );

      act(() => {
        result.current.initiateAuth('google');
      });

      expect(generateCognitoAuthUrl).toHaveBeenCalledWith(mockConfig, 'google', undefined);
      expect(mockLocation.href).toBe('https://test-auth-url.com');

      global.window = originalWindow;
    });

    it('should handle all OAuth providers', () => {
      const { result } = renderHook(() =>
        useCognitoAuth({
          config: mockConfig,
          deepLinkPort: mockDeepLinkPort,
        })
      );

      const providers = ['google', 'outlook', 'apple'] as const;

      providers.forEach((provider) => {
        act(() => {
          result.current.initiateAuth(provider);
        });

        expect(generateCognitoAuthUrl).toHaveBeenCalledWith(mockConfig, provider, undefined);
      });
    });

    it('should pass state parameter when provided', () => {
      const { result } = renderHook(() =>
        useCognitoAuth({
          config: mockConfig,
          deepLinkPort: mockDeepLinkPort,
        })
      );

      act(() => {
        result.current.initiateAuth('google', 'custom-state-123');
      });

      expect(generateCognitoAuthUrl).toHaveBeenCalledWith(mockConfig, 'google', 'custom-state-123');
    });
  });

  describe('handleCallback', () => {
    it('should exchange code for tokens (lines 52-60)', async () => {
      const { result } = renderHook(() =>
        useCognitoAuth({
          config: mockConfig,
        })
      );

      let tokens;
      await act(async () => {
        tokens = await result.current.handleCallback('auth-code-123');
      });

      expect(exchangeCodeForTokens).toHaveBeenCalledWith(mockConfig, {
        code: 'auth-code-123',
        redirect_uri: mockConfig.callbackUrl,
      });
      expect(tokens).toEqual({
        id_token: 'id-token',
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
    });

    it('should use config callbackUrl for redirect_uri', async () => {
      const { result } = renderHook(() =>
        useCognitoAuth({
          config: mockConfig,
        })
      );

      await act(async () => {
        await result.current.handleCallback('code-123');
      });

      expect(exchangeCodeForTokens).toHaveBeenCalledWith(
        mockConfig,
        expect.objectContaining({
          redirect_uri: mockConfig.callbackUrl,
        })
      );
    });

    it('should handle token exchange errors', async () => {
      const error = new Error('Token exchange failed');
      (exchangeCodeForTokens as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() =>
        useCognitoAuth({
          config: mockConfig,
        })
      );

      await expect(
        act(async () => {
          await result.current.handleCallback('invalid-code');
        })
      ).rejects.toThrow('Token exchange failed');
    });
  });

  it('should memoize functions with useCallback', () => {
    const { result, rerender } = renderHook(() =>
      useCognitoAuth({
        config: mockConfig,
        deepLinkPort: mockDeepLinkPort,
      })
    );

    const firstInitiateAuth = result.current.initiateAuth;
    const firstHandleCallback = result.current.handleCallback;

    rerender();

    expect(result.current.initiateAuth).toBe(firstInitiateAuth);
    expect(result.current.handleCallback).toBe(firstHandleCallback);
  });

  it('should update functions when config changes', () => {
    const { result, rerender } = renderHook(
      ({ config }) =>
        useCognitoAuth({
          config,
          deepLinkPort: mockDeepLinkPort,
        }),
      {
        initialProps: { config: mockConfig },
      }
    );

    const firstInitiateAuth = result.current.initiateAuth;

    const newConfig = { ...mockConfig, clientId: 'new-client-id' };
    rerender({ config: newConfig });

    expect(result.current.initiateAuth).not.toBe(firstInitiateAuth);
  });
});

