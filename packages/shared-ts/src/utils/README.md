# `utils` — API & Usage Guide

Import from the shared package:

```ts
import {
  // arrays
  compact, uniq, uniqueBy, chunk, groupBy, partition, sumBy, range,

  // crypto
  sha256Hex, hmacSha256Hex, toBase64Url, randomBase64Url, timingSafeEqual,

  // dates
  nowIso, toIso, fromIso, toMillis, addMs, addMinutes, addDays,
  startOfDayUTC, endOfDayUTC, diffMs, formatDateUTC,

  // ids
  uuid, ulid, randomToken,

  // env
  getEnv, getRequired, getBoolean, getNumber, getEnum, getByPrefix,

  // json
  parseJson, parseJsonSafe, parseBase64Json, stableStringify, deepClone,
  jsonEquals, isJsonObject, stringifyCompact, stableStringifyUnsafe,

  // math
  clamp, roundTo, lerp, randomInt, sum, mean, median,

  // objects
  pick, omit, isPlainObject, deepMerge, getPath, setPath,

  // paths (POSIX)
  toPosix, join as joinPath, normalize, dirname as pathDirname, basename as pathBasename,
  extname, ensureLeadingSlash, stripLeadingSlash, ensureTrailingSlash,
  stripTrailingSlash, isSubpath, split as splitPath,

  // promises
  sleep, withTimeout, retry, settleAll,

  // s3 utils
  parseS3Uri, formatS3Uri, isS3Uri, joinKey, dirname as s3Dirname, basename as s3Basename,
  ensurePrefix, isValidBucketName, isValidKey, toHttpUrl, guessContentType,

  // strings
  isBlank, normalizeWhitespace, trimTo, toTitleCase, slugify, stripControlChars, leftPad,

  // validation
  assert, isNonEmptyString, parseIntStrict, isEmail, isUuidV4,
} from "@lawprotect365/shared/utils";
```

> Hexagonal guidance:
> **Domain/Use Cases** → arrays, math, json, validation, dates, ids, objects.
> **Adapters/Infra** → crypto, env, paths, s3, promises.
> **Interfaces/Controllers** → strings, dates, json, pagination helpers from `types`.
> **Cross-cutting** → promises, json, ids, env.

---

## File: `arrays.ts`

Utility helpers for collections.

* `compact<T>(arr: Array<T | null | undefined>): T[]`
  Remove `null`/`undefined`.

* `uniq<T>(arr: T[]): T[]`
  Unique by strict equality.

* `uniqueBy<T,K>(arr: T[], key: (t: T) => K): T[]`
  Unique by selector.

* `chunk<T>(arr: T[], size: number): T[][]`
  Split into fixed-size chunks.

* `groupBy<T,K extends string|number|symbol>(arr: T[], key: (t: T) => K): Record<K, T[]>`
  Group items by key.

* `partition<T>(arr: T[], pred: (t: T) => boolean): [T[], T[]]`
  Split into `[pass, fail]`.

* `sumBy<T>(arr: T[], fn: (t: T) => number): number`
  Sum projection.

* `range(start: number, end: number): number[]`
  Build `[start..end)`.

**Use:** domain transforms, report aggregation, pagination pre/post processing.

---

## File: `crypto.ts`

Node-only cryptographic helpers.

* `sha256Hex(data: string|Buffer): string`
  SHA-256 hex.

* `hmacSha256Hex(key: string|Buffer, data: string|Buffer): string`
  HMAC-SHA256 hex.

* `toBase64Url(buf: Buffer): string`
  Base64url encode (uses native encoding if available).

* `randomBase64Url(bytes = 32): string`
  Cryptographically strong random token (base64url).

* `timingSafeEqual(a: string, b: string): boolean`
  Constant-time compare; returns `false` if length differs.

**Use:** signing webhooks, CSRF tokens, idempotency keys.

---

## File: `dates.ts`

Timezone-agnostic date/time helpers.

* `nowIso(): string`
  Current ISO timestamp.

* `toIso(value: Date|number): string`
  Date/millis → ISO.

