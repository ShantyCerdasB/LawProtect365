# `validation` — API & Usage Guide

Import from the shared package:

```ts
// Use the shared zod export with the custom error map:
import { z } from "@lawprotect365/shared/validation/z";

// Function-level helpers & schemas:
import {
  // http
  validatePath, validateQuery, validateJsonBody,

  // request composition
  validateRequest,

  // schemas
  NonEmptyStringSchema, SafeStringSchema, ISODateStringSchema, EmailStringSchema,
  PositiveIntSchema, JsonUnknownSchema, JsonObjectSchema,

  // preprocessors
  TrimmedString, NormalizedEmail, CollapsedWhitespace,

  // identifiers
  UuidV4, Ulid, OpaqueId, S3Uri,

  // pagination
  paginationQuerySchema, parsePaginationQuery,

  // env
  Env, loadEnv,
} from "@lawprotect365/shared/validation";
```

## Hexagonal usage map

* **Controllers / HTTP Adapters**

  * `validatePath`, `validateQuery`, `validateJsonBody`, `validateRequest`
  * `parsePaginationQuery`, `paginationQuerySchema`
  * `UuidV4`, `Ulid`, `S3Uri` for quick guards
* **Domain / Use Cases**

  * Reusable schemas from `schemas.ts` (e.g., `NonEmptyStringSchema`, `ISODateStringSchema`)
  * Identifier schemas from `identifiers.ts`
  * Preprocessors from `preprocessors.ts` to normalize inputs before domain logic
* **Bootstrap / Composition Root**

  * `Env`, `loadEnv` to validate `process.env`
* **Shared Validation**

  * Import `z` from `validation/z` for consistent error messages

---

## File: `schemas.ts` — common primitives

* `NonEmptyStringSchema: z.ZodString`
  **Purpose:** Require non-empty strings.
  **Validates:** `min(1)`.
  **Returns:** string.

* `SafeStringSchema: z.ZodString`
  **Purpose:** Disallow ASCII control chars (U+0000–U+001F, U+007F).
  **Returns:** string.
  **Error:** `"Control characters not allowed"`.

* `ISODateStringSchema: z.ZodString`
  **Purpose:** ISO-8601 datetime (via `Date.parse`).
  **Returns:** string.

* `EmailStringSchema: z.ZodString`
  **Purpose:** RFC5322-ish email (`z.string().email()`).
  **Returns:** string.

* `PositiveIntSchema: z.ZodNumber`
  **Purpose:** Positive safe integer.
  **Returns:** number.

* `JsonUnknownSchema: z.ZodType<unknown>`
  **Purpose:** Arbitrary JSON-compatible value (`z.any()`).
  **Returns:** unknown.

* `JsonObjectSchema: z.ZodRecord`
  **Purpose:** JSON record; defaults to `{}`.
  **Returns:** `Record<string, unknown>`.

**Typical use (domain DTO):**

```ts
const CreateCase = z.object({
  title: NonEmptyStringSchema,
  openedAt: ISODateStringSchema,
  contactEmail: EmailStringSchema.optional(),
});
```

---

## File: `env.ts` — environment validation

* `Env: z.ZodObject`
  **Fields:**
  `ENV: "dev"|"staging"|"prod" (default "dev")`,
  `PROJECT_NAME: string`, `SERVICE_NAME: string`, `AWS_REGION: string`,
  `LOG_LEVEL: "debug"|"info"|"warn"|"error" (default "info")`,
  `JWT_ISSUER?: string(url)`, `JWT_AUDIENCE?: string`.

* `loadEnv<T>(schema: z.ZodType<T>): T`
  **Params:** `schema` (Zod object describing `process.env`).
  **Returns:** typed config `T`.
  **Throws:** `AppError(500, COMMON_INTERNAL_ERROR)` with `issues` on failure.

**Typical use (bootstrap):**

```ts
const cfg = loadEnv(Env);
```

---

## File: `http.ts` — HTTP-specific validators

* `validatePath<S extends z.ZodTypeAny>(evt: ApiEvent, schema: S): z.infer<S>`
  **Validates:** `evt.pathParameters`.
  **Throws:** `AppError(400, COMMON_BAD_REQUEST)` with issues.

* `validateQuery<S extends z.ZodTypeAny>(evt: ApiEvent, schema: S): z.infer<S>`
  **Validates:** `evt.queryStringParameters`.
  **Throws:** `AppError(400, COMMON_BAD_REQUEST)` with issues.

