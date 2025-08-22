````md
# Shared **Cache** & **Config** — API Reference (Hexagonal-Friendly)

This reference explains **what each function/interface is for, its parameters, and its return type**, so you can use them across microservices without reading the source.

Use via:
```ts
// Cache & locks
import { CachePort, LockPort } from "@lawprotect365/shared-ts";

// App configuration, CORS, flags, rate limits, secrets
import {
  buildAppConfig,
  corsFromConfig,
  buildDefaultCors,
  loadFeatureFlags,
  defaultRateLimit,
  EnvSecretProvider,
  type SecretProvider,
  type AppConfig,
  type Environment,
  type LogLevel,
} from "@lawprotect365/shared-ts";
````

---

## Where these fit in a hexagonal service

* **Controllers/Handlers:** never read `process.env` directly; rely on `AppConfig` that is constructed at boot.
* **Use Cases:** depend on *ports* (`CachePort`, `LockPort`, `SecretProvider`) passed in by the infra/container; do not import SDKs.
* **Adapters/Infra:** implement the ports (e.g., Redis cache/lock, AWS Secrets Manager provider), construct `AppConfig`, and wire dependencies.

---

## 📦 Cache Module

### `interface CachePort`

Cache abstraction with basic and batch operations.

* **get\<T = unknown>(key: string): Promise\<T | null>**
  **Purpose:** Retrieve a value by key.
  **Params:**

  * `key`: Cache key.
    **Returns:**
  * `T` when present, or `null` when missing.
    **Notes:**
  * Serialization/deserialization is adapter-specific (JSON/string/binary).

* **set\<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise\<void>**
  **Purpose:** Store a value with optional TTL.
  **Params:**

  * `key`: Cache key.
  * `value`: Value to store.
  * `ttlSeconds` (optional): Time-to-live in seconds.
    **Returns:** `void`.
    **Notes:**
  * If `ttlSeconds` is omitted, adapter default TTL applies (or no TTL).

* **del(key: string): Promise\<void>**
  **Purpose:** Delete a cached entry.
  **Params:**

  * `key`: Cache key.
    **Returns:** `void`.

* **mget\<T = unknown>(keys: string\[]): Promise\<Array\<T | null>>**
  **Purpose:** Batch get multiple keys efficiently.
  **Params:**

  * `keys`: List of cache keys.
    **Returns:**
  * Array aligned with input order. Each item is `T` or `null`.

* **mset\<T = unknown>(entries: Array<{ key: string; value: T; ttlSeconds?: number }>): Promise\<void>**
  **Purpose:** Batch set multiple entries.
  **Params:**

  * `entries`: Array of `{ key, value, ttlSeconds? }`.
    **Returns:** `void`.

**Recommended usage patterns**

* Cache read-mostly lookups (e.g., tenant config, envelope summaries).
* Avoid caching secrets or PII unless encrypted at rest and in transit.
* Use `mget/mset` for hot paths to reduce RTT.

---

### `interface LockPort`

Distributed lock abstraction for coarse-grained mutual exclusion.

* **acquire(key: string, ttlMs: number, owner?: string): Promise\<boolean>**
  **Purpose:** Try to acquire a lock.
  **Params:**

  * `key`: Lock identifier (e.g., `"env:{id}:complete"`).
  * `ttlMs`: Lock TTL in milliseconds (auto-expire if not renewed).
  * `owner` (optional): Unique owner ID to support re-entrancy/renew/release validation.
    **Returns:** `true` if acquired, otherwise `false`.
    **Notes:**
  * Choose `ttlMs` > max critical section time to avoid premature expiry.

* **release(key: string, owner?: string): Promise\<void>**
  **Purpose:** Release a lock if owned.
  **Params:**

  * `key`: Lock identifier.
  * `owner` (optional): If provided, adapters should only release when owner matches.
    **Returns:** `void`.

* **renew?(key: string, ttlMs: number, owner?: string): Promise\<void>**
  **Purpose:** Extend a lock’s TTL.
  **Params:**

  * `key`: Lock identifier.
  * `ttlMs`: New TTL duration.
  * `owner` (optional): Ownership check if supported.
    **Returns:** `void`.
    **Notes:**
  * Optional method; check for availability in your adapter.

**Recommended usage patterns**

* Protect idempotent/sensitive flows (e.g., sending envelopes, completing signatures).
* Include `tenantId` in the lock key to avoid cross-tenant contention.

---

## ⚙️ Config Module

### `buildAppConfig(overrides?: Partial<AppConfig>): AppConfig`

Constructs the strongly-typed application configuration from environment variables and safe defaults.

* **Purpose:** Centralize all service configuration (env, logging, JWT, CORS, flags, rate limits).
* **Params:**

  * `overrides` (optional): Partial overrides (useful for tests or local runs).
* **Returns:**

  * `AppConfig` (see type below).
* **Environment variables consumed (typical):**

  * `PROJECT_NAME` *(string, required)*
  * `SERVICE_NAME` *(string, required)*
  * `AWS_REGION` *(string, required)*
  * `ENV` *("dev" | "staging" | "prod", default: "dev")*
  * `LOG_LEVEL` *("debug" | "info" | "warn" | "error", default: "info")*
  * `JWT_ISSUER` *(string, optional)*
  * `JWT_AUDIENCE` *(string, optional)*
  * `CORS_ALLOWED_ORIGINS` *(","-separated list or "*", default: "*")*
  * Feature flags via `FF_*` (see `loadFeatureFlags`)
* **Notes:**

  * Derives `isDev`, `isStaging`, `isProd`.
  * Merges `defaultRateLimit(env)` and computed CORS allowed origins.
  * `overrides` are shallow-merged **last**.

**Example**

```ts
const cfg = buildAppConfig();
console.log(cfg.env, cfg.isProd, cfg.rateLimit?.limitPerMinute);
```

---

### `corsFromConfig(cfg: Pick<AppConfig, "corsAllowedOrigins">): CorsConfig`

Adapts `AppConfig` into a `CorsConfig` object for HTTP middleware.

* **Purpose:** Get a ready-to-use CORS policy from your app config.
* **Params:**

  * `cfg`: Object with `corsAllowedOrigins` field.
* **Returns:**

  * `CorsConfig` (see structure below).
* **Notes:**

  * If `corsAllowedOrigins` is missing, defaults to `"*"`.

**Example**

```ts
const cors = corsFromConfig(cfg);
```

---

### `buildDefaultCors(origins: string[] | "*" = "*", allowCredentials = false): CorsConfig`

Creates a CORS configuration with sensible defaults.

* **Purpose:** Build a CORS policy quickly (methods/headers are pre-filled).
* **Params:**

  * `origins`: Array of allowed origins or `"*"`.
  * `allowCredentials`: Whether to send `Access-Control-Allow-Credentials: true`.
* **Returns:**

  * `CorsConfig` with fields:

    * `allowOrigins: string[] | "*"`
    * `allowMethods: string[]` *(default: `["GET","POST","PUT","DELETE","OPTIONS"]`)*
    * `allowHeaders: string[]` *(default includes `content-type`, `authorization`, etc.)*
    * `exposeHeaders: string[]` *(default includes `x-request-id`, `x-next-cursor`)*
    * `allowCredentials?: boolean`
    * `maxAgeSeconds?: number` *(default `600`)*

**Example**

```ts
const cors = buildDefaultCors(["https://app.example.com"], true);
```

---

### `loadFeatureFlags(prefix = "FF_"): Record<string, boolean>`

Loads boolean feature flags from environment variables with a prefix.

* **Purpose:** Toggle features without redeploying.
* **Params:**

  * `prefix`: Env prefix (default `"FF_"`).
* **Returns:**

  * Map of `{ [flagName]: boolean }` where truthy values are one of `"1" | "true" | "yes" | "on"` (case-insensitive).
* **Example env:** `FF_ENABLE_METRICS=1` → `{ ENABLE_METRICS: true }`

**Example**

```ts
const flags = loadFeatureFlags(); // { ENABLE_METRICS: true, ... }
if (flags.EXPERIMENTAL_FLOW) { /* ... */ }
```

---

### `defaultRateLimit(envName: string): RateLimitConfig`

Provides safe rate limit defaults per environment.

* **Purpose:** Consistent, environment-aware rate limiting.
* **Params:**

  * `envName`: Typically `cfg.env` (`"dev" | "staging" | "prod"`).
* **Returns:**

  * `RateLimitConfig`:

    * `limitPerMinute: number` *(prod: 900; non-prod: 1800)*
    * `burst: number` *(prod: 200; non-prod: 400)*
    * `emitHeaders: boolean` *(always `true`)*

**Example**

```ts
const rl = defaultRateLimit(cfg.env);
```

---

### `interface SecretProvider`

Abstraction for retrieving secrets without binding to a source (env, SSM, Secrets Manager).

* **Method:**

  * `getSecret(id: string): Promise<string | undefined>`
    **Purpose:** Retrieve secret value by identifier.
    **Params:** `id` – logical secret name (e.g., `"DOCUSIGN_API_KEY"`).
    **Returns:** Secret string or `undefined`.
    **Notes:** Implementations may cache values.

---

### `class EnvSecretProvider implements SecretProvider`

Environment-based implementation of `SecretProvider`.

* **constructor(prefix = "")**
  **Purpose:** Optional prefix to apply when reading env keys (e.g., `"SIG_"`).
  **Params:** `prefix` – string to prepend to keys.
* **getSecret(id: string): Promise\<string | undefined>**
  **Purpose:** Resolve `process.env[prefix + id]`.
  **Returns:** Secret string or `undefined`.

**Example**

```ts
const secrets: SecretProvider = new EnvSecretProvider("SIG_");
const apiKey = await secrets.getSecret("DOCUSIGN_API_KEY");
```

---

## 📑 Types

### `type Environment = "dev" | "staging" | "prod"`

Environment discriminator.

### `type LogLevel = "debug" | "info" | "warn" | "error"`

Logging verbosity.

### `interface AppConfig`

Aggregated, typed configuration:

* **Identity:**

  * `projectName: string` — e.g., `"lawprotect365"`.
  * `serviceName: string` — e.g., `"signature-service"`.
  * `region: string` — deployment region (e.g., `"us-east-1"`).

* **Runtime:**

  * `env: Environment` — `"dev" | "staging" | "prod"`.
  * `logLevel: LogLevel` — default `"info"`.

* **Auth (optional):**

  * `jwtIssuer?: string`
  * `jwtAudience?: string`

* **Derived flags:**

  * `isDev: boolean`
  * `isStaging: boolean`
  * `isProd: boolean`

* **CORS:**

  * `corsAllowedOrigins?: string[] | "*"` — source for `corsFromConfig`.

* **Feature flags:**

  * `flags: Record<string, boolean>`

* **Rate limiting (optional):**

  * `rateLimit?: { limitPerMinute: number; burst: number; emitHeaders: boolean }`

---

## 🔧 Wiring Examples

### Build config once (infra/container)

```ts
// services/signature-service/src/infra/config.ts
import { buildAppConfig, EnvSecretProvider } from "@lawprotect365/shared/config";

