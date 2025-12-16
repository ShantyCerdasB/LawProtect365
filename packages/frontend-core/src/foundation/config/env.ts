/**
 * @fileoverview Environment Config - Shared environment configuration for web and mobile
 * @summary Central place to read environment variables across platforms
 * @description
 * This module provides a platform-agnostic way to access environment variables.
 * It works in both web (Vite) and mobile (React Native) environments.
 * All API base URLs and service configurations are defined here.
 */

/**
 * @description Resolves environment values from platform-specific sources.
 * Supports Vite (web) and React Native environments.
 */
function resolveRuntimeEnv(): Record<string, string | undefined> {
  let env: Record<string, string | undefined> = {};

  // Try Vite environment (web)
  try {
    // eslint-disable-next-line no-new-func
    const meta = Function('return import.meta')() as { env?: Record<string, string> } | undefined;
    if (meta?.env) {
      env = { ...env, ...meta.env };
    }
  } catch {
    // Not in Vite environment
  }

  // Try React Native environment
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reactNativeEnv = (globalThis as any).process?.env as Record<string, string> | undefined;
    if (reactNativeEnv) {
      env = { ...env, ...reactNativeEnv };
    }
  } catch {
    // Not in React Native environment
  }

  // Try global shim (for tests)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalShim = (globalThis as any).import_meta_env as Record<string, string> | undefined;
    if (globalShim) {
      env = { ...env, ...globalShim };
    }
  } catch {
    // No global shim
  }

  return env;
}

const resolvedEnv = resolveRuntimeEnv();

/**
 * @description Environment configuration for the application.
 * All API base URLs and service endpoints are defined here.
 */
export const env = {
  /**
   * @description Base URL for the main API (auth, users, etc.)
   */
  apiBaseUrl: resolvedEnv.VITE_API_BASE_URL || resolvedEnv.API_BASE_URL || '',

  /**
   * @description Base URL for the signature service API
   */
  signatureApiBaseUrl: resolvedEnv.VITE_SIGNATURE_API_BASE_URL || resolvedEnv.SIGNATURE_API_BASE_URL || resolvedEnv.apiBaseUrl || '',

  /**
   * @description Base URL for the documents service API
   */
  documentsApiBaseUrl: resolvedEnv.VITE_DOCUMENTS_API_BASE_URL || resolvedEnv.DOCUMENTS_API_BASE_URL || resolvedEnv.apiBaseUrl || '',

  /**
   * @description Base URL for the notifications service API
   */
  notificationsApiBaseUrl: resolvedEnv.VITE_NOTIFICATIONS_API_BASE_URL || resolvedEnv.NOTIFICATIONS_API_BASE_URL || resolvedEnv.apiBaseUrl || '',

  /**
   * @description Application name
   */
  appName: resolvedEnv.VITE_APP_NAME || resolvedEnv.APP_NAME || 'LawProtect365',
} as const;

