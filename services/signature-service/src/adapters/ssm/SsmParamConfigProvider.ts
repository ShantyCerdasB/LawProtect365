/**
 * @file SsmParamConfigProvider.ts
 * @summary SSM adapter and minimal config provider with in-memory cache.
 *
 * - Implements the shared `SsmPort`
 * - Provides helpers to read string, JSON, boolean, and integer parameters
 * - Retries throttling and 5xx errors with `shouldRetry` and `isAwsRetryable`
 * - Maps AWS errors through `mapAwsError`
 * - Supports optional environment variable fallback using `SSM_FALLBACK_PREFIX`
 * - Per-call cache TTL overrides (`ttlMs`) and decrypt control for SecureString
 */

import {
  SSMClient,
  GetParameterCommand,
  type GetParameterCommandOutput,
} from "@aws-sdk/client-ssm";

import type { SsmPort } from "@lawprotect/shared-ts";
import { mapAwsError } from "@lawprotect/shared-ts";
import { shouldRetry } from "@lawprotect/shared-ts";
import { isAwsRetryable } from "@lawprotect/shared-ts";
import { parseJson } from "@lawprotect/shared-ts";
import { getEnv, getNumber } from "@lawprotect/shared-ts";

/** Lightweight sleep helper for backoff. */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Options for {@link SsmParamConfigProvider}.
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
type CacheEntry = {
  value: string | undefined;
  expiresAt: number;
};

/**
 * AWS SSM-based configuration provider implementing `SsmPort`.
 *
 * Provides cached reads for strings with optional decryption, plus helpers to parse JSON, booleans, and integers.
 * Uses retry policy for transient errors and supports environment fallback when configured.
 */
export class SsmParamConfigProvider implements SsmPort {
  private readonly ssm: SSMClient;
  private readonly maxAttempts: number;
  private readonly defaultTtlMs: number;
  private readonly envPrefix?: string;
  private readonly cache = new Map<string, CacheEntry>();

  /**
   * Creates a new provider.
   *
   * @param client Preconfigured `SSMClient` instance.
   * @param opts   Optional provider settings. Defaults use environment variables when available.
   */
  constructor(client: SSMClient, opts: SsmParamConfigProviderOptions = {}) {
    this.ssm = client;

    this.maxAttempts =
      Math.max(1, opts.maxAttempts ??
        getNumber("SSM_MAX_ATTEMPTS", 3, { min: 1, max: 10 }));

    this.defaultTtlMs =
      Math.max(0, opts.defaultTtlMs ??
        getNumber("SSM_DEFAULT_TTL_MS", 30_000, { min: 0, max: 600_000 }));

    const maybePrefix = opts.envFallbackPrefix ?? getEnv("SSM_FALLBACK_PREFIX");
    this.envPrefix = typeof maybePrefix === "string" && maybePrefix.length > 0 ? maybePrefix : undefined;
  }

  /**
   * Retrieves a plain string parameter.
   *
   * @param name           Parameter name (e.g., `/service/feature/flag`).
   * @param withDecryption Whether to decrypt `SecureString` values. Default: `true`.
   * @returns The parameter value or `undefined` if not found.
   */
  async getParameter(name: string, withDecryption = true): Promise<string | undefined> {
    return this.getString(name, { decrypt: withDecryption });
  }

  /**
   * Reads a parameter as a string with in-memory caching and optional ENV fallback.
   *
   * @param name        Parameter name.
   * @param opts.decrypt Decrypt `SecureString` values. Default: `true`.
   * @param opts.ttlMs   Cache TTL override in milliseconds.
   * @returns The parameter value or `undefined`.
   */
  async getString(
    name: string,
    opts: { decrypt?: boolean; ttlMs?: number } = {}
  ): Promise<string | undefined> {
    const ttl = opts.ttlMs ?? this.defaultTtlMs;
    const now = Date.now();

    const cached = this.cache.get(name);
    if (cached && cached.expiresAt > now) return cached.value;

    const envValue = this.readEnvFallback(name);
    if (envValue !== undefined) {
      if (ttl > 0) this.cache.set(name, { value: envValue, expiresAt: now + ttl });
      return envValue;
    }

    const value = await this.fetchString(name, opts.decrypt !== false);
    if (ttl > 0) this.cache.set(name, { value, expiresAt: now + ttl });
    return value;
  }

  /**
   * Reads a parameter and parses it as JSON.
   *
   * @typeParam T Expected JSON shape.
   * @param name  Parameter name.
   * @param opts  Options for decryption and caching.
   * @returns Parsed value or `undefined`.
   * @throws If the value exists but is not valid JSON.
   */
  async getJson<T = unknown>(
    name: string,
    opts: { decrypt?: boolean; ttlMs?: number } = {}
  ): Promise<T | undefined> {
    const s = await this.getString(name, opts);
    if (s == null) return undefined;
    return parseJson<T>(s);
  }

  /**
   * Reads a parameter and parses it as a boolean.
   *
   * Truthy: `1`, `true`, `yes`, `on`.  
   * Falsy : `0`, `false`, `no`, `off`.
   *
   * @param name Parameter name.
   * @param opts Options for decryption and caching.
   * @returns `true`/`false` or `undefined` if unrecognized.
   */
  async getBool(
    name: string,
    opts: { decrypt?: boolean; ttlMs?: number } = {}
  ): Promise<boolean | undefined> {
    const s = await this.getString(name, opts);
    if (s == null) return undefined;
    const v = s.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(v)) return true;
    if (["0", "false", "no", "off"].includes(v)) return false;
    return undefined;
  }

  /**
   * Reads a parameter and parses it as an integer.
   *
   * @param name Parameter name.
   * @param opts Options for decryption and caching.
   * @returns A finite number or `undefined`.
   */
  async getInt(
    name: string,
    opts: { decrypt?: boolean; ttlMs?: number } = {}
  ): Promise<number | undefined> {
    const s = await this.getString(name, opts);
    if (s == null) return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  }

  /** Fetches the raw string value from SSM with retries and maps provider errors. */
  private async fetchString(name: string, decrypt: boolean): Promise<string | undefined> {
    const ctx = "SsmParamConfigProvider.getParameter";
    let lastErr: unknown;

    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      try {
        const out: GetParameterCommandOutput = await this.ssm.send(
          new GetParameterCommand({ Name: name, WithDecryption: decrypt })
        );
        return out.Parameter?.Value ?? undefined;
      } catch (err) {
        lastErr = err;
        const { retry, delayMs } = shouldRetry(attempt, this.maxAttempts, isAwsRetryable, err);
        if (!retry) throw mapAwsError(err, ctx);
        await sleep(delayMs);
      }
    }
    throw mapAwsError(lastErr, ctx);
  }

  /** Builds an environment variable key from the SSM name if fallback prefix is configured. */
  private readEnvFallback(name: string): string | undefined {
    if (!this.envPrefix) return undefined;
    const normalized = name.replaceAll("/", "_").replace(/__+/g, "_").toUpperCase();
    const key = `${this.envPrefix}_${normalized}`;
    return getEnv(key);
  }
}