export const cfg = buildAppConfig();
export const secrets = new EnvSecretProvider("SIG_");
```

### CORS middleware

```ts
// services/signature-service/src/middleware/http.ts
import { corsFromConfig } from "@lawprotect365/shared/config";
import { cfg } from "../infra/config";

const cors = corsFromConfig(cfg);
// pass `cors` to your API handler wrapper
```

### Use case with cache & lock ports

```ts
import type { CachePort, LockPort } from "@lawprotect365/shared/cache";

export async function sendEnvelope(
  cache: CachePort,
  lock: LockPort,
  envId: string,
  payload: unknown
) {
  const key = `env:${envId}:sending`;

  const ok = await lock.acquire(key, 10_000, envId);
  if (!ok) throw new Error("Busy");

  try {
    await cache.set(`env:${envId}:draft`, payload, 300);
    // … do work …
  } finally {
    await lock.release(key, envId);
  }
}
```

---

## ✅ Best Practices

* Construct **one** `AppConfig` per process and pass it where needed; never read `process.env` outside config.
* Inject **ports** (`CachePort`, `LockPort`, `SecretProvider`) into use cases; implement them in adapters.
* Set TTLs conservatively to avoid stale data; for locks, TTL must outlive the longest critical path.
* Prefer batch operations (`mget/mset`) for hot paths to reduce round-trips.
* Keep CORS origins strict in production; avoid `"*"` with credentials.

---

```
```
