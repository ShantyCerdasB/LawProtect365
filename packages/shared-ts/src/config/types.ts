/**
 * Shared configuration types for environment, logging and service metadata.
 */

export type Environment = "dev" | "staging" | "prod";

export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Service identity and platform metadata.
 */
export interface ServiceIdentity {
  /** Project name (e.g., "lawprotect365"). */
  projectName: string;
  /** Logical service name (e.g., "documents-service"). */
  serviceName: string;
  /** AWS region or deployment region identifier. */
  region: string;
}

/**
 * Aggregated application configuration derived from process.env and defaults.
 */
export interface AppConfig extends ServiceIdentity {
  /** Current environment. */
  env: Environment;
  /** Logging level. */
  logLevel: LogLevel;

  /** Optional JWT issuer URL. */
  jwtIssuer?: string;
  /** Optional JWT audience string or CSV. */
  jwtAudience?: string;

  /** Derived flags. */
  isDev: boolean;
  isStaging: boolean;
  isProd: boolean;

  /** Optional default CORS policy serialized as string array or wildcard. */
  corsAllowedOrigins?: string[] | "*";

  /** Feature flags namespace. */
  flags: Record<string, boolean>;

  /** Rate limiting defaults. */
  rateLimit?: {
    limitPerMinute: number;
    burst: number;
    emitHeaders: boolean;
  };
}
