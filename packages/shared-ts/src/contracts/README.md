````md
# `contracts/` — Application Contracts & Composition (API Reference)

Typed, framework-agnostic building blocks for **hexagonal microservices**: use cases, controllers, repositories, transactions, mappers, and idempotency.

Import via the package barrel:

```ts
import {
  // Idempotency
  IdempotencyStore, Idempotency,
  // Controllers
  Controller, ControllerMiddleware,
  CtrBeforeMiddleware, CtrAfterMiddleware, CtrOnErrorMiddleware,
  ControllerFactoryOptions, composeController,
  // Mapping
  Mapper, PartialMapper,
  // Persistence
  Repository, QuerySpec, Where, OrderBy, SortDirection, QueryPagination,
  // Transactions
  UnitOfWork, TransactionalContext,
  // Use cases
  UseCase, asUseCase,
} from "@lawprotect365/shared";
````

---

## Where these fit in a hexagonal service

* **Controllers (edge):** compose HTTP handlers with `composeController` and phase-based middlewares; call a single **UseCase**.
* **Use Cases (application):** implement business orchestration using `UseCase`/`asUseCase`; call **Ports** (`Repository`, `Idempotency`, etc.).
* **Domain:** pure entities/rules; no infra imports.
* **Adapters (infra):** implement ports (`Repository`, `IdempotencyStore`, `UnitOfWork`) over DB/queues/caches.

---

## Idempotency

### `interface IdempotencyStore`

Persistence for idempotency keys.

* **`get(key: string): Promise<"pending" | "completed" | null>`**
  Purpose: Check current state for a key.
  Returns: `"pending"` if in progress, `"completed"` if finished, or `null` if unknown.

* **`putPending(key: string, ttlSeconds: number): Promise<void>`**
  Purpose: Mark a key as **pending** with TTL.
  Notes: Use conditional write to avoid races.

* **`putCompleted(key: string, result: unknown, ttlSeconds: number): Promise<void>`**
  Purpose: Mark as **completed** and store a **result snapshot** (JSON-serializable) with TTL.

### `interface Idempotency`

Execution facade that uses an `IdempotencyStore` internally.

* **`run<R>(key: string, fn: () => Promise<R>, ttlSeconds?: number): Promise<R>`**
  Purpose: Execute `fn` **once** per `key`; subsequent calls reuse the stored result.
  Params:

  * `key`: Stable idempotency key (e.g., request header, payment intent).
  * `fn`: Async computation to protect.
  * `ttlSeconds` (optional): Tracking TTL for pending/completed states.
    Returns: `R` (fresh or cached).

**Typical use (send/invite/complete flows):**

```ts
const output = await idempotency.run(
  `send:${tenantId}:${envelopeId}`,
  async () => await useCase.execute(input, ctx),
  900
);
```

---

## Controllers & Composition

### `type Controller<Req, Out, Ctx>`

Signature for a controller function.

* **Params:** `(req: Req, ctx?: Ctx)`
* **Returns:** `Out | Promise<Out>`
* **Notes:** `Out` is considered the **resolved** result passed to `after` middlewares.

### Phase-based middlewares

* **`CtrBeforeMiddleware<Req, Ctx>`**: `(req, ctx?) => void | Promise<void>`
  Purpose: validation, enrichment, correlation IDs, etc. Runs **before** core.

* **`CtrAfterMiddleware<Req, Out, Ctx>`**: `(req, res, ctx?) => Out | void | Promise<Out | void>`
  Purpose: post-processing (shape transform, redaction). If returns `undefined`, original `res` is kept.

* **`CtrOnErrorMiddleware<Req, Out, Ctx>`**: `(error, req, ctx?) => Out | void | Promise<Out | void>`
  Purpose: map errors to fallback `Out`; returning `undefined` rethrows.

### Classic middleware

* **`ControllerMiddleware<Req, Out, Ctx>`**: `(next: Controller) => Controller`
  Purpose: familiar “wrap next” pattern (logging, timing, auth).

### `interface ControllerFactoryOptions<Req, Out, Ctx>`

* `middlewares?: readonly ControllerMiddleware<Req, Out, Ctx>[]` — applied **left→right**, last wraps closest to core.
* `before?: readonly CtrBeforeMiddleware<Req, Ctx>[]` — in declaration order.
* `after?: readonly CtrAfterMiddleware<Req, Out, Ctx>[]` — in declaration order.
* `onError?: readonly CtrOnErrorMiddleware<Req, Out, Ctx>[]` — first to return a value **handles** the error.

### `composeController(core, opts?): Controller`

Composes a controller with both classic and phase-based middleware.

* **Params:**

  * `core: Controller<Req, Out, Ctx>`
  * `opts?: ControllerFactoryOptions<Req, Out, Ctx>`
* **Returns:** `Controller<Req, Out, Ctx>` (composed).

**Example**

```ts
const core: Controller<{ n: number }, { out: number }> = async ({ n }) => ({ out: n * 2 });

