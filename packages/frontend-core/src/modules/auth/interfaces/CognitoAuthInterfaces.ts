/**
 * @fileoverview Cognito Auth Interfaces - Type definitions for Cognito OAuth hooks
 * @summary Defines interfaces for useCognitoAuth hook
 * @description
 * Contains TypeScript interfaces for the useCognitoAuth hook, including configuration
 * and return type definitions. Used for Cognito OAuth authentication flows.
 */

import type { CognitoConfig, OAuthProvider, CognitoTokenResponse } from '../types';
import type { DeepLinkPort } from '../../../ports/linking';

/**
 * @description Configuration for the useCognitoAuth hook.
 * @property {CognitoConfig} config - Cognito configuration (domain, clientId, region, callbackUrl)
 * @property {DeepLinkPort} [deepLinkPort] - Optional deep link port for mobile navigation
 */
export interface UseCognitoAuthConfig {
  config: CognitoConfig;
  deepLinkPort?: DeepLinkPort;
}

/**
 * @description Return type for the useCognitoAuth hook.
 * @property {Function} initiateAuth - Function to redirect to Cognito Hosted UI for OAuth login
 * @property {Function} handleCallback - Function to exchange authorization code for tokens
 */
export interface UseCognitoAuthReturn {
  initiateAuth: (provider: OAuthProvider, state?: string) => void;
  handleCallback: (code: string) => Promise<CognitoTokenResponse>;
}