* `fromIso(iso?: string|null): Date|undefined`
  ISO → `Date` (safe).

* `toMillis(d: Date): number`
  Date → epoch ms.

* `addMs(d: Date, ms: number): Date`
  Offset by ms.

* `addMinutes(d: Date, minutes: number): Date`

* `addDays(d: Date, days: number): Date`

* `startOfDayUTC(d: Date): Date` / `endOfDayUTC(d: Date): Date`
  UTC day bounds.

* `diffMs(a: Date, b: Date): number`
  Millisecond difference.

* `formatDateUTC(d: Date): string`
  `YYYY-MM-DD` in UTC.

**Use:** TTL math, report bucketing, audit stamps.

---

## File: `ids.ts`

Identifier generation.

* `uuid(): string`
  RFC 4122 v4.

* `ulid(): string`
  Lexicographically sortable ULID.

* `randomToken(bytes = 32): string`
  Base64url random token.

**Use:** id generation, correlation ids, short-lived tokens.

---

## File: `env.ts`

Environment variable helpers.

* `getEnv(key: string): string|undefined`
  Raw read.

* `getRequired(key: string): string`
  Throw if missing.

* `getBoolean(key: string, def?: boolean): boolean`
  Truthy forms: `1|true|yes|on`.

* `getNumber(key: string, def?: number, clamp?: {min?:number; max?:number}): number`
  Parse & clamp.

* `getEnum<T extends string>(key: string, allowed: readonly T[], def?: T): T`
  Enforce membership.

* `getByPrefix(prefix: string): Record<string,string>`
  Collect vars with prefix (prefix stripped).

**Use:** adapter wiring, feature flags, configuration boot.

---

## File: `json.ts`

Deterministic JSON utilities.

* `parseJson<T>(text: string, reviver?): T`
  Throws with clean message.

* `parseJsonSafe<T>(text: string, reviver?): { ok: true; value: T } | { ok: false; error: Error }`

* `parseBase64Json<T>(b64: string): T`

* `stableStringify(value: JsonValue, space?: number): string`
  Sorted keys, cycle check.

* `deepClone<T extends JsonValue>(value: T): T`
  `structuredClone` or JSON round-trip.

* `jsonEquals(a: JsonValue, b: JsonValue): boolean`
  Via `stableStringify`.

* `isJsonObject(v: unknown): v is Record<string, JsonValue>`

* `stringifyCompact(value: JsonValue): string`

* `stableStringifyUnsafe(input: unknown): string`
  Convenience wrapper.

**Use:** cache keys, signatures, deep comparisons, logging.

---

## File: `math.ts`

Small numeric helpers.

* `clamp(n: number, min: number, max: number): number`
* `roundTo(n: number, decimals = 0): number`
* `lerp(a: number, b: number, t: number): number`
* `randomInt(min: number, max: number): number`
  Secure RNG, inclusive bounds.
* `sum(arr: number[]): number`
* `mean(arr: number[]): number`
* `median(arr: number[]): number`

**Use:** quotas, backoff, sampling, simple stats.

---

## File: `objects.ts`

Object manipulation helpers.

* `pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>`
* `omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>`
* `isPlainObject(v: unknown): v is Record<string, unknown>`
* `deepMerge<T>(a: T, b: Partial<T>): T`
  Object/object deep merge; arrays replace.
* `getPath(obj: unknown, path: string): unknown`
  Dot-path get.
* `setPath(obj: any, path: string, value: unknown): any`
  Dot-path set (mutates).

**Use:** DTO shaping, config overlays, safe access.

---

## File: `paths.ts` (POSIX)

Filesystem/key-like path helpers using POSIX semantics.

* `toPosix(input: string): string`
* `join(...parts: Array<string|undefined|null>): string`
* `normalize(input: string): string`
* `dirname(input: string): string`
* `basename(input: string): string`
* `extname(input: string): string`
* `ensureLeadingSlash(input: string): string`
* `stripLeadingSlash(input: string): string`
* `ensureTrailingSlash(input: string): string`
* `stripTrailingSlash(input: string): string`
* `isSubpath(parent: string, child: string): boolean`
* `split(input: string): string[]`

