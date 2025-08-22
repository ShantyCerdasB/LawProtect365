````md
# `db/` — Data-access Helpers & Ports (API Reference)

Database-agnostic utilities and small ports you can use to build repository adapters (Prisma, SQL, DynamoDB, etc.) in a **hexagonal** architecture.

Import via:
```ts
import {
  // Pagination & cursors
  Page, pageFromRows, IdCursor, idCursorFromRow, getIdFromCursor,
  // Prisma factories & tx helpers
  getPrisma, createPrisma, withTransaction, type TxOptions,
  // Repository base/ports
  CrudRepository, ListRepository, UnitOfWork as DbUnitOfWork,
  RepositoryBase, type PrismaClientLike, type PrismaTxLike,
} from "@lawprotect365/shared/db";
````

---

## Where these fit in a hexagonal service

* **Use Cases (Application):** depend on repository **ports** (e.g., `CrudRepository`, `ListRepository`) passed by the container.
* **Adapters (Infra):** implement those ports using a concrete client (Prisma, SQL, DDB). Use `RepositoryBase`, `pageFromRows`, and the Prisma helpers here.
* **Domain:** no DB types; keep entities/rules pure.

---

## Pagination & Cursor Helpers

### `interface Page<T>`

Shape returned by forward-only cursor pagination.

* **Fields**

  * `items: T[]` — page contents.
  * `nextCursor?: string` — opaque cursor for the next page (omit if no more pages).

---

### `pageFromRows<T>(rows: T[], limit: number, toCursor: (row: T) => string): Page<T>`

Builds a `Page<T>` from a result set fetched with **limit+1** strategy.

* **Purpose:** Trim the extra row and emit `nextCursor` when there’s another page.
* **Parameters**

  * `rows`: Items fetched from storage, up to `limit + 1`.
  * `limit`: Requested page size.
  * `toCursor(row)`: Function that produces a cursor from the **last included** row.
* **Returns:** `{ items, nextCursor? }`
* **Notes:** Works with any storage as long as ordering is **stable** (e.g., `(createdAt, id)`).
* **Example**

  ```ts
  const rows = await prisma.envelope.findMany({ take: limit + 1, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
  return pageFromRows(rows, limit, (r) => cursorFromRecord({ createdAt: r.createdAt, id: r.id }, ["createdAt","id"]));
  ```

---

### `interface IdCursor { id: string | number }`

Minimal cursor payload when the only sort key is `id`.

---

### `idCursorFromRow<T extends { id: string | number }>(row: T): string`

Encodes a cursor from a row **reading the `id` field**.

* **Purpose:** Convenience for common `ORDER BY id DESC/ASC` listings.
* **Parameters**

  * `row`: Source object with `id`.
* **Returns:** Opaque cursor string.
* **Notes:** Internally uses `cursorFromRecord(row, ["id"])`.

---

### `getIdFromCursor(cursor?: string): string | number | undefined`

Decodes an `IdCursor`-based cursor and extracts `id`.

* **Purpose:** Resume listing from the last seen `id`.
* **Parameters**

  * `cursor` (optional): Opaque cursor string.
* **Returns:** The `id` inside the cursor, or `undefined` if missing/invalid.
* **Notes:** Internally uses `decodeCursor<IdCursor>(cursor)`.

> Related (from `cursor.ts`, imported internally here):
>
> * `encodeCursor(value: object): string` — base64-encodes a JSON payload.
> * `decodeCursor<T>(cursor?: string): T | undefined` — decodes and parses.
> * `cursorFromRecord(record: object, keys: string[]): string` — picks `keys` from `record` and encodes.

---

## Prisma Client Factories

### `interface PrismaFactoryOptions`

Options for creating a Prisma client.

* `log?: (Prisma.LogLevel | Prisma.LogDefinition)[]` — logging config.
* `url?: string` — overrides `process.env.DATABASE_URL`.

---

### `getPrisma(opts?: PrismaFactoryOptions): PrismaClient`

Process-wide **singleton** `PrismaClient`.

* **Purpose:** Reuse a single client in Lambda/dev to avoid exhausting connections.
* **Parameters**

  * `opts` (optional): Overrides for `url` and `log`.
* **Returns:** A cached `PrismaClient`.
* **Throws:** If `DATABASE_URL` is not set (and no `opts.url` provided).
* **Environment**

  * `LOG_LEVEL` (`debug|info|warn|error`) influences base log levels.
  * `DEBUG_SQL=1` enables query event logging.
* **Usage**

  ```ts
  const prisma = getPrisma();
  ```

---

### `createPrisma(opts?: PrismaFactoryOptions): PrismaClient`

**New** `PrismaClient` instance each call.

* **Purpose:** Isolated clients for scripts/tests; do **not** use in hot paths.
* **Parameters/Returns/Throws:** Same as `getPrisma`.

---

## Transactions

### `interface TxOptions`

Options for interactive transactions.

* `maxWaitMs?: number` — acquire timeout (default `5000`).
* `timeoutMs?: number` — per-tx timeout (default `15000`).
* `isolationLevel?: Prisma.TransactionIsolationLevel` — override isolation.

---

### `withTransaction<T>(prisma: PrismaClient, fn: (tx: PrismaClient) => Promise<T>, opts?: TxOptions): Promise<T>`

Runs `fn` inside an interactive `prisma.$transaction`.

* **Purpose:** Simple, typed transaction boundary.
* **Parameters**

  * `prisma`: A `PrismaClient`.
  * `fn(tx)`: Callback receiving a transactional client.
  * `opts` (optional): `TxOptions`.
* **Returns:** Result of `fn`.
* **Example**

  ```ts
  const result = await withTransaction(prisma, async (tx) => {
    const a = await tx.tableA.create({ data: ... });
    const b = await tx.tableB.update({ where: { id }, data: ... });
    return { a, b };
  }, { timeoutMs: 20000 });
  ```

---

## Repository Ports & Base Class

### `interface CrudRepository<T, ID = string>`

Basic CRUD port (DB-agnostic).

* `findById(id: ID): Promise<T | undefined>` — load or `undefined`.
* `create(input: Omit<T, "id">): Promise<T>` — insert and return.
* `update(id: ID, patch: Partial<T>): Promise<T>` — partial update and return.
* `delete(id: ID): Promise<boolean>` — remove and return success flag.

**Use in application layer:** your use cases depend on this interface.
**Implement in infra:** translate to Prisma/DDB/etc.

---

### `interface ListRepository<T, Filter = unknown>`

Listing port with cursor pagination.

* `list(filter: Filter, limit: number, cursor?: string): Promise<Page<T>>`
  **Notes:** Use `pageFromRows` and a stable `toCursor`.

---

### `interface UnitOfWork<C = unknown>`

DB-oriented transactional unit.

* `withTransaction<T>(fn: (ctx: C) => Promise<T>): Promise<T>`
  **Purpose:** Adapter passes a transactional context (`ctx`) to repositories.

**Example adapter**

```ts
class PrismaUow implements DbUnitOfWork<PrismaClient> {
  constructor(private prisma = getPrisma()) {}
  withTransaction<T>(fn: (tx: PrismaClient) => Promise<T>) {
    return withTransaction(this.prisma, fn);
  }
}
```

---

### `abstract class RepositoryBase<TDomain, TId = string, TSpec = unknown>`

Helper base for Prisma-like repositories.

* **Constructor**

  * `(prisma: PrismaClientLike)` — minimal client with optional `$transaction`.
* **Protected abstract methods (implement in your concrete repo)**

  * `toDomain(row: unknown): TDomain` — map DB row → domain entity.
  * `toModel(entity: Partial<TDomain>): unknown` — map domain → persistence shape.
  * `whereById(id: TId): unknown` — primary-key filter.
  * `whereFromSpec(spec: TSpec): unknown` — filter from query spec.
* **Virtual methods (override with concrete logic)**

  * `findById(id: TId, tx?: PrismaTxLike): Promise<TDomain | null>`
  * `create(data: Partial<TDomain>, tx?: PrismaTxLike): Promise<TDomain>`
  * `update(id: TId, patch: Partial<TDomain>, tx?: PrismaTxLike): Promise<TDomain>`
  * `delete(id: TId, tx?: PrismaTxLike): Promise<void>`
  * `list(spec: TSpec, limit: number, cursor?: string, tx?: PrismaTxLike): Promise<{ items: TDomain[]; nextCursor?: string }>`
* **Notes**

  * This base class does **not** enforce Prisma types; you can adapt it for any client exposing `$transaction`.

**Types**

* `interface PrismaClientLike { $transaction?<T>(fn: (tx: PrismaTxLike) => Promise<T>): Promise<T> }`
* `interface PrismaTxLike {}` — generic transactional handle.

---

## Patterns & Examples

### Forward-only cursor with Prisma

```ts
import { pageFromRows, cursorFromRecord } from "@lawprotect365/shared/db";

async function listByTenant(prisma: PrismaClient, tenantId: string, limit: number, cursor?: string) {
  const take = Math.min(Math.max(limit, 1), 100) + 1;
  const where = { tenantId };
  const orderBy = [{ createdAt: "desc" as const }, { id: "desc" as const }];

  const rows = await prisma.envelope.findMany({
    where,
    orderBy,
    take,
    ...(cursor ? { cursor: decodeCursor<{ createdAt: Date; id: string }>(cursor) } : {}),
    ...(cursor ? { skip: 1 } : {}), // skip the cursor row
  });

  return pageFromRows(rows, take - 1, (row) =>
    cursorFromRecord({ createdAt: row.createdAt, id: row.id }, ["createdAt", "id"])
  );
}
```

### Adapter implementing `CrudRepository` + `ListRepository`

```ts
class EnvelopeRepo implements CrudRepository<Envelope>, ListRepository<Envelope, { tenantId: string }> {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    const row = await this.prisma.envelope.findUnique({ where: { id } });
    return row ? toDomain(row) : undefined;
  }

  async create(input: Omit<Envelope, "id">) {
    const row = await this.prisma.envelope.create({ data: toModel(input) });
    return toDomain(row);
  }

  async update(id: string, patch: Partial<Envelope>) {
    const row = await this.prisma.envelope.update({ where: { id }, data: toModel(patch) });
    return toDomain(row);
  }

  async delete(id: string) {
    await this.prisma.envelope.delete({ where: { id } });
    return true;
  }

  async list(filter: { tenantId: string }, limit: number, cursor?: string) {
    const rows = await this.prisma.envelope.findMany({
      where: { tenantId: filter.tenantId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: decodeCursor<{ createdAt: Date; id: string }>(cursor), skip: 1 } : {}),
    });
    return pageFromRows(rows, limit, (r) => cursorFromRecord({ createdAt: r.createdAt, id: r.id }, ["createdAt", "id"]));
  }
}
```

---

## Notes & Best Practices

* **Singleton client:** Prefer `getPrisma()` in runtime code; reserve `createPrisma()` for tests/scripts.
* **Stable ordering:** Always sort by a unique tiebreaker (e.g., `createdAt` + `id`) when paginating.
* **Limit clamping:** Clamp `limit` server-side (e.g., `1..100`) to protect resources.
* **Opaque cursors:** Treat cursors as **opaque** strings; never trust client-provided shapes without decoding/validation.
* **Unit of Work:** Use `withTransaction` or an adapter implementing `DbUnitOfWork` where multiple repositories must succeed/fail together.
* **Hexagonal:** Repositories are **adapters**; your **use cases** depend only on repository **ports** (`CrudRepository`, `ListRepository`) or your own service-level ports.

```
```
