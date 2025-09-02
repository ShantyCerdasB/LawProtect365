/**
 * @file SsmParamConfigProviderTypes.ts
 * @summary Types for SSM parameter config provider operations
 * @description Defines interfaces and types for SSM parameter config provider functionality
 */

/**
 * Options for SsmParamConfigProvider.
 *
 * @property maxAttempts        Maximum attempts per SSM call. Default: `SSM_MAX_ATTEMPTS` (3).
 * @property defaultTtlMs       Default cache TTL in milliseconds. Default: `SSM_DEFAULT_TTL_MS` (30000).
 * @property envFallbackPrefix  Optional prefix to read env fallbacks. If set, a parameter like `/foo/bar`
 *                              maps to `process.env[<prefix>__FOO_BAR]` (slashes → `_`). Default: `SSM_FALLBACK_PREFIX`.
 */
export interface SsmParamConfigProviderOptions {
  maxAttempts?: number;
  defaultTtlMs?: number;
  envFallbackPrefix?: string;
}

/** Internal cache entry. */
export type CacheEntry = {
  value: string | undefined;
  expiresAt: number;
};
