/**
 * Minimal Prisma-like client for repositories.
 */
export interface PrismaClientLike {
  $transaction?<T>(fn: (tx: PrismaTxLike) => Promise<T>): Promise<T>;
}

/**
 * Minimal Prisma-like transaction.
 */
export interface PrismaTxLike {}

/**
 * Base class for repositories using a Prisma-like client.
 * Implement abstract members in derived repositories.
 */
export abstract class RepositoryBase<TDomain, TId = string, TSpec = unknown> {
  protected readonly prisma: PrismaClientLike;

  constructor(prisma: PrismaClientLike) {
    this.prisma = prisma;
  }

  /**
   * Converts a persistence record to a domain entity.
   * @param row Persistence model.
   */
  protected abstract toDomain(row: unknown): TDomain;

  /**
   * Converts a domain entity or patch to a persistence model.
   * @param entity Domain object.
   */
  protected abstract toModel(entity: Partial<TDomain>): unknown;

  /**
   * Builds a where-clause for a primary identifier.
   * @param id Identifier value.
   */
  protected abstract whereById(id: TId): unknown;

  /**
   * Builds a where-clause from a query specification.
   * @param spec Query specification.
   */
  protected abstract whereFromSpec(spec: TSpec): unknown;

  /**
   * Finds an entity by id.
   * @param id Identifier.
   * @param tx Optional transaction.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findById(id: TId, tx?: PrismaTxLike): Promise<TDomain | null> {
    throw new Error("Not implemented");
  }

  /**
   * Creates a new entity.
   * @param data Domain data to persist.
   * @param tx Optional transaction.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(data: Partial<TDomain>, tx?: PrismaTxLike): Promise<TDomain> {
    throw new Error("Not implemented");
  }

  /**
   * Updates an existing entity.
   * @param id Identifier.
   * @param patch Partial changes.
   * @param tx Optional transaction.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(id: TId, patch: Partial<TDomain>, tx?: PrismaTxLike): Promise<TDomain> {
    throw new Error("Not implemented");
  }

  /**
   * Deletes an entity by id.
   * @param id Identifier.
   * @param tx Optional transaction.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(id: TId, tx?: PrismaTxLike): Promise<void> {
    throw new Error("Not implemented");
  }

  /**
   * Lists entities by specification with optional cursor pagination.
   * @param spec Query specification.
   * @param limit Page size.
   * @param cursor Opaque cursor.
   * @param tx Optional transaction.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async list(spec: TSpec, limit: number, cursor?: string, tx?: PrismaTxLike): Promise<{ items: TDomain[]; nextCursor?: string }> {
    throw new Error("Not implemented");
  }
}
