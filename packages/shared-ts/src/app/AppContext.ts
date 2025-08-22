/**
 * @file AppContext.ts
 * @summary Request-scoped application context contracts.
 */

/**
 * Minimal logger contract for structured logging.
 */
export interface LoggerLike {
  debug(msg: string, meta?: unknown): void;
  info(msg: string, meta?: unknown): void;
  warn(msg: string, meta?: unknown): void;
  error(msg: string, meta?: unknown): void;
  child?(bindings: Record<string, unknown>): LoggerLike;
}

/**
 * Minimal metrics contract for counters, gauges and timings.
 */
export interface MetricsLike {
  increment(name: string, tags?: Record<string, string>, value?: number): void;
  gauge(name: string, value: number, tags?: Record<string, string>): void;
  timing(name: string, ms: number, tags?: Record<string, string>): void;
}

/**
 * Minimal tracer contract for span lifecycle.
 */
export interface TracerLike {
  startSpan(
    name: string,
    attributes?: Record<string, unknown>
  ): { end(): void; setAttribute(key: string, value: unknown): void; recordException?(e: unknown): void };
}

/**
 * Request-scoped application context shared across controllers and use cases.
 */
export interface AppContext {
  /** Environment name (dev/staging/prod). */
  env: string;
  /** Correlation identifier for observability. */
  requestId?: string;
  /** Logger implementation. */
  logger: LoggerLike;
  /** Metrics implementation. */
  metrics: MetricsLike;
  /** Tracer implementation. */
  tracer: TracerLike;
  /** Arbitrary bag for tenant/auth/flags or other per-request data. */
  bag?: Record<string, unknown>;
}
