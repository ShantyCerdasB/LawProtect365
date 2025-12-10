/**
 * @fileoverview Environment Config - Typed access to Vite environment variables
 * @summary Central place to read public runtime configuration
 * @description
 * This module reads from `import.meta.env` and exposes a small, typed `env` object
 * that can be imported by feature modules without coupling them to Vite APIs.
 */

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  appName: 'LawProtect365'
};

