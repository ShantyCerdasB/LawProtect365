/**
 * @fileoverview Auth Store Interfaces - Types for authentication store
 * @summary Type definitions for authentication store state
 * @description Defines interfaces used by the authentication Zustand store.
 */

export interface AuthState {
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

