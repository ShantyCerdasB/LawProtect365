# Types — API & Usage Guide

Import from the shared package:

```ts
import {
  // Object storage
  ObjectStoragePort, PutObjectOptions, PresignOptions,

  // API envelopes & list utilities
  ApiSuccess, ApiErrorBody, Sort, Filter,

  // Auth
  UserRole, JwtClaims, JwtVerifyOptions, JwtVerificationResult, Principal, AuthContext,

  // Branding & common primitives
  Brand, UserId, TenantId, CaseId, DocumentId, TemplateId,
  Nullable, JsonPrimitive, JsonArray, JsonObject, JsonValue, ISODateString, Millis, Result,

  // HTTP/CORS
  CorsConfig,

  // Events
  EventName, EventMeta, EventEnvelope,

  // Error mapping options
  MapErrorOptions,

  // Pagination
  Cursor, PaginationParams, PageMeta, CursorPage,

  // Security / authorization
  Resource, Action, Permission, Scope, ResourceRef, SecurityContext, AccessRequest, PolicyDecision,
} from "@lawprotect365/shared";
```

## How this fits in a hexagonal service

* **Domain & Use Cases**: use branded ids (`UserId`, `CaseId`), result unions (`Result<T,E>`), domain events (`EventEnvelope`), and security types (`ResourceRef`, `Action`) when expressing rules.
* **Inbound adapters (HTTP/Queues)**: use `ApiSuccess`, `ApiErrorBody`, `CorsConfig`, `PaginationParams`, `CursorPage` for controllers/handlers.
* **Outbound adapters (S3/KMS/etc.)**: implement `ObjectStoragePort`; use `Permission`/`Scope` and `SecurityContext` when enforcing policies.
* **Cross-cutting**: `JwtClaims`/`AuthContext` in auth middleware; `MapErrorOptions` when rendering errors.

---

## File: `objectStorage.ts`

### `interface PutObjectOptions`

Options for uploads.

* `contentType?: string` – e.g., `application/pdf`.
* `encryptionKeyId?: string` – KMS key if used by the adapter.
* `metadata?: Record<string,string>` – custom object metadata.

### `interface PresignOptions`

Presigned URL creation.

* `method: "GET" | "PUT" | "DELETE"`
* `expiresInSeconds: number`
* `contentType?: string` – required by some PUT flows.

### `interface ObjectStoragePort`

Storage abstraction your adapter implements (e.g., S3).

* `putObject(bucket, key, body, opts?): Promise<void>`
  Upload bytes/string (adapter handles streaming/marshalling).
* `getObject(bucket, key): Promise<Uint8Array>`
  Download whole object as bytes.
* `headObject(bucket, key): Promise<{ size: number; etag?: string; lastModified?: string; metadata?: Record<string,string> }>`
  Lightweight metadata check.
* `deleteObject(bucket, key): Promise<void>`
  Remove object.
* `presign(bucket, key, opts): Promise<string>`
  Generate a browser-usable URL.

**Where to use:** outbound port in infra adapters; inject into use cases that need storage.

---

## File: `api.ts`

### `interface ApiSuccess<T>`

Standard success envelope for HTTP responses.

* `data: T`
* `meta?: Record<string, JsonValue>` – paging, request ids, etc.

### `interface ApiErrorBody`

Error body aligned with the shared error mapper.

* `error: string` – stable code.
* `message: string` – human-readable.
* `requestId?: string` – correlation id.
* `details?: unknown` – safe extra info (validation issues).

### `interface Sort`

List sorting directive.

* `field: string`
* `order: "asc" | "desc"`

### `interface Filter`

Simple filter expression.

* `field: string`
* `op: "eq" | "ne" | "gt" | "lt" | "gte" | "lte" | "in" | "contains"`
* `value: JsonValue`

**Where to use:** HTTP controllers and client SDKs to keep payloads consistent.

---

## File: `auth.ts`

### `type UserRole`

`"client" | "lawyer" | "admin" | "super_admin" | "system"`

### `interface JwtClaims`

Normalized claims after token verification.

* `sub, iss, aud?, exp?, iat?, jti?`
* `email?, emailVerified?`
* `tenantId?, roles?, scopes?`
* `raw: Record<string,unknown>` – original provider payload.

### `interface JwtVerifyOptions`

Verifier inputs.

* `issuer?: string`
* `audience?: string | string[]`
* `jwksUri?: string`
* `clockToleranceSec?: number`

### `interface JwtVerificationResult`

Verifier outputs.

* `header: Record<string, unknown>`
* `payload: Record<string, unknown>`
* `claims: JwtClaims`

### `interface Principal`

Application principal after any directory lookups.

* `userId: UserId`
* `roles: UserRole[]`
* `tenantId?: TenantId`
* `email?: string`

### `interface AuthContext`

Attached to requests by auth middleware.

