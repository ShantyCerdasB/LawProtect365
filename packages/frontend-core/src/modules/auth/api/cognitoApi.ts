/**
 * @fileoverview Cognito API - Functions for Cognito OAuth token exchange
 * @summary API functions for exchanging authorization codes for tokens
 * @description
 * Provides functions to exchange OAuth authorization codes for Cognito tokens
 * using the Cognito Token Endpoint. This is a shared implementation used
 * by both web and mobile applications.
 */

import type { CognitoTokenResponse, CognitoTokenExchangeRequest, CognitoConfig } from '../types';

/**
 * @description Exchanges an OAuth authorization code for Cognito tokens.
 * @param {CognitoConfig} config - Cognito configuration (domain, clientId, region, callbackUrl)
 * @param {CognitoTokenExchangeRequest} params - Token exchange parameters (code, redirect_uri)
 * @returns {Promise<CognitoTokenResponse>} Cognito token response with id_token, access_token, and refresh_token
 * @throws {Error} If the token exchange fails or returns an error response
 *
 * @example
 * ```typescript
 * const tokens = await exchangeCodeForTokens(
 *   {
 *     domain: 'myapp-dev',
 *     clientId: 'abc123',
 *     region: 'us-east-1',
 *     callbackUrl: 'https://app.example.com/callback'
 *   },
 *   {
 *     code: 'authorization_code_from_callback',
 *     redirect_uri: 'https://app.example.com/callback'
 *   }
 * );
 * ```
 */
export async function exchangeCodeForTokens(
  config: CognitoConfig,
  params: CognitoTokenExchangeRequest
): Promise<CognitoTokenResponse> {
  const tokenEndpoint = `https://${config.domain}.auth.${config.region}.amazoncognito.com/oauth2/token`;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    code: params.code,
    redirect_uri: params.redirect_uri,
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Token exchange failed: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
    );
  }

  return (await response.json()) as CognitoTokenResponse;
}

/**
 * @description Generates a Cognito Hosted UI authorization URL for OAuth provider login.
 * @param {CognitoConfig} config - Cognito configuration
 * @param {string} provider - OAuth provider identifier ('google', 'outlook', 'apple')
 * @param {string} [state] - Optional state parameter for CSRF protection
 * @returns {string} Complete authorization URL for redirecting to Cognito Hosted UI
 *
 * @example
 * ```typescript
 * const authUrl = generateCognitoAuthUrl(
 *   {
 *     domain: 'myapp-dev',
 *     clientId: 'abc123',
 *     region: 'us-east-1',
 *     callbackUrl: 'https://app.example.com/callback'
 *   },
 *   'google',
 *   'random-state-string'
 * );
 * window.location.href = authUrl;
 * ```
 */
export function generateCognitoAuthUrl(
  config: CognitoConfig,
  provider: 'google' | 'outlook' | 'apple',
  state?: string
): string {
  const baseUrl = `https://${config.domain}.auth.${config.region}.amazoncognito.com/oauth2/authorize`;

  const providerMap: Record<'google' | 'outlook' | 'apple', string> = {
    google: 'accounts.google.com',
    outlook: 'login.microsoftonline.com',
    apple: 'SignInWithApple',
  };

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    identity_provider: providerMap[provider],
    scope: 'openid email profile',
  });

  if (state) {
    params.append('state', state);
  }

  return `${baseUrl}?${params.toString()}`;
}

