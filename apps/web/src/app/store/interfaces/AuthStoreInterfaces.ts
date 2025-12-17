/**
 * @fileoverview Auth Store Interfaces - Types for authentication store
 * @summary Type definitions for authentication store state
 * @description Defines interfaces used by the authentication Zustand store.
 */

/**
 * @description Cognito token storage structure.
 * @property {string} idToken - JWT ID token
 * @property {string} accessToken - Access token for API calls
 * @property {string} refreshToken - Refresh token for obtaining new access tokens
 * @property {number} expiresAt - Token expiration timestamp in milliseconds
 */
export interface CognitoTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * @description Authentication store state interface.
 * @property {boolean} isAuthenticated - Whether user is currently authenticated
 * @property {CognitoTokens | null} tokens - Stored Cognito tokens or null if not authenticated
 * @property {Function} setAuthenticated - Function to set authentication status
 * @property {Function} setTokens - Function to store Cognito tokens
 * @property {Function} login - Function to perform login (sets authenticated to true)
 * @property {Function} logout - Function to perform logout (clears tokens and sets authenticated to false)
 */
export interface AuthState {
  isAuthenticated: boolean;
  tokens: CognitoTokens | null;
  setAuthenticated: (value: boolean) => void;
  setTokens: (tokens: CognitoTokens) => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

