# `@lawprotect/shared-ts`

Shared TypeScript toolkit for the lawprotect365 microservices: HTTP handlers, authentication, errors, validation, observability, hexagonal contracts, DB/Prisma helpers, events/outbox, AWS ports, and general utilities.

> Consume only what you need per service. Everything is designed to be framework-agnostic and serverless-friendly (API Gateway + Lambda).

## Install & Build

```bash
# from repo root (uses workspaces)
npm install
# build shared lib
npm --workspace @lawprotect/shared-ts run build
```

Type-safe imports:

```ts
import { apiHandler, ok } from "@lawprotect/shared-ts/http";
import { authenticate, guard } from "@lawprotect/shared-ts/auth";
import { AppError, NotFound } from "@lawprotect/shared-ts/errors";
```

---

## Typical flow (Controller → UseCase → Repository)

```
API Gateway → (http/apiHandler + auth/middleware) → Controller
→ UseCase (domain) → Repository (implements ports from contracts/db)
→ Adapters (AWS, storage, cache, messaging) implemented in each microservice
```

* **Controller** validates input, applies auth guards/policies, calls the use-case, maps to HTTP response.
* **Use-case** holds business logic; returns DTO or Result/AppError.
* **Repository** persists domain models via ports; microservice adapters implement concrete clients (Prisma/S3/SQS/etc).

---

## Module by module (file-by-file)

### `src/app/` — Application primitives

* **AppContext.ts** — Defines an application context object (logger, metrics, config, ports) to pass dependencies down the stack.
* **Maybe.ts** — Utility type for optional results (Some/None semantics) to avoid `undefined` proliferation.
* **Result.ts** — Discriminated union for success/failure (`Result<Ok, Err>`), useful to model business errors without throwing.

**Use when:** you want typed dependency injection and functional result patterns in use-cases.

---

### `src/auth/` — Authentication & authorization

* **access.ts** — `can(subject, action, resource)`: default authorization decision combining role hierarchy, tenant boundary, and fine-grained permissions/scopes.
* **claims.ts** — Helpers to map raw JWT claims to a `Principal` (userId, roles, tenantId, email).
* **guard.ts** — Guards for controllers: `requireRole`, `requireScope`, `requirePermission` with precise error codes/status.
* **index.ts** — Barrel re-export.
* **jwtVerifier.ts** — Verifies JWTs (Cognito/OIDC) and exposes a simple interface for retrieving keys and validating tokens.
* **middleware.ts** — `authenticate(event)`: extracts bearer token, verifies JWT, builds `AuthContext` (claims, principal, scopes).
* **policy.ts** — Optional policy object model (RBAC/ABAC) if you prefer composing rules as objects instead of ad-hoc checks.
* **roles.ts** — Role helpers: role sets, hierarchy comparison (`hasRole`, `atLeast`).
* **scopes.ts** — OAuth scopes parsing and checks (normalize scope strings, `hasScope`).

**Import examples**

```ts
import { authenticate, guard, can } from "@lawprotect/shared-ts/auth";
```

---

### `src/aws/` — AWS ports and helpers (adapters live in each service)

* **arn.ts** — Parse/build AWS ARNs safely.
* **errors.ts** — Map/classify common AWS SDK failures (throttling, validation, access denied) for retries and error responses.
* **index.ts** — Barrel re-export.
* **partition.ts** — Utilities for AWS partitions (aws, awsgov, awscn).
* **ports.ts** — Interfaces for AWS-backed ports (KMS, Secrets Manager, SSM, S3 presigners).
* **region.ts** — Region normalization/validation helpers.
* **retry.ts** — Retry policies (exponential backoff with jitter) tuned for AWS limits.
* **s3Presign.ts** — Pure presign helpers (GET/PUT) decoupled from S3 client specifics.

**Use when:** creating adapters in a microservice that speak to AWS while depending on interfaces (ports) from here.

---

### `src/cache/` — Cache ports

* **ports.ts** — `CachePort` contract (get/set/ttl/incr) to abstract Redis/Memcached/etc.

---

### `src/config/` — Configuration & secrets

* **app.ts** — Service/app config loader (service name, environment, version, toggles).
* **cors.ts** — Centralized CORS config builder (origins, methods, headers).
* **flags.ts** — Simple feature flags/kill switches.
* **index.ts** — Barrel re-export.
* **rateLimit.ts** — Rate limit contracts and helpers (in-mem or external implementations).
* **secrets.ts** — Composition of secret resolution (environment → SSM/Secrets Manager).
* **types.ts** — Strongly typed configuration interfaces for the above.

