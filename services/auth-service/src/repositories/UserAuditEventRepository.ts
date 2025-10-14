/**
 * @fileoverview UserAuditEventRepository - Data access for UserAuditEvent entity
 * @summary Handles UserAuditEvent entity persistence operations
 * @description Provides data access methods for UserAuditEvent entity using Prisma,
 * including audit trail creation and retrieval. Extends RepositoryBase for consistent patterns.
 */

import { PrismaClient, Prisma, UserAuditAction as PrismaUserAuditAction } from '@prisma/client';
import { 
  RepositoryBase, 
  EntityMapper, 
  WhereBuilder,
  textContainsInsensitive,
  rangeFilter
} from '@lawprotect/shared-ts';
import { UserAuditEvent } from '../domain/entities/UserAuditEvent';
import { UserAuditEventId } from '../domain/value-objects/UserAuditEventId';
import { UserAuditEventSpec } from '../domain/interfaces/UserAuditEventSpec';
import { repositoryError } from '../auth-errors/factories';

type AuditRow = Prisma.UserAuditEventGetPayload<{}>;

/**
 * Repository for UserAuditEvent entity persistence
 * 
 * Handles all database operations for UserAuditEvent entity.
 * Extends RepositoryBase to leverage shared repository patterns and Prisma integration.
 */
export class UserAuditEventRepository extends RepositoryBase<UserAuditEvent, UserAuditEventId, UserAuditEventSpec> {
  private static readonly DEFAULT_PAGE_LIMIT = 25;
  
