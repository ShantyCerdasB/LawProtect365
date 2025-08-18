/**
 * Rate limiting configuration and defaults.
 */

export interface RateLimitConfig {
  /** Requests per minute allowed. */
  limitPerMinute: number;
  /** Additional burst capacity to absorb short spikes. */
  burst: number;
  /** Whether to emit X-RateLimit-* headers in responses. */
  emitHeaders: boolean;
}

/**
 * Returns a safe default rate limit configuration.
 * @param envName Environment name for environment-aware tuning.
 */
export const defaultRateLimit = (envName: string): RateLimitConfig => {
  const isProd = envName.toLowerCase() === "prod";
  return {
    limitPerMinute: isProd ? 900 : 1800,
    burst: isProd ? 200 : 400,
    emitHeaders: true
  };
};
