/**
 * Minimal logger contract.
 */
export interface LoggerLike {
  debug(msg: string, meta?: unknown): void;
  info(msg: string, meta?: unknown): void;
  warn(msg: string, meta?: unknown): void;
  error(msg: string, meta?: unknown): void;
  child?(bindings: Record<string, unknown>): LoggerLike;
}

/**
 * Minimal metrics contract.
 */
export interface MetricsLike {
  increment(name: string, tags?: Record<string, string>, value?: number): void;
  gauge(name: string, value: number, tags?: Record<string, string>): void;
  timing(name: string, ms: number, tags?: Record<string, string>): void;
}

/**
 * Minimal tracer contract.
 */
export interface TracerLike {
  startSpan(
    name: string,
    attributes?: Record<string, unknown>
  ): { end(): void; setAttribute(key: string, value: unknown): void; recordException?(e: unknown): void };
}

/**
 * Application-wide per-request context passed into use cases.
 */
export interface AppContext {
  /** Environment name (dev/staging/prod). */
  env: string;
  /** Correlation id for logs/metrics/traces. */
  requestId?: string;
  /** Logger implementation. */
  logger: LoggerLike;
  /** Metrics implementation. */
  metrics: MetricsLike;
  /** Tracer implementation. */
  tracer: TracerLike;
  /** Arbitrary attachments (tenant, auth, feature flags). */
  bag?: Record<string, unknown>;
}
