import type { QuerySpec } from "./QuerySpec.js";

/**
 * Generic repository contract for aggregate persistence.
 * Adapters implement this on top of Prisma, SQL, DynamoDB, etc.
 */
export interface Repository<T, Id = string, Ctx = unknown> {
  /**
   * Loads an entity by id.
   * @param id Entity identifier.
   * @param ctx Optional repository context (transaction
   * @returns Entity or null when not found.
   */
  getById(id: Id, ctx?: Ctx): Promise<T | null>;

  /**
   * Checks existence by id.
   * @param id Entity identifier.
   * @param ctx Optional repository context.
   */
  exists(id: Id, ctx?: Ctx): Promise<boolean>;

  /**
   * Persists a new entity.
   * @param entity Domain entity.
   * @param ctx Optional repository context.
   * @returns Persisted entity (may include generated fields).
   */
  create(entity: T, ctx?: Ctx): Promise<T>;

  /**
   * Partially updates an entity.
   * @param id Entity identifier.
   * @param patch Partial fields to update.
   * @param ctx Optional repository context.
   * @returns Updated entity.
   */
  update(id: Id, patch: Partial<T>, ctx?: Ctx): Promise<T>;

  /**
   * Removes an entity by id.
   * @param id Entity identifier.
   * @param ctx Optional repository context.
   */
  delete(id: Id, ctx?: Ctx): Promise<void>;

  /**
   * Queries entities by specification.
   * @param spec Query specification (filters, order, pagination).
   * @param ctx Optional repository context.
   * @returns Matching entities (page).
   */
  query?(spec: QuerySpec<T>, ctx?: Ctx): Promise<readonly T[]>;

  /**
   * Counts entities by specification.
   * @param spec Optional query specification (filters).
   * @param ctx Optional repository context.
   * @returns Total count.
   */
  count?(spec?: QuerySpec<T>, ctx?: Ctx): Promise<number>;
}