**Use when:** bootstrapping a service and reading its environment and runtime secrets in a uniform way.

---

### `src/contracts/` — Hexagonal architecture contracts

* **Controller.ts** — Controller signature and minimal abstractions to keep HTTP plumbing out of use-cases.
* **Idempotency.ts** — Contracts for idempotent operations (keys, locks, stores).
* **Mapper.ts** — DTO ↔ domain mapping contracts to keep transformations explicit.
* **QuerySpec.ts** — Domain query specifications (filters/order/pagination) that repositories interpret.
* **Repository.ts** — Repository base contracts (CRUD/find/paginate), agnostic of persistence engine.
* **UnitOfWork.ts** — Transaction boundary contract (begin/commit/rollback).
* **UseCase.ts** — Use-case contract (`execute(input, ctx)` returning `Result`/`AppError`).
* **index.ts** — Barrel re-export.

**Use when:** defining domain boundaries and replacing persistence/messaging without touching business logic.

---

### `src/db/` — DB helpers & Prisma wiring

* **cursor.ts** — Base64url(JSON) opaque cursor encoder/decoder (do not include sensitive data).
* **index.ts** — Barrel re-export.
* **pagination.ts** — Domain pagination helpers (limit/cursor) plus types.
* **ports.ts** — Persistence ports (e.g., transactional context, repository facades).
* **prismaClient.ts** — PrismaClient singleton configured for serverless cold/warm starts.
* **prismaTx.ts** — Unit of Work helpers on top of Prisma (transaction function wrappers).
* **repositoryBase.ts** — Optional base class for Prisma repositories (toDomain/toPrisma, whereFromSpec, paginate).

**Use when:** a microservice relies on Prisma/SQL and you want consistent pagination and transaction handling.

---

### `src/errors/` — Error model and mapping

* **AppError.ts** — Base class for operational errors with stable `code`, `statusCode`, `message`, `details`, `cause`.
* **classify.ts** — Utilities to classify errors (retryable/client/server/operational) for metrics and retry decisions.
* **codes.ts** — Shared error code catalog (e.g., `AUTH_UNAUTHORIZED`, `COMMON_NOT_FOUND`, domain codes).
* **errors.ts** — Ready-to-use HTTP error subclasses (`BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`, `TooManyRequests`, `UnprocessableEntity`, `UnsupportedMediaType`, `NotImplemented`, etc.).
* **mapError.ts** — Converts any thrown error into a consistent API Gateway response (handles Zod 422, JSON parse 400, AWS throttling 429, etc.).

**Use when:** throwing errors from use-cases/repos and you want consistent HTTP mapping by `http/apiHandler`.

---

### `src/events/` — Domain events & outbox pattern

* **DomainEvent.ts** — Domain event shape (id, type, occurredAt, payload).
* **Envelope.ts** — Integration envelope (headers: requestId, tenantId, trace, version).
* **EventBusPort.ts** — Port interface to publish events to your bus (EventBridge/SNS/Kafka).
* **EventFactory.ts** — Helpers to create/envelope events consistently.
* **EventsPublisher.ts** — Orchestrator that drains an outbox and calls the `EventBusPort`.
* **Outbox.ts** — Outbox store port: save/pullPending/markDispatched/markFailed.
* **index.ts** — Barrel re-export.

**Use when:** implementing reliable, eventually consistent integration via outbox + bus publisher.

---

### `src/http/` — Lambda HTTP primitives

* **apiHandler.ts** — Wrapper for Lambda handlers: CORS (preflight), default headers, uniform error mapping via `errors/mapError`, requestId propagation.
* **controllerFactory.ts** — Assembles a controller pipeline (middlewares → validator → handler), keeps controllers small and repeatable.
* **cors.ts** — Build CORS headers and detect `OPTIONS` preflight.
* **httpTypes.ts** — Typed `ApiEvent`, `ApiResponse`, `Headers` for API Gateway v2 (HTTP API).
* **index.ts** — Barrel re-export.
* **middleware.ts** — Middleware types and composition helpers for HTTP layer.
* **request.ts** — Safe parsing of path/query/body/headers (with JSON parsing, Zod integration hooks).
* **responses.ts** — Helpers for common responses: `ok`, `created`, `noContent`, `badRequest`, `unauthorized`, `forbidden`, `notFound`, etc.

