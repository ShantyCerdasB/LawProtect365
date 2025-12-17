/**
 * @fileoverview Cognito Types - Type definitions for AWS Cognito OAuth integration
 * @summary Type definitions for Cognito authentication flows
 * @description
 * Contains TypeScript types and interfaces for Cognito OAuth authentication,
 * token management, and provider configuration. Used across web and mobile platforms.
 */

/**
 * @description Supported OAuth identity providers for Cognito authentication.
 */
export type OAuthProvider = 'google' | 'outlook' | 'apple';

/**
 * @description Cognito token response structure after code exchange.
 * @property {string} id_token - JWT ID token containing user identity claims
 * @property {string} access_token - Access token for API authentication
 * @property {string} refresh_token - Refresh token for obtaining new access tokens
 * @property {string} token_type - Token type, typically "Bearer"
 * @property {number} expires_in - Token expiration time in seconds
 */
export interface CognitoTokenResponse {
  id_token: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * @description Cognito token exchange request parameters.
 * @property {string} code - Authorization code from OAuth callback
 * @property {string} redirect_uri - Redirect URI used in the authorization request
 */
export interface CognitoTokenExchangeRequest {
  code: string;
  redirect_uri: string;
}

/**
 * @description Cognito Hosted UI authorization URL parameters.
 * @property {string} client_id - Cognito App Client ID
 * @property {string} redirect_uri - Callback URL after authentication
 * @property {string} response_type - OAuth response type (typically "code")
 * @property {string} identity_provider - OAuth provider identifier
 * @property {string} [state] - Optional state parameter for CSRF protection
 * @property {string[]} [scope] - Optional OAuth scopes
 */
export interface CognitoAuthUrlParams {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  identity_provider: string;
  state?: string;
  scope?: string[];
}

/**
 * @description Cognito configuration for OAuth flows.
 * @property {string} userPoolId - Cognito User Pool ID
 * @property {string} clientId - Cognito App Client ID
 * @property {string} domain - Cognito Hosted UI domain prefix
 * @property {string} region - AWS region where Cognito is deployed
 * @property {string} callbackUrl - OAuth callback URL
 */
export interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  domain: string;
  region: string;
  callbackUrl: string;
}

/**
 * @description OAuth callback URL parameters from Cognito redirect.
 * @property {string} code - Authorization code for token exchange
 * @property {string} [state] - State parameter for CSRF validation
 * @property {string} [error] - Error code if authentication failed
 * @property {string} [error_description] - Human-readable error description
 */
export interface OAuthCallbackParams {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

