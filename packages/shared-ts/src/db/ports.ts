/**
 * Storage-agnostic repository interfaces for domain models.
 * Implementations may use Prisma, DynamoDB, or any other backend.
 */

import type { Page } from "./pagination.js";

/**
 * Generic CRUD repository interface.
 */
export interface CrudRepository<T, ID = string> {
  /** Finds a record by id or returns undefined. */
  findById(id: ID): Promise<T | undefined>;
  /** Creates a new record and returns it. */
  create(input: Omit<T, "id">): Promise<T>;
  /** Updates an existing record and returns it. */
  update(id: ID, patch: Partial<T>): Promise<T>;
  /** Deletes a record by id and returns a boolean for success. */
  delete(id: ID): Promise<boolean>;
}

/**
 * Repository interface with cursor-based listing.
 */
export interface ListRepository<T, Filter = unknown> {
  /** Lists records by filter with forward-only cursor pagination. */
  list(
    filter: Filter,
    limit: number,
    cursor?: string
  ): Promise<Page<T>>;
}

/**
 * Unit of Work abstraction for grouping operations in a transaction.
 * Implementations bridge to the underlying client (e.g., Prisma.$transaction).
 */
export interface UnitOfWork<C = unknown> {
  /** Executes a function within a transaction and returns its result. */
  withTransaction<T>(fn: (ctx: C) => Promise<T>): Promise<T>;
}
