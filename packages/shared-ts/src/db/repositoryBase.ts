/**
 * Minimal Prisma-like client for repositories.
 */
export interface PrismaClientLike {
  /**
   * Runs a function inside a transaction, if supported by the client.
   * @typeParam T - Return type of the transactional function.
   * @param fn - Function that receives a transactional client and returns a promise.
   * @returns A promise resolving to the function result.
   */
  $transaction?<T>(fn: (tx: PrismaTxLike) => Promise<T>): Promise<T>;
}

/**
 * Minimal Prisma-like transaction handle.
 * Extend this interface if your concrete client exposes transactional helpers.
 */
export interface PrismaTxLike {}

/**
 * Base class for repositories using a Prisma-like client.
 * Implement all abstract members in derived repositories.
 *
 * @typeParam TDomain - Domain entity type managed by the repository.
 * @typeParam TId - Identifier type (defaults to `string`).
 * @typeParam TSpec - Query/filter specification type.
 */
export abstract class RepositoryBase<TDomain, TId = string, TSpec = unknown> {
  /** Underlying Prisma-like client. */
  protected readonly prisma: PrismaClientLike;

  /**
   * Creates a new repository bound to a Prisma-like client.
   * @param prisma - Prisma-like client or wrapper.
   */
  constructor(prisma: PrismaClientLike) {
    this.prisma = prisma;
  }

  /**
   * Maps a persistence record to a domain entity.
   * @param row - Raw persistence record.
   */
  protected abstract toDomain(row: unknown): TDomain;

  /**
   * Maps a domain entity to persistence create input.
   * @param entity - Complete domain entity for creation.
   */
  protected abstract toCreateModel(entity: TDomain): unknown;

  /**
   * Maps a partial entity/DTO to persistence update input (only defined fields).
   * @param patch - Partial domain entity or DTO for updates.
   */
  protected abstract toUpdateModel(patch: Partial<TDomain> | Record<string, unknown>): unknown;

  /**
   * Builds a persistence-level filter for a primary identifier.
   * @param id - Entity identifier.
   */
  protected abstract whereById(id: TId): unknown;

  /**
   * Builds a persistence-level filter from a query specification.
   * @param spec - Query/filter specification.
   */
  protected abstract whereFromSpec(spec: TSpec): unknown;

  /**
   * Finds an entity by its identifier.
   * @param id - Entity identifier.
   * @param tx - Optional transactional context.
   * @returns The entity if found; otherwise `null`.
   */
  abstract findById(id: TId, tx?: PrismaTxLike): Promise<TDomain | null>;

  /**
   * Creates a new entity.
   * @param data - Domain data to persist.
   * @param tx - Optional transactional context.
   * @returns The created entity.
   */
  abstract create(data: Partial<TDomain>, tx?: PrismaTxLike): Promise<TDomain>;

  /**
   * Updates an existing entity.
   * @param id - Entity identifier.
   * @param patch - Partial domain changes to apply.
   * @param tx - Optional transactional context.
   * @returns The updated entity.
   */
  abstract update(
    id: TId,
    patch: Partial<TDomain>,
    tx?: PrismaTxLike
  ): Promise<TDomain>;

  /**
   * Deletes an entity by its identifier.
   * @param id - Entity identifier.
   * @param tx - Optional transactional context.
   */
  abstract delete(id: TId, tx?: PrismaTxLike): Promise<void>;

  /**
   * Lists entities by specification with optional cursor pagination.
   * @param spec - Query/filter specification.
   * @param limit - Page size (maximum number of items to return).
   * @param cursor - Opaque pagination cursor.
   * @param tx - Optional transactional context.
   * @returns A page of items and an optional `nextCursor` when more results exist.
   */
  abstract list(
    spec: TSpec,
    limit: number,
    cursor?: string,
    tx?: PrismaTxLike
  ): Promise<{ items: TDomain[]; nextCursor?: string }>;
}