**Use:** building safe keys/routes, multi-platform paths in adapters.

> Note: `dirname`/`basename` also exist in `s3.ts`. Alias on import if you need both:
> `import { dirname as pathDirname } from "@shared/utils/paths";`

---

## File: `promises.ts`

Async flow helpers.

* `sleep(ms: number): Promise<void>`
* `withTimeout<T>(p: Promise<T>, ms: number, message = "Timeout"): Promise<T>`
  Races promise with timeout; preserves inner rejection.
* `retry<T>(fn: (attempt: number) => Promise<T>, opts?: { retries?: number; minDelayMs?: number; maxDelayMs?: number; factor?: number; shouldRetry?: (e: unknown) => boolean; }): Promise<T>`
  Exponential backoff.
* `settleAll<T>(promises: Promise<T>[]): Promise<Array<{ ok: true; value: T } | { ok: false; error: unknown }>>`

**Use:** robust I/O calls, flaky provider handling.

---

## File: `s3.ts`

Pure helpers for S3 URIs/keys/URLs (SDK-agnostic).

* `parseS3Uri(uri: string): { bucket: string; key: string }`
* `formatS3Uri(bucket: string, key: string): string`
* `isS3Uri(uri: string): boolean`
* `joinKey(...parts: Array<string|undefined|null>): string`
* `dirname(key: string): string`
  (S3 key dirname)
* `basename(key: string): string`
  (S3 key basename)
* `ensurePrefix(key: string, prefix: string): string`
* `isValidBucketName(name: string): boolean`
  Common AWS constraints.
* `isValidKey(key: string): boolean`
  Length & control-char checks.
* `toHttpUrl(bucket: string, key: string, region: string, opts?: { virtualHosted?: boolean; dualstack?: boolean; accelerate?: boolean }): string`
* `guessContentType(filename: string): string | undefined`

**Use:** building presign inputs, public URLs, validating bucket/key inputs in adapters.

---

## File: `strings.ts`

String normalization and formatting.

* `isBlank(s?: string|null): boolean`
* `normalizeWhitespace(s: string): string`
* `trimTo(s: string, max: number, suffix = "…"): string`
* `toTitleCase(s: string): string`
* `slugify(s: string): string`
  URL-safe slug (NFKD normalize, strip marks).
* `stripControlChars(s: string): string`
* `leftPad(s: string, len: number, ch = " "): string`

**Use:** slugs, display text, filenames.

---

## File: `validation.ts`

Lightweight assertions and guards.

* `assert(cond: unknown, msg = "Assertion failed"): asserts cond`
* `isNonEmptyString(v: unknown): v is string`
* `parseIntStrict(s: string): number`
  Only safe integers; rejects floats/overflow.
* `isEmail(s: string): boolean`
  Simple structural check (1 `@`, labels, dots).
* `isUuidV4(s: string): boolean`

**Use:** input checks in controllers/use cases without pulling heavy validators.

---

## Patterns

**With retry + timeout**

```ts
import { retry, withTimeout } from "@shared/utils";

const call = () => withTimeout(doNetworkThing(), 3000, "upstream timeout");
const data = await retry(() => call(), {
  retries: 3,
  minDelayMs: 100,
  maxDelayMs: 1000,
  shouldRetry: (e) => String(e).includes("timeout"),
});
```

**Stable cache key**

```ts
import { stableStringify } from "@shared/utils";

const key = `user:${userId}:q=${stableStringify(filters)}`;
```

**S3 public URL**

```ts
import { toHttpUrl } from "@shared/utils";

const url = toHttpUrl(bucket, key, process.env.AWS_REGION!, { virtualHosted: true });
```

**Safe env boot**

```ts
import { getRequired, getBoolean, getNumber } from "@shared/utils";

const DATABASE_URL = getRequired("DATABASE_URL");
const DEBUG_SQL = getBoolean("DEBUG_SQL", false);
const TIMEOUT_MS = getNumber("TIMEOUT_MS", 5000, { min: 100, max: 60000 });
```
