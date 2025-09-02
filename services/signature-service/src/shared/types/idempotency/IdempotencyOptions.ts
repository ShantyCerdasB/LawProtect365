/**
 * @file IdempotencyOptions.ts
 * @summary Default configuration options for idempotency
 * @description Provides default values and environment-specific configurations
 */

import type { IdempotencyRunnerOptions } from "./IdempotencyTypes";

/**
 * Default idempotency runner options.
 */
export const DEFAULT_IDEMPOTENCY_OPTIONS: Required<IdempotencyRunnerOptions> = {
  defaultTtlSeconds: 300, // 5 minutes
};

/**
 * Environment-specific idempotency configurations.
 */
export const IDEMPOTENCY_CONFIGS = {
  development: {
    ...DEFAULT_IDEMPOTENCY_OPTIONS,
    defaultTtlSeconds: 60, // 1 minute for faster testing
  },
  staging: {
    ...DEFAULT_IDEMPOTENCY_OPTIONS,
    defaultTtlSeconds: 180, // 3 minutes
  },
  production: {
    ...DEFAULT_IDEMPOTENCY_OPTIONS,
    defaultTtlSeconds: 300, // 5 minutes
  },
} as const;
