/**
 * @file RateLimits.rules.ts
 * @summary Domain rules for rate limiting and safe list pagination.
 *
 * @remarks
 * - Pulls environment-aware limits from the shared config helper `defaultRateLimit`.
 * - Emits shared AppError with `COMMON_TOO_MANY_REQUESTS` on limit violation.
 */

import { AppError, ErrorCodes } from "@lawprotect/shared-ts";
import { defaultRateLimit, type RateLimitConfig } from "@lawprotect/shared-ts";

/**
 * Selects a rate-limit config using the current environment.
 *
 * @param envName - Runtime environment name (e.g., "dev" | "staging" | "prod").
 * @returns A `RateLimitConfig` with per-minute limit, burst, and header emission flag.
 */
export const selectRateLimitConfig = (envName = process.env.ENV ?? "dev"): RateLimitConfig =>
  defaultRateLimit(envName);

/**
 * Asserts a per-minute rate limit against a usage counter.
 *
 * @param usedInCurrentWindow - Requests already counted in the current window.
 * @param cfg - Rate-limit config (defaults to `selectRateLimitConfig()`).
 * @throws {AppError} 429 Too Many Requests when the limit is reached or exceeded.
 */
export const assertRateLimit = (
  usedInCurrentWindow: number,
  cfg: RateLimitConfig = selectRateLimitConfig()
): void => {
  // Allow a short burst over the steady limit
  const ceiling = cfg.limitPerMinute + cfg.burst;
  if (usedInCurrentWindow >= ceiling) {
    throw new AppError(
      ErrorCodes.COMMON_TOO_MANY_REQUESTS,
      429,
      "Rate limit exceeded"
    );
  }
};

/**
 * Builds optional `X-RateLimit-*` headers (controllers may include them in responses).
 *
 * @param usedInCurrentWindow - Requests used in the current window.
 * @param cfg - Rate-limit config.
 * @returns A header map or `{}` when `emitHeaders=false`.
 *
 * @example
 * ```ts
 * const headers = toRateLimitHeaders(used, selectRateLimitConfig());
 * return ok(data, headers);
 * ```
 */
export const toRateLimitHeaders = (
  usedInCurrentWindow: number,
  cfg: RateLimitConfig = selectRateLimitConfig()
): Record<string, string> => {
  if (!cfg.emitHeaders) return {};
  const limit = cfg.limitPerMinute;
  const remaining = Math.max(0, limit - usedInCurrentWindow);
  // `X-RateLimit-Reset` is left to the transport layer if you have precise window timestamps.
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
  };
};

/**
 * Clamps a requested page size into an allowed range.
 *
 * @param requested - Requested page size from the client.
 * @param min - Minimum allowed size (default: 1).
 * @param max - Maximum allowed size (default: 100).
 * @returns A safe page size within [min, max].
 */
export const clampListPageSize = (
  requested: number | undefined,
  min = 1,
  max = 100
): number => {
  if (!Number.isFinite(requested as number) || (requested as number) <= 0) return min;
  const n = Math.floor(requested as number);
  if (n < min) return min;
  if (n > max) return max;
  return n;
};
