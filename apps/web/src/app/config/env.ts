/**
 * @fileoverview Environment Config - Typed access to Vite environment variables
 * @summary Central place to read public runtime configuration
 * @description
 * This module reads from a Vite-like environment (`import.meta.env` in the browser)
 * and falls back to a global shim when running in non-Vite environments such as Jest.
 */

type EnvShape = {
  VITE_API_BASE_URL?: string;
  VITE_APP_NAME?: string;
};

/**
 * Resolve environment values from either a Vite-style import.meta.env (at runtime)
 * or a global shim used by Jest/Node.
 */
function resolveRuntimeEnv(): EnvShape {
  let metaEnv: EnvShape | undefined;

  try {
    // Access import.meta via dynamic Function to avoid TypeScript parsing it as a meta-property.
    // eslint-disable-next-line no-new-func
    const meta = (Function('return import.meta')() as { env?: EnvShape } | undefined);
    metaEnv = meta?.env;
  } catch {
    metaEnv = undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalShim = (globalThis as any).import_meta_env as EnvShape | undefined;

  return metaEnv || globalShim || {};
}

const resolvedEnv: EnvShape = resolveRuntimeEnv();

export const env = {
  apiBaseUrl: resolvedEnv.VITE_API_BASE_URL ?? '',
  appName: resolvedEnv.VITE_APP_NAME ?? 'LawProtect365',
};

