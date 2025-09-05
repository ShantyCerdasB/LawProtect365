import { loadEnv, Env } from "../validation/env.js";
import { buildDefaultCors } from "./cors.js";
import { defaultRateLimit } from "./rateLimit.js";
import { loadFeatureFlags } from "./flags.js";
import type { AppConfig, Environment } from "./types.js";
import { LogLevel } from "..//index.js";

/**
 * Builds the typed application configuration from process.env and defaults.
 * Merges feature flags, rate limiting and default CORS settings.
 *
 * @param overrides Optional partial overrides for testing or local runs.
 */
export const buildAppConfig = (overrides?: Partial<AppConfig>): AppConfig => {
  const base = loadEnv(Env);

  const env = (base.ENV as Environment) ?? "dev";
  const logLevel = (base.LOG_LEVEL as LogLevel) ?? "info";

  const flags = loadFeatureFlags();
  
  let corsAllowedOrigins: string[] | "*";
  if (process.env.CORS_ALLOWED_ORIGINS) {
    if (process.env.CORS_ALLOWED_ORIGINS === "*") {
      corsAllowedOrigins = "*";
    } else {
      corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
    }
  } else {
    corsAllowedOrigins = "*";
  }

  const rateLimit = defaultRateLimit(env);

  const cfg: AppConfig = {
    projectName: base.PROJECT_NAME as string,
    serviceName: base.SERVICE_NAME as string,
    region: base.AWS_REGION as string,
    env,
    logLevel,
    jwtIssuer: base.JWT_ISSUER as string | undefined,
    jwtAudience: base.JWT_AUDIENCE as string | undefined,
    isDev: env === "dev",
    isStaging: env === "staging",
    isProd: env === "prod",
    corsAllowedOrigins,
    flags,
    rateLimit
  };

  // Shallow merge overrides
  return { ...cfg, ...(overrides ?? {}) };
};

/**
 * Convenience helper that returns a default CORS config object
 * derived from the AppConfig's corsAllowedOrigins.
 * @param cfg Application configuration.
 */
export const corsFromConfig = (cfg: Pick<AppConfig, "corsAllowedOrigins">) =>
  buildDefaultCors(cfg.corsAllowedOrigins ?? "*");