**Use when:** building Lambda endpoints; wrap your business function with `apiHandler` and keep handlers declarative.

---

### `src/messaging/` — Messaging ports

* **ports.ts** — Contracts for producers/consumers (queues, topics) to abstract SQS/SNS/Kafka.

---

### `src/observability/` — Logging, metrics, tracing (non-invasive)

* **context.ts** — Request-scoped context (requestId, tenantId, principal) to attach to logs/metrics.
* **decorators/**

  * **index.ts** — Barrel re-export.
  * **withLogging.ts** — Function decorator to log inputs/outputs/errors.
  * **withMetrics.ts** — Decorator to emit latency, counts, error rates.
  * **withRetry.ts** — Decorator to apply retry policies (composable with AWS policies).
  * **withTracing.ts** — Decorator to open/close spans and annotate attributes.
* **index.ts** — Barrel re-export.
* **logger.ts** — Structured logger facade with levels and contextual fields.
* **metrics.ts** — Simple metrics facade (CloudWatch or pluggable backends).
* **redact.ts** — Redaction helpers to remove PII from logs.
* **timers.ts** — Helpers to measure execution times and produce histograms.
* **tracing.ts** — Tracing helpers (OTEL-ready hooks).

**Use when:** you need visibility without polluting business code—wrap use-cases/repos with decorators.

---

### `src/storage/` — Storage ports

* **ports.ts** — `StoragePort` to abstract object storage (put/get/delete/head/list).

---

### `src/types/` — Cross-cutting types

* **api.ts** — API types (e.g., `ApiResponseStructured`, handler signatures).
* **auth.ts** — `JwtClaims`, `Principal`, `AuthContext`, `UserRole`.
* **brand.ts** — Nominal types via branding (e.g., `TenantId`, `UserId`, `Scope`, `Permission`).
* **common.ts** — `JsonValue`, `Opaque<T>`, deep readonly and other type utilities.
* **corsConfig.ts** — `CorsConfig` used by `http/apiHandler` and `config/cors`.
* **env.d.ts** — Ambient types for known environment variables (editor hints).
* **events.ts** — Shared integration event types.
* **index.ts** — Barrel re-export.
* **mapErrorOptions.ts** — Options for `mapError` rendering (requestId, exposeDetails, extra headers).
* **pagination.ts** — Pagination types (`PaginationParams`, `Cursor`) and header builders.
* **security.ts** — `SecurityContext`, `Permission`, `Scope`, `ResourceRef`, `Action`, `PolicyDecision`.

---

### `src/utils/` — General utilities

* **array.ts** — `chunk`, `unique`, `partition`, safe array helpers.
* **crypto.ts** — Hashing, base64url helpers, random secret generation (not KMS).
* **date.ts** — UTC/ISO timestamps, add/subtract, floor/ceil utilities.
* **env.ts** — Read+validate env vars with sensible defaults.
* **id.ts** — ULID/UUID helpers for IDs and prefixes.
* **index.ts** — Barrel re-export.
* **json.ts** — `stableStringify`, tolerant `parseJson`, safe clamps.
* **math.ts** — Randoms, clamp, percentiles.
* **object.ts** — `pick`, `omit`, deep merge, deep freeze.
* **path.ts** — Lightweight path helpers (no `fs`).
* **promise.ts** — `withTimeout`, `sleep`, concurrency limiting.
* **s3.ts** — S3 path helpers (bucket/key join, dirname/basename, ARN helpers).
* **string.ts** — Slugify, casing, trimming, normalization.
* **validation.ts** — Thin glue to use Zod with consistent patterns.

---

### `src/validation/` — Zod schemas & builders

* **commonSchemas.ts** — Common reusable schemas (email, ISO dates, ULID/UUID, non-empty strings).
* **env.ts** — Service env schema (define required variables and defaults per service).
* **http.ts** — Schemas for common HTTP shapes (headers/query/path/body).
* **ids.ts** — Identifier schemas (TenantId, UserId, CaseId, etc.).
* **index.ts** — Barrel re-export.
* **pagination.ts** — Standard `limit/cursor` query schema.
* **requests.ts** — Builders to compose validators for controllers (headers+params+body).
* **sanitizers.ts** — `toInt`, `trim`, `toLower`, canonicalization.
* **z.ts** — Central Zod facade & helpers (re-exports `z` plus wrappers).

---

### `prisma/` — Optional Prisma scaffolding

* **schema.prisma** — Central schema for shared models (used if the service talks to SQL).
* **migrations/** — Versioned migrations (generated by Prisma).
* **seeds/** — Seed data/scripts.

> Microservices that use their own schema can either:
>
> * depend on this shared client (monorepo workspace hoists it), or
> * own a local schema and generate a service-local client. Choose one per service.

---

## Quick recipes

### REST Lambda with auth, validation, errors

```ts
import { apiHandler, ok, badRequest } from "@lawprotect/shared-ts/http";
import { authenticate, guard } from "@lawprotect/shared-ts/auth";
import { z, validate } from "@lawprotect/shared-ts/validation";

const Params = z.object({ id: z.string().uuid() });

export const handler = apiHandler(async (evt) => {
  const { params } = validate(evt, { params: Params });

  const auth = await authenticate(evt);
  guard.requireRole(auth, ["admin", "super_admin"]);

  // call use-case
  return ok({ id: params.id, status: "ready" });
});
```

### Use-case + repository (hexagonal)

```ts
import { Result } from "@lawprotect/shared-ts/app";
import { NotFound } from "@lawprotect/shared-ts/errors";
import type { Repository } from "@lawprotect/shared-ts/contracts";

export const getDocument =
  (repo: Repository<{ id: string }>) =>
  async (id: string): Promise<Result<{ id: string }, NotFound>> => {
    const found = await repo.findById(id);
    if (!found) return Result.err(new NotFound("COMMON_NOT_FOUND", "Document not found"));
    return Result.ok(found);
  };
```

### Outbox publisher

```ts
import { EventFactory } from "@lawprotect/shared-ts/events";

const evt = EventFactory.domainEvent("docs.document.finalized", { docId, tenantId });
// persist to outbox; a scheduler calls EventsPublisher.dispatch() to publish
```

---

## Conventions

* **Do not throw raw strings.** Throw `AppError` or a subclass. `http/apiHandler` maps errors consistently to HTTP.
* **Opaque cursors.** Use `db/cursor.ts` to build base64url(JSON) cursors without sensitive data.
* **Guard early.** Controllers should validate input and apply auth guards before touching use-cases.
* **Ports first.** Define ports in `contracts/` (and in `aws/cache/messaging/storage` when infra-related); implement adapters per microservice.
* **Observability by decoration.** Wrap functions with `observability/decorators` to add logging/metrics/retries/tracing without changing business logic.

---

## FAQ

* **Do I need every module in each microservice?** No. Import only what you need.
* **Where do I put cloud adapters (S3, SQS, Redis)?** In each microservice under its own `interfaces/` (or `infra/`) folder, implementing the corresponding **ports** from this package.
* **How do I add a new provider (e.g., OpenSearch)?** Add a new port interface (e.g., `SearchPort`) here and implement it in the microservice.
* **Can I extend `ErrorCodes`?** Yes. Add stable codes in `errors/codes.ts` and use them in your services so dashboards/alerts are consistent.
* **How do I enable CORS?** Pass `cors` in `apiHandler({ cors: { allowOrigins: ["*"], ... } })` or reuse a preset from `config/cors.ts`.

---

## Import map (barrel exports)

To keep imports short:

```ts
// HTTP
import { apiHandler, ok, badRequest } from "@lawprotect/shared-ts/http";

// Auth
import { authenticate, guard, can } from "@lawprotect/shared-ts/auth";

// Errors
import { AppError, NotFound, ErrorCodes, mapError } from "@lawprotect/shared-ts/errors";

// Validation
import { z, validate } from "@lawprotect/shared-ts/validation";

// DB
import { prisma, withTransaction } from "@lawprotect/shared-ts/db";

// Events
import { EventFactory, EventsPublisher } from "@lawprotect/shared-ts/events";

// Observability
import { logger, withLogging, withMetrics } from "@lawprotect/shared-ts/observability";

// Types
import type { AuthContext, ApiEvent } from "@lawprotect/shared-ts/types";
```

---

Keep this README close as a map. When you find yourself duplicating logic across services, extract a **contract + helper** here and re-use it everywhere.
