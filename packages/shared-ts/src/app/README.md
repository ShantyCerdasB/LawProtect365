# `app/` primitives — Hexagonal usage guide

Lightweight, **pure** application primitives shared across all services. These types and helpers are **framework-agnostic** and have **no I/O** or `process.env` access. They support the hexagonal architecture by giving you small, explicit building blocks for orchestration and flow control.

---

## What’s inside

- **Maybe.ts**
  - `type Maybe<T>`: Optional container (`"some" | "none"`).
  - Helpers (collision-safe):
    - `maybeSome<T>(value): Maybe<T>`
    - `maybeNone<T>(): Maybe<T>`
    - `maybeFromNullable<T>(v: T | null | undefined): Maybe<T>`
    - `maybeMap<T,U>(m, fn): Maybe<U>`
    - `maybeUnwrapOr<T>(m, fallback): T`

- **Result.ts**
  - `type Result<T, E>`: Success/Failure union (`{ ok: true, value } | { ok: false, error }`).
  - Helpers (collision-safe):
    - `resultOk<T>(value): Result<T>`
    - `resultErr<E>(error): Result<never, E>`
    - `resultMap<T,U,E>(r, fn): Result<U, E>`
    - `resultMapErr<T,E,F>(r, fn): Result<T, F>`
    - `resultAndThen<T,U,E>(r, fn): Result<U, E>`
    - `resultUnwrap<T,E>(r): T` (throws on error)
    - `resultUnwrapOr<T,E>(r, fallback): T`

- **AppContext.ts**
  - Request-scoped contracts:
    - `LoggerLike`, `MetricsLike`, `TracerLike`
    - `AppContext` with `env`, `requestId`, providers, and an optional `bag` for per-request data (tenant/auth/flags).

---

## Where these fit in a **hexagonal microservice**

Hexagonal layers (outer → inner):

1. **Handlers/Controllers (HTTP/Lambda)**  
   - Create/populate an `AppContext` per request (provided by your service’s `middleware/` or `app/bootstrap` in the service repo).  
   - Use `Result` to **translate** use-case outcomes into HTTP responses.  
   - Use `Maybe` to handle optional query/path params or headers.

2. **Use Cases (Application layer)**  
   - Prefer returning `Result` for operational outcomes (e.g., validation failures, business preconditions).  
   - Accept `AppContext` **by parameter** if you need logging/metrics/tracing; do not **construct** it here.  
   - Keep use cases **purely orchestrational**; they call ports/adapters but don’t know infra details.

3. **Domain (Entities, Value Objects, Rules)**  
   - Use **`Result`** for domain rule evaluation (e.g., “transition not allowed”).  
   - Use **`Maybe`** for optional attributes or lookups that can be absent.  
   - **Do not** depend on `AppContext` here (domain is pure and deterministic).

4. **Ports/Adapters (Infrastructure)**  
   - Adapters should **not** require `AppContext` in constructors; when needed, accept a logger/tracer **via method arguments** from the use case.  
   - Map infra errors to **domain/application `Result`** or **throw structured errors** (mapped later by controllers).

5. **Middleware/Bootstrap (Service)**  
   - Assemble the **real** logger/metrics/tracer implementations and inject them into `AppContext` per request.  
   - Configure CORS/auth/rate limit **outside** of `app/` (lives in `config/` and `observability/`).

> Rule of thumb  
> - **Domain**: `Maybe`/`Result` **only**.  
> - **Use Cases**: `Result` + optional `AppContext` argument for observability.  
> - **Controllers**: build `AppContext`, call use case, map `Result` → HTTP.  
> - **Adapters**: no `AppContext` dependency in constructors; accept observability as parameters if needed.

---

## Anti-patterns to avoid

- ❌ Creating or reading `process.env` from `app/` modules.  
- ❌ Making `AppContext` a global singleton; it must be **request-scoped**.  
- ❌ Throwing raw infra exceptions from use cases; prefer `Result` and map at the controller boundary.  
- ❌ Returning `null | undefined` in domain/use-case APIs; prefer `Maybe` for explicit absence.

---

## Import patterns

Once re-exported from your package barrel:

```ts
// Flat import from the shared package (recommended)
import {
  // Maybe
  Maybe, maybeSome, maybeNone, maybeFromNullable, maybeMap, maybeUnwrapOr,
  // Result
  Result, resultOk, resultErr, resultMap, resultMapErr, resultAndThen, resultUnwrap, resultUnwrapOr,
  // AppContext
  AppContext, LoggerLike, MetricsLike, TracerLike,
} from "@lawprotect/shared-ts";
