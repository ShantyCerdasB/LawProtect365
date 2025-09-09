/**
 * @file types.ts
 * @summary SSM implementation types
 * @description Types for SSM Parameter Store implementation
 */

export interface SsmParamConfigProviderOptions {
  maxAttempts?: number;
  defaultTtlMs?: number;
  envFallbackPrefix?: string;
}

export interface CacheEntry {
  value: string;
  expiresAt: number;
}