* `validateJsonBody<S extends z.ZodTypeAny>(evt: ApiEvent, schema: S): z.infer<S>`
  **Validates:** JSON body; supports base64-encoded requests.
  **Throws:**
  `AppError(400, COMMON_BAD_REQUEST)` on empty/invalid encoding/invalid JSON,
  `AppError(422, COMMON_UNPROCESSABLE_ENTITY)` on schema errors.

**Typical use (controller):**

```ts
const Query = z.object({ limit: z.string().optional() });
const Body  = z.object({ title: NonEmptyStringSchema });

const params = validateQuery(evt, Query);
const body   = validateJsonBody(evt, Body);
```

---

## File: `identifiers.ts` — id validators

* `UuidV4: z.ZodString`
  **Purpose:** RFC4122 v4 UUID (`.uuid()`).

* `Ulid: z.ZodString`
  **Purpose:** ULID format (`/^[0-9A-HJKMNP-TV-Z]{26}$/i`).

* `OpaqueId: z.ZodString`
  **Purpose:** Any non-empty opaque id.

* `S3Uri: z.ZodString`
  **Purpose:** Must start with `s3://` and have bucket/key.

**Use:** guard route params / payload ids before calling use cases.

---

## File: `pagination.ts` — pagination helpers

* `paginationQuerySchema(maxDefault = 100): z.ZodObject`
  **Query shape:**
  `limit: string|number → number` (`int`, `>0`, `<= maxDefault`, default `min(50, maxDefault)`),
  `cursor?: string`.

* `parsePaginationQuery(evt: ApiEvent, maxDefault = 100): PaginationParams`
  **Returns:** `{ limit, cursor? }`.
  **Behavior:** on validation failure, returns `{ limit: min(50, maxDefault) }`.

**Typical use (controller):**

```ts
const page = parsePaginationQuery(evt, 200); // { limit, cursor? }
```

---

## File: `preprocessors.ts` — normalization pipelines

* `TrimmedString: z.ZodEffects<string, string>`
  **Preprocess:** trim; **Validate:** `min(1)`.

* `NormalizedEmail: z.ZodEffects<string, string>`
  **Preprocess:** trim + lowercase; **Validate:** email.

* `CollapsedWhitespace: z.ZodEffects<string, string>`
  **Transform:** collapse inner whitespace, then trim.

**Use:** compose into schemas to normalize input before domain logic.

---

## File: `request.ts` — composed request validator

* `interface RequestSchemas<SP, SQ, SB>`
  `path?: SP`, `query?: SQ`, `body?: SB` (each optional; any Zod type).

* `validateRequest<SP, SQ, SB>(evt: ApiEvent, schemas: RequestSchemas<SP, SQ, SB>): { path: Infer<SP>|{}, query: Infer<SQ>|{}, body: Infer<SB>|undefined }`
  **Behavior:**

  * Runs `validatePath`, `validateQuery`, `validateJsonBody` when provided.
  * Omits not-provided parts (`path`/`query` default to `{}`, `body` to `undefined`).
    **Throws:** same as individual validators.

**Typical use (controller):**

```ts
const Path  = z.object({ caseId: UuidV4 });
const Query = paginationQuerySchema(200);
const Body  = z.object({ title: TrimmedString });

const { path, query, body } = validateRequest(evt, { path: Path, query: Query, body: Body });
```

---

## File: `z.ts` — shared `z` export with custom error map

* Sets a global Zod error map to standardize messages (invalid type, too small/big, uuid/email, etc.).
* **Export:** `export { z }` — **always import Zod from here** to keep error messages consistent across services.

**Typical use:**

```ts
import { z } from "@lawprotect365/shared/validation/z";
```

---

## Patterns

**Controller guard (single call)**

```ts
const { path, query, body } = validateRequest(evt, {
  path: z.object({ id: UuidV4 }),
  query: paginationQuerySchema(100),
  body: z.object({ email: NormalizedEmail }).optional(), // make body optional at schema level if needed
});
```

**Use case input schema (domain)**

```ts
const CreateCaseInput = z.object({
  title: TrimmedString,
  openedAt: ISODateStringSchema,
});
type CreateCaseInput = z.infer<typeof CreateCaseInput>;
```

**Environment boot**

```ts
const env = loadEnv(Env);
```