* `userId: UserId`
* `tenantId?: TenantId`
* `roles: string[]`
* `scopes: string[]`
* `permissions?: string[]`
* `rawClaims: Record<string,unknown>`
* `token?: string`
* `email?: string`

**Where to use:** auth middleware, policy checks, and use cases needing identity/tenant info.

---

## File: `brand.ts`

### `type Brand<T, Tag extends string>`

Nominal typing helper to prevent id mix-ups.

### Branded ids

* `UserId`, `TenantId`, `CaseId`, `DocumentId`, `TemplateId`

**Where to use:** domain entities, repositories, and use cases to avoid accidental cross-assignment of ids.

---

## File: `common.ts`

### Nullable & JSON

* `type Nullable<T> = T | null`
* `JsonPrimitive`, `JsonArray`, `JsonObject`, `JsonValue`

### Time & typed scalars

* `type ISODateString = Brand<string,"ISODateString">`
* `type Millis = Brand<number,"Millis">`

### `type Result<T, E = unknown>`

Discriminated union for success/failure:

* `{ ok: true; value: T } | { ok: false; error: E }`

**Where to use:** domain return types, DTOs, and utilities.

---

## File: `corsConfig.ts`

### `interface CorsConfig`

Cross-origin policy for HTTP adapters.

* `allowOrigins: "*" | string[]`
* `allowMethods?: string[]`
* `allowHeaders?: string[]`
* `exposeHeaders?: string[]`
* `allowCredentials?: boolean`
* `maxAgeSeconds?: number`

**Where to use:** HTTP layer to build CORS headers.

---

## File: `env.d.ts`

Ambient typings for `process.env` to improve DX.

* `ENV`, `PROJECT_NAME`, `SERVICE_NAME`, `AWS_REGION`, `LOG_LEVEL`
* Auth vars `COGNITO_*`, `JWT_*`
* Domain vars like `TEMPLATES_BUCKET`, etc.

**Where to use:** no import needed; TypeScript picks it up globally.

---

## File: `events.ts`

### `type EventName = string`

### `interface EventMeta`

* `id: string` – ulid/uuid
* `traceId?: string`
* `ts: ISODateString`
* `source: string` – service name
* `tenantId?: TenantId`, `actorId?: UserId`
* `tags?: Record<string,string>`

### `interface EventEnvelope<TPayload = unknown>`

* `name: EventName`
* `meta: EventMeta`
* `data: TPayload`

**Where to use:** domain events, integration events, audit logs, message bus payloads.

---

## File: `mapErrorOptions.ts`

### `interface MapErrorOptions`

Controls HTTP error rendering.

* `requestId?: string`
* `exposeDetails?: boolean`
* `headers?: Record<string,string>`

**Where to use:** pass to the shared `mapError` helper in HTTP controllers.

---

## File: `pagination.ts`

### `type Cursor = string`

Opaque pagination token.

### `interface PaginationParams`

Inbound query params.

* `limit: number`
* `cursor?: Cursor`

### `interface PageMeta`

Response metadata.

* `limit: number`
* `nextCursor?: Cursor`
* `total?: number`

### `interface CursorPage<T>`

* `items: T[]`
* `meta: PageMeta`

**Where to use:** list endpoints and repository adapters implementing cursor-based pagination.

---

## File: `security.ts`

### `type Resource`

Canonical resource nouns: `"document" | "case" | "user" | "payment" | "kyc" | "plan" | "subscription" | "report" | "notification"`

### `type Action`

`"read" | "write" | "delete" | "approve" | "manage"`

### `type Permission = Brand<string,"Permission">`

`"resource:action"` string, branded.

### `type Scope = Brand<string,"Scope">`

OAuth-style scope, branded string.

### `interface ResourceRef`

* `resource: Resource`
* `id?: string`
* `tenantId?: TenantId`

### `interface SecurityContext`

* `userId: UserId`
* `tenantId?: TenantId`
* `roles: string[]`
* `scopes?: Scope[]`
* `permissions?: Permission[]`

### `interface AccessRequest`

* `subject: SecurityContext`
* `resource: ResourceRef`
* `action: Action`

### `interface PolicyDecision`

* `effect: "allow" | "deny"`
* `reason?: string`
* `constraints?: Record<string, string | number | boolean>`

**Where to use:** authorization policies and guards in the application layer; adapters supply `SecurityContext` from auth middleware.

---

## Quick patterns

* **Controller success**
  `return { data, meta: { nextCursor } } satisfies ApiSuccess<MyDTO>;`

* **Use case result**
  `return { ok: true, value } as Result<MyEntity>;`

* **Policy check**
  Build `AccessRequest` with `SecurityContext` and `ResourceRef`, then evaluate in your policy engine.

* **Storage adapter**
  Implement `ObjectStoragePort` against S3 (or other) and inject into use cases that need uploads/downloads.
