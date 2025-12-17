/**
 * @fileoverview useCognitoAuth Hook - React hook for Cognito OAuth authentication
 * @summary Custom hook for managing Cognito OAuth flows
 * @description
 * Provides a React hook to handle Cognito OAuth authentication flows including
 * generating authorization URLs and exchanging authorization codes for tokens.
 * This hook is shared between web and mobile applications. Platform-specific
 * navigation is handled via the DeepLinkPort interface.
 */

import { useCallback } from 'react';
import { generateCognitoAuthUrl, exchangeCodeForTokens } from '../api/cognitoApi';
import type { UseCognitoAuthConfig, UseCognitoAuthReturn } from '../interfaces';
import type { OAuthProvider, CognitoTokenResponse } from '../types';

/**
 * @description React hook for managing Cognito OAuth authentication flows.
 * @param {UseCognitoAuthConfig} hookConfig - Hook configuration with Cognito config
 * @returns {UseCognitoAuthReturn} Object with functions to initiate auth and handle callbacks
 *
 * @example
 * ```typescript
 * const { initiateAuth, handleCallback } = useCognitoAuth({
 *   config: {
 *     domain: 'myapp-dev',
 *     clientId: 'abc123',
 *     region: 'us-east-1',
 *     callbackUrl: 'https://app.example.com/callback'
 *   }
 * });
 *
 * // Initiate OAuth flow
 * initiateAuth('google');
 *
 * // Handle callback
 * const tokens = await handleCallback(authorizationCode);
 * ```
 */
export function useCognitoAuth({ config, deepLinkPort }: UseCognitoAuthConfig): UseCognitoAuthReturn {
  const initiateAuth = useCallback(
    (provider: OAuthProvider, state?: string) => {
      const authUrl = generateCognitoAuthUrl(config, provider, state);
      if (deepLinkPort) {
        deepLinkPort.openUrl(authUrl);
      } else if (typeof window !== 'undefined') {
        window.location.href = authUrl;
      }
    },
    [config, deepLinkPort]
  );

  const handleCallback = useCallback(
    async (code: string): Promise<CognitoTokenResponse> => {
      return exchangeCodeForTokens(config, {
        code,
        redirect_uri: config.callbackUrl,
      });
    },
    [config]
  );

  return {
    initiateAuth,
    handleCallback,
  };
}

