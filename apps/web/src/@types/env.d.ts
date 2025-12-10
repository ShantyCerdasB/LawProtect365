/**
 * @fileoverview Vite Env Types - Minimal typing for import.meta.env
 * @summary Describes the environment variables used by the web app
 */

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  // Extend with more env vars as needed
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


