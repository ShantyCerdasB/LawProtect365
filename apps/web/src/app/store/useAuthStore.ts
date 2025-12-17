/**
 * @fileoverview Auth Store - Zustand store for authentication state management
 * @summary Manages user authentication state and Cognito tokens
 * @description
 * Provides a Zustand store for managing authentication state, including Cognito OAuth tokens.
 * Handles token storage, authentication status, and login/logout operations.
 */

import { create } from 'zustand';
import type { AuthState, CognitoTokens } from './interfaces/AuthStoreInterfaces';

/**
 * @description Zustand store for authentication state management.
 * Manages user authentication status and Cognito OAuth tokens.
 */
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  tokens: null,
  setAuthenticated: (value: boolean) => set({ isAuthenticated: value }),
  setTokens: (tokens: CognitoTokens) => {
    set({ tokens, isAuthenticated: true });
  },
  login: async () => {
    set({ isAuthenticated: true });
  },
  logout: async () => {
    set({ isAuthenticated: false, tokens: null });
  },
}));