  constructor(protected readonly prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Maps Prisma model to domain entity
   * @param model - Prisma model data
   * @returns Domain entity
   */
  protected toDomain(model: AuditRow): UserAuditEvent {
    try {
      return UserAuditEvent.fromPersistence(model as any);
    } catch (error) {
      throw repositoryError({
        operation: 'toDomain',
        auditEventId: (model as any)?.id,
        cause: error
      });
    }
  }

  protected toCreateModel(entity: UserAuditEvent): Prisma.UserAuditEventUncheckedCreateInput {
    return {
      id: entity.getId(),
      userId: entity.getUserId().toString(),
      action: entity.getAction() as PrismaUserAuditAction,
      description: entity.getDescription(),
      actorId: entity.getActorId(),
      ipAddress: entity.getIpAddress(),
      userAgent: entity.getUserAgent(),
      metadata: entity.getMetadata() as any,
      createdAt: entity.getCreatedAt()
    };
  }

  protected toUpdateModel(patch: Partial<UserAuditEvent> | Record<string, unknown>): Prisma.UserAuditEventUncheckedUpdateInput {
    return EntityMapper.toUpdateModel(patch, [
      { field: 'userId', getter: 'getUserId', valueExtractor: (v: unknown) => (v as any)?.toString?.() },
      { field: 'action', getter: 'getAction' },
      { field: 'description', getter: 'getDescription' },
      { field: 'actorId', getter: 'getActorId' },
      { field: 'ipAddress', getter: 'getIpAddress' },
      { field: 'userAgent', getter: 'getUserAgent' },
      { field: 'metadata', getter: 'getMetadata' }
    ]);
  }

  /**
   * Creates where clause for ID-based queries
   * @param id - Audit event ID
   * @returns Where clause
   */
  protected whereById(id: UserAuditEventId): { id: string } {
    return { id: id.getValue() };
  }

  /**
   * Creates where clause from specification
   * @param spec - Query specification
   * @returns Where clause
   */
  protected whereFromSpec(spec: UserAuditEventSpec): Prisma.UserAuditEventWhereInput {
    const b = new WhereBuilder<Prisma.UserAuditEventWhereInput>(() => this.now());

    // Basic fields
    b.eq('userId', spec.userId)
     .eq('action', spec.action)
     .eq('actorId', spec.actorId)
     .eq('ipAddress', spec.ipAddress);

    // Text search
    if (spec.description) {
      b.and({ description: textContainsInsensitive(spec.description) });
    }
    if (spec.userAgent) {
      b.and({ userAgent: textContainsInsensitive(spec.userAgent) });
    }

    // Date ranges
    const createdRange = rangeFilter(spec.createdBefore, spec.createdAfter);
    if (createdRange) b.and({ createdAt: createdRange });

    return b.build();
  }

  /**
   * Finds an entity by its identifier
   * @param id - Entity identifier
   * @param tx - Optional transactional context
   * @returns The entity if found; otherwise `null`
   */
  async findById(id: UserAuditEventId, tx?: any): Promise<UserAuditEvent | null> {
    try {
      const result = await (tx || this.prisma).userAuditEvent.findUnique({
        where: this.whereById(id)
      });
      return result ? this.toDomain(result) : null;
    } catch (error) {
      throw repositoryError({ operation: 'findById', id: id.getValue(), cause: error });
    }
  }

  /**
   * Creates a new entity
   * @param data - Domain data to persist
   * @param tx - Optional transactional context
   * @returns The created entity
   */
  async create(data: Partial<UserAuditEvent>, tx?: any): Promise<UserAuditEvent> {
    try {
      const entity = data as UserAuditEvent;
      const created = await (tx || this.prisma).userAuditEvent.create({
        data: this.toCreateModel(entity)
      });
      return this.toDomain(created);
    } catch (error) {
      throw repositoryError({ operation: 'create', cause: error });
    }
  }

  /**
   * Updates an existing entity
   * @param id - Entity identifier
   * @param patch - Partial domain changes to apply
   * @param tx - Optional transactional context
   * @returns The updated entity
   */
  async update(id: UserAuditEventId, patch: Partial<UserAuditEvent>, tx?: any): Promise<UserAuditEvent> {
    try {
      const updated = await (tx || this.prisma).userAuditEvent.update({
        where: this.whereById(id),
        data: this.toUpdateModel(patch)
      });
      return this.toDomain(updated);
    } catch (error) {
      throw repositoryError({ operation: 'update', id: id.getValue(), cause: error });
    }
  }

  /**
   * Deletes an entity by its identifier
   * @param id - Entity identifier
   * @param tx - Optional transactional context
   */
  async delete(id: UserAuditEventId, tx?: any): Promise<void> {
    try {
      await (tx || this.prisma).userAuditEvent.delete({
        where: this.whereById(id)
      });
    } catch (error) {
      throw repositoryError({ operation: 'delete', id: id.getValue(), cause: error });
    }
  }

  /**
   * Lists entities by specification with optional cursor pagination
   * @param spec - Query/filter specification
   * @param limit - Page size (maximum number of items to return)
   * @param cursor - Opaque pagination cursor
   * @param tx - Optional transactional context
   * @returns A page of items and an optional `nextCursor` when more results exist
   */
  async list(
    spec: UserAuditEventSpec,
    limit: number,
    cursor?: string,
    tx?: any
  ): Promise<{ items: UserAuditEvent[]; nextCursor?: string }> {
    return this.listWithCursorPagination(
      tx || this.prisma.userAuditEvent,
      spec,
      limit,
      cursor
    );
  }

  /**
   * Finds audit events by user ID with cursor pagination
   * @param userId - User ID
   * @param limit - Page size
   * @param cursor - Optional pagination cursor
   * @returns Page of UserAuditEvent entities
   */
  async findByUserId(
    userId: string,
    limit: number = UserAuditEventRepository.DEFAULT_PAGE_LIMIT,
    cursor?: string
  ): Promise<{ items: UserAuditEvent[]; nextCursor?: string }> {
    return this.list({ userId }, limit, cursor);
  }

  /**
   * Finds audit events by action with cursor pagination
   * @param action - Audit action
   * @param limit - Page size
   * @param cursor - Optional pagination cursor
   * @returns Page of UserAuditEvent entities
   */
  async findByAction(
    action: PrismaUserAuditAction,
    limit: number = UserAuditEventRepository.DEFAULT_PAGE_LIMIT,
    cursor?: string
  ): Promise<{ items: UserAuditEvent[]; nextCursor?: string }> {
    return this.list({ action }, limit, cursor);
  }

  /**
   * Finds audit events by date range with cursor pagination
   * @param startDate - Start date
   * @param endDate - End date
   * @param limit - Page size
   * @param cursor - Optional pagination cursor
   * @returns Page of UserAuditEvent entities
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = UserAuditEventRepository.DEFAULT_PAGE_LIMIT,
    cursor?: string
  ): Promise<{ items: UserAuditEvent[]; nextCursor?: string }> {
    return this.list({ 
      createdAfter: startDate, 
      createdBefore: endDate 
    }, limit, cursor);
  }

  /**
   * Counts audit events by user ID
   * @param userId - User ID
   * @returns Number of audit events
   */
  async countByUserId(userId: string): Promise<number> {
    try {
      return await this.prisma.userAuditEvent.count({
        where: { userId }
      });
    } catch (error) {
      throw repositoryError({ 
        operation: 'countByUserId',
        userId,
        cause: error
      });
    }
  }

  /**
   * Counts audit events by specification
   * @param spec - Query specification
   * @returns Number of audit events matching the specification
   */
  async countBySpec(spec: UserAuditEventSpec): Promise<number> {
    try {
      return await this.prisma.userAuditEvent.count({
        where: this.whereFromSpec(spec)
      });
    } catch (error) {
      throw repositoryError({ 
        operation: 'countBySpec',
        spec,
        cause: error
      });
    }
  }
}
