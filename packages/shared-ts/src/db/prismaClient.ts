import { PrismaClient, Prisma } from "@prisma/client";
import { getEnv, getNumber } from "../utils/env.js";
import { resolveDatabaseUrlFromSecret } from "../aws/secrets/index.js";

/**
 * Prisma client singleton for Lambda and local environments.
 * Uses a global reference to avoid exhausting connection pools in dev/hot-reload.
 */

declare global {
  // eslint-disable-next-line no-var
  var __PRISMA__: PrismaClient | undefined;
}

/**
 * Options for Prisma client construction.
 */
export interface PrismaFactoryOptions {
  /** Optional log configuration (levels or definitions). */
  log?: (Prisma.LogLevel | Prisma.LogDefinition)[];
  /** Optional datasource URL override; defaults to process.env.DATABASE_URL. */
  url?: string;
}

/**
 * Returns a process-wide PrismaClient instance (singleton).
 * Creates the instance lazily on first call and reuses it thereafter.
 *
 * @param opts Optional factory overrides.
 */
export const getPrisma = (opts: PrismaFactoryOptions = {}): PrismaClient => {
  if (!globalThis.__PRISMA__) {
    const url = opts.url ?? getEnv("DATABASE_URL");
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    const log = opts.log ?? normalizeLogLevels();
    globalThis.__PRISMA__ = new PrismaClient({
      datasources: { db: { url } },
      log
    });
  }
  return globalThis.__PRISMA__!;
};

/**
 * Ensures DATABASE_URL is available, resolving from Secrets Manager if needed.
 * - If process.env.DATABASE_URL exists, returns it.
 * - Else reads JSON from Secrets Manager using env DB_SECRET_ARN and extracts DATABASE_URL.
 * - Caches the resolved value back into process.env for future calls.
 */
export const ensureDatabaseUrl = async (): Promise<string> => {
  const existing = getEnv("DATABASE_URL");
  if (existing && existing.length > 0) return existing;

  const arn = getEnv("DB_SECRET_ARN");
  if (!arn) throw new Error("DATABASE_URL is not set and DB_SECRET_ARN is missing");

  const urlFromSecret = await resolveDatabaseUrlFromSecret(arn);
  process.env.DATABASE_URL = urlFromSecret;
  return urlFromSecret;
};

/** Async variant that resolves DB URL from secret if needed before creating client. */
export const getPrismaAsync = async (opts: PrismaFactoryOptions = {}): Promise<PrismaClient> => {
  if (!opts.url && !getEnv("DATABASE_URL")) {
    await ensureDatabaseUrl();
  }
  return getPrisma(opts);
};

/**
 * Returns a new PrismaClient without caching. Prefer getPrisma() for normal usage.
 * Useful for one-off scripts or tests that require isolated clients.
 *
 * @param opts Optional factory overrides.
 */
export const createPrisma = (opts: PrismaFactoryOptions = {}): PrismaClient => {
  const url = opts.url ?? getEnv("DATABASE_URL");
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const log = opts.log ?? normalizeLogLevels();
  return new PrismaClient({ datasources: { db: { url } }, log });
};

/** Async variant that resolves DB URL from secret if needed before creating client. */
export const createPrismaAsync = async (opts: PrismaFactoryOptions = {}): Promise<PrismaClient> => {
  const url = opts.url ?? getEnv("DATABASE_URL") ?? await ensureDatabaseUrl();
  const log = opts.log ?? normalizeLogLevels();
  return new PrismaClient({ datasources: { db: { url } }, log });
};

/**
 * Normalizes Prisma log config from environment.
 * LOG_LEVEL supports "debug" | "info" | "warn" | "error".
 * DEBUG_SQL=1 enables query logging.
 */
const normalizeLogLevels = (): (Prisma.LogLevel | Prisma.LogDefinition)[] => {
  const level = String(process.env.LOG_LEVEL ?? "info").toLowerCase();
  const base: Prisma.LogLevel[] = ["error", "warn", "info", "debug"].includes(level as any)
    ? (["error", "warn", level] as Prisma.LogLevel[])
    : ["error", "warn", "info"];

  const debugSql = getNumber("DEBUG_SQL", 0) === 1;
  if (debugSql) {
    return [
      ...base,
      { emit: "event", level: "query" } satisfies Prisma.LogDefinition,
      { emit: "event", level: "error" } satisfies Prisma.LogDefinition,
      { emit: "event", level: "warn" } satisfies Prisma.LogDefinition
    ];
  }
  return base;
};