const logBefore: CtrBeforeMiddleware<{ n: number }> = (req) => console.info("before", req);
const uppercaseAfter: CtrAfterMiddleware<any, { out: number }> = (_req, res) => ({ out: res.out });

const mw: Controller<any, any> = (next) => async (req) => {
  const r = await next(req);
  return r;
};

export const handler = composeController(core, {
  before: [logBefore],
  after: [uppercaseAfter],
  middlewares: [mw],
});
```

---

## Mapping

### `interface Mapper<Domain, DTO>`

Bidirectional translator between domain and transport.

* **`toDTO(input: Domain): DTO`** — Purpose: map entity → API/DB DTO.
* **`fromDTO(input: DTO): Domain`** — Purpose: map DTO → entity with invariants.

### `type PartialMapper<Domain, DTO> = Partial<Mapper<Domain, DTO>>`

When only one direction is needed (e.g., read models).

**Example**

```ts
const EnvelopeMapper: Mapper<Envelope, EnvelopeDTO> = {
  toDTO: (e) => ({ id: e.id, status: e.status }),
  fromDTO: (d) => Envelope.create(d.id, d.status),
};
```

---

## Persistence

### `interface Repository<T, Id = string, Ctx = unknown>`

Generic repository for aggregates (DB-agnostic).

* **`getById(id: Id, ctx?: Ctx): Promise<T | null>`**
  Purpose: load one.

* **`exists(id: Id, ctx?: Ctx): Promise<boolean>`**
  Purpose: fast existence probe.

* **`create(entity: T, ctx?: Ctx): Promise<T>`**
  Purpose: insert; may return generated fields.

* **`update(id: Id, patch: Partial<T>, ctx?: Ctx): Promise<T>`**
  Purpose: partial update; return updated entity.

* **`delete(id: Id, ctx?: Ctx): Promise<void>`**
  Purpose: hard/soft delete depending on adapter.

* **`query?(spec: QuerySpec<T>, ctx?: Ctx): Promise<readonly T[]>`**
  Purpose: list with filters/order/pagination (optional).

* **`count?(spec?: QuerySpec<T>, ctx?: Ctx): Promise<number>`**
  Purpose: count for pagination (optional).

### Query types

* **`type SortDirection = "asc" | "desc"`**

* **`interface OrderBy<T>`**

  * `field: keyof T & string`
  * `direction?: SortDirection` *(default `"asc"`)*

* **`interface QueryPagination`**

  * `limit?: number` — server clamps to safe bounds
  * `cursor?: string` — opaque continuation token

* **`type Where<T> = Partial<Record<keyof T & string, unknown>>`**
  Minimal predicate; adapters translate to DB filters.

* **`interface QuerySpec<T>`**

  * `where?: Where<T>`
  * `orderBy?: OrderBy<T>[]`
  * `pagination?: QueryPagination`
  * `select?: (keyof T & string)[]`

**Example**

```ts
const page = await repo.query?.({
  where: { tenantId, status: "sent" },
  orderBy: [{ field: "createdAt", direction: "desc" }],
  pagination: { limit: 50, cursor },
});
```

---

## Transactions

### `interface UnitOfWork<Tx = unknown>`

Transactional boundary abstraction.

* **`run<R>(work: (tx: Tx) => Promise<R>): Promise<R>`**
  Purpose: begin → run `work(tx)` → commit or rollback.
  Returns: the result from `work`.

### `interface TransactionalContext<Tx = unknown>`

* **`tx: Tx`** — Provider-specific handle passed to repositories.

**Example**

```ts
await uow.run(async (tx) => {
  await repoA.create(a, { tx });
  await repoB.update(id, patch, { tx });
});
```

---

## Use Cases

### `interface UseCase<I, O, C = unknown>`

* **`execute(input: I, context?: C): Promise<O>`**
  Purpose: the application’s **single business action**.

### `asUseCase(fn): UseCase`

Adapter to wrap an async function as a `UseCase`.

* **Params:**

  * `fn: (input: I, context?: C) => Promise<O>`
* **Returns:** `UseCase<I, O, C>`

**Example**

```ts
type Input = { envelopeId: string };
type Output = { status: "sent" };

export const SendEnvelope = asUseCase<Input, Output, { repos: { envelopes: Repository<Envelope> } }>(
  async (input, ctx) => {
    const env = await ctx!.repos.envelopes.getById(input.envelopeId);
    // apply domain rules, publish events, persist…
    return { status: "sent" };
  }
);
```

---

## Recommended patterns

* **Idempotency:** Protect side-effecting operations (`send`, `invite`, `complete`) with `Idempotency.run`.
* **Transactions:** Use `UnitOfWork.run` in use cases that touch multiple aggregates.
* **Repositories:** Keep them thin; map DB errors to application errors at the adapter boundary.
* **Controllers:** One controller → one use case; compose with `composeController` for validation/logging/error mapping.
* **Mapping:** Isolate DTO↔entity translation with `Mapper`; keep controllers DTO-only and use cases entity-only.

---

```
```
