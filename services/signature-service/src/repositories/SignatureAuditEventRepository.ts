/**
 * @fileoverview SignatureAuditEventRepository - Repository for SignatureAuditEvent entity operations
 * @summary Handles all database operations for audit events using Prisma
 * @description This repository provides comprehensive data access methods for audit events,
 * including CRUD operations, compliance queries, and audit trail management. It follows
 * the repository pattern and extends RepositoryBase for consistent data access patterns.
 */

import { PrismaClient } from '@prisma/client';
import { RepositoryBase, Page, RepositoryFactory } from '@lawprotect/shared-ts';
import { SignatureAuditEvent } from '../domain/entities/SignatureAuditEvent';
import { SignatureAuditEventId } from '../domain/value-objects/SignatureAuditEventId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { SignerId } from '../domain/value-objects/SignerId';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { AuditSpec } from '../domain/types/audit';
import { 
  documentS3Error,
  invalidEntity
} from '../signature-errors';

/**
 * Repository for managing SignatureAuditEvent entities
 * 
 * This repository handles all database operations for audit events, including
 * CRUD operations, compliance queries, and audit trail management. It provides
 * methods for finding events by various criteria, generating audit reports, and managing
 * audit trail for compliance and security purposes.
 */
export class SignatureAuditEventRepository extends RepositoryBase<SignatureAuditEvent, SignatureAuditEventId, AuditSpec> {
  private static readonly PAGINATION_OFFSET = 1;
  private static readonly SLICE_START_INDEX = 0;
  private static readonly SLICE_LAST_INDEX = -1;

  private static readonly DEFAULT_PAGE_LIMIT = 25;
  
  constructor(protected readonly prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Maps Prisma model to domain entity
   * @param model - Prisma model data
   * @returns Domain entity
   */
  protected toDomain(model: unknown): SignatureAuditEvent {
    try {
      return SignatureAuditEvent.fromPersistence(model as any);
    } catch (error) {
      console.error('Failed to map audit event from persistence', {
        error: error instanceof Error ? error.message : error,
        auditEventId: (model as any)?.id
      });
      throw documentS3Error({
        operation: 'toDomain',
        auditEventId: (model as any)?.id,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  protected toCreateModel(entity: SignatureAuditEvent): any {
    return {
      id: entity.getId().getValue(),
      envelopeId: entity.getEnvelopeId().getValue(),
      signerId: entity.getSignerId()?.getValue(),
      eventType: entity.getEventType(),
      eventData: entity.getMetadata(),
      userId: entity.getUserId(),
      ipAddress: entity.getIpAddress(),
      userAgent: entity.getUserAgent(),
      timestamp: entity.getCreatedAt()
    };
  }

  protected toUpdateModel(patch: Partial<SignatureAuditEvent> | Record<string, unknown>): any {
    const p: any = patch;
    const out: any = {};
    const has = (k: string) => Object.prototype.hasOwnProperty.call(p, k);
    const set = (k: string, v: unknown) => { if (v !== undefined) out[k] = v; };

    set('envelopeId', p.getEnvelopeId?.()?.getValue?.() ?? (has('envelopeId') ? p.envelopeId : undefined));
    set('signerId', p.getSignerId?.()?.getValue?.() ?? (has('signerId') ? p.signerId : undefined));
    set('eventType', p.getEventType?.() ?? (has('eventType') ? p.eventType : undefined));
    set('eventData', p.getMetadata?.() ?? (has('eventData') ? p.eventData : undefined));
    set('userId', p.getUserId?.() ?? (has('userId') ? p.userId : undefined));
    set('ipAddress', p.getIpAddress?.() ?? (has('ipAddress') ? p.ipAddress : undefined));
    set('userAgent', p.getUserAgent?.() ?? (has('userAgent') ? p.userAgent : undefined));
    set('timestamp', p.getCreatedAt?.() ?? (has('timestamp') ? p.timestamp : undefined));

    return out;
  }

  /**
   * Maps domain entity to Prisma model
   * @param entity - Domain entity
   * @returns Prisma model data
   */
  protected toModel(entity: Partial<SignatureAuditEvent>): unknown {
    if (!entity || typeof entity.getId !== 'function') {
      throw invalidEntity({
        operation: 'toModel',
        reason: 'Entity missing getId method or is null/undefined'
      });
    }

    return {
      id: entity.getId?.()?.getValue(),
      envelopeId: entity.getEnvelopeId?.()?.getValue(),
      signerId: entity.getSignerId?.()?.getValue(),
      eventType: entity.getEventType?.(),
      description: entity.getDescription?.(),
      userId: entity.getUserId?.(),
      userEmail: entity.getUserEmail?.(),
      ipAddress: entity.getIpAddress?.(),
      userAgent: entity.getUserAgent?.(),
      country: entity.getCountry?.(),
      metadata: entity.getMetadata?.(),
      createdAt: entity.getCreatedAt?.()
    };
  }

  /**
   * Creates where clause for ID-based queries
   * @param id - Audit event ID
   * @returns Where clause
   */
  protected whereById(id: SignatureAuditEventId): { id: string } {
    return { id: id.getValue() };
  }

  /**
   * Creates where clause from specification
   * @param spec - Query specification
   * @returns Where clause
   */
  protected whereFromSpec(spec: AuditSpec): any {
    const where: any = {};

    if (spec.envelopeId) {
      where.envelopeId = spec.envelopeId;
    }
    if (spec.signerId) {
      where.signerId = spec.signerId;
    }
    if (spec.eventType) {
      where.eventType = spec.eventType;
    }
    if (spec.userId) {
      where.userId = spec.userId;
    }
    if (spec.userEmail) {
      where.userEmail = spec.userEmail;
    }
    if (spec.ipAddress) {
      where.ipAddress = spec.ipAddress;
    }
    if (spec.userAgent) {
      where.userAgent = { contains: spec.userAgent };
    }
    if (spec.country) {
      where.country = spec.country;
    }
    if (spec.description) {
      where.description = { contains: spec.description };
    }
    if (spec.createdBefore) {
      where.createdAt = { ...where.createdAt, lt: spec.createdBefore };
    }
    if (spec.createdAfter) {
      where.createdAt = { ...where.createdAt, gte: spec.createdAfter };
    }

    return where;
  }

  /**
   * Finds an audit event by ID
   * @param id - Audit event ID
   * @returns Audit event entity or null
   */
  async findById(id: SignatureAuditEventId): Promise<SignatureAuditEvent | null> {
    try {
      const auditEvent = await this.prisma.signatureAuditEvent.findUnique({
        where: this.whereById(id)
      });

      return auditEvent ? this.toDomain(auditEvent) : null;
    } catch (error) {
      console.error('Failed to find audit event by ID', {
        error: error instanceof Error ? error.message : error,
        auditEventId: id.getValue()
      });
      throw documentS3Error({
        operation: 'findById',
        auditEventId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Creates a new audit event
   * @param entity - Audit event entity
   * @returns Created audit event entity
   */
  async create(entity: SignatureAuditEvent): Promise<SignatureAuditEvent> {
    try {
      const created = await this.prisma.signatureAuditEvent.create({
        data: this.toModel(entity) as any
      });

      return this.toDomain(created);
    } catch (error) {
      console.error('Failed to create audit event', {
        error: error instanceof Error ? error.message : error,
        auditEventId: entity.getId().getValue()
      });
      throw documentS3Error({
        operation: 'create',
        auditEventId: entity.getId().getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Updates an audit event (rarely used as audit events are typically immutable)
   * @param id - Audit event ID
   * @param entity - Updated audit event entity
   * @returns Updated audit event entity
   */
  async update(id: SignatureAuditEventId, entity: Partial<SignatureAuditEvent>): Promise<SignatureAuditEvent> {
    try {
      const updated = await this.prisma.signatureAuditEvent.update({
        where: this.whereById(id),
        data: this.toModel(entity) as any
      });

      return this.toDomain(updated);
    } catch (error) {
      console.error('Failed to update audit event', {
        error: error instanceof Error ? error.message : error,
        auditEventId: id.getValue()
      });
      throw documentS3Error({
        operation: 'update',
        auditEventId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Deletes an audit event (rarely used as audit events are typically immutable)
   * @param id - Audit event ID
   */
  async delete(id: SignatureAuditEventId): Promise<void> {
    try {
      await this.prisma.signatureAuditEvent.delete({
        where: this.whereById(id)
      });
    } catch (error) {
      console.error('Failed to delete audit event', {
        error: error instanceof Error ? error.message : error,
        auditEventId: id.getValue()
      });
      throw documentS3Error({
        operation: 'delete',
        auditEventId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Lists audit events with pagination
   * @param spec - Query specification
   * @param limit - Maximum number of results
   * @param cursor - Pagination cursor
   * @returns Page of audit event entities
   */
  async list(spec: AuditSpec, limit: number = SignatureAuditEventRepository.DEFAULT_PAGE_LIMIT, cursor?: string): Promise<Page<SignatureAuditEvent>> {
    try {
      const where = this.whereFromSpec(spec);
      
      const auditEvents = await this.prisma.signatureAuditEvent.findMany({
        where,
        take: limit + SignatureAuditEventRepository.PAGINATION_OFFSET,
        cursor: cursor ? RepositoryFactory.decodeCursor(cursor) as any : undefined,
        orderBy: { createdAt: 'desc' }
      });

      const hasNextPage = auditEvents.length > limit;
      const results = hasNextPage ? auditEvents.slice(SignatureAuditEventRepository.SLICE_START_INDEX, limit) : auditEvents;
      const nextCursor = hasNextPage ? RepositoryFactory.createCursor(results[results.length + SignatureAuditEventRepository.SLICE_LAST_INDEX], ['id']) : undefined;

      return {
        items: results.map((auditEvent: any) => this.toDomain(auditEvent)),
        nextCursor
      };
    } catch (error) {
      console.error('Failed to list audit events', {
        error: error instanceof Error ? error.message : error,
        spec
      });
      throw documentS3Error({
        operation: 'list',
        spec,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Gets audit trail for an envelope
   * @param envelopeId - Envelope ID
   * @param limit - Maximum number of results
   * @param cursor - Optional cursor for pagination
   * @returns Page of audit event entities
   */
  async listByEnvelope(envelopeId: string, limit: number, cursor?: string): Promise<Page<SignatureAuditEvent>> {
    try {
      const whereClause: any = {
        envelopeId
      };
      
      if (cursor) {
        const cursorData = RepositoryFactory.decodeCursor<{ id: string }>(cursor);
        if (cursorData?.id) {
          whereClause.id = { lt: cursorData.id };
        }
      }

      const auditEvents = await this.prisma.signatureAuditEvent.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit + SignatureAuditEventRepository.PAGINATION_OFFSET
      });

      const hasNextPage = auditEvents.length > limit;
      const results = hasNextPage ? auditEvents.slice(SignatureAuditEventRepository.SLICE_START_INDEX, limit) : auditEvents;
      const nextCursor = hasNextPage ? RepositoryFactory.createCursor(results[results.length + SignatureAuditEventRepository.SLICE_LAST_INDEX], ['id']) : undefined;

      return {
        items: results.map((auditEvent: any) => this.toDomain(auditEvent)),
        nextCursor
      };
    } catch (error) {
      console.error('Failed to list audit events by envelope', {
        error: error instanceof Error ? error.message : error,
        envelopeId,
        limit,
        cursor
      });
      throw documentS3Error({
        operation: 'listByEnvelope',
        envelopeId,
        limit,
        cursor,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Gets all audit events for an envelope (no pagination)
   * @param envelopeId - Envelope ID
   * @returns Array of all audit event entities
   */
  async getAllByEnvelope(envelopeId: string): Promise<SignatureAuditEvent[]> {
    try {
      const auditEvents = await this.prisma.signatureAuditEvent.findMany({
        where: { envelopeId },
        orderBy: { createdAt: 'desc' } // Más recientes primero
      });

      return auditEvents.map((auditEvent: any) => this.toDomain(auditEvent));
    } catch (error) {
      console.error('Failed to get all audit events by envelope', {
        error: error instanceof Error ? error.message : error,
        envelopeId
      });
      throw documentS3Error({
        operation: 'getAllByEnvelope',
        envelopeId,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Gets audit trail for a user
   * @param userId - User ID
   * @param limit - Maximum number of results
   * @param cursor - Optional cursor for pagination
   * @returns Page of audit event entities
   */
  async listByUser(userId: string, limit: number, cursor?: string): Promise<Page<SignatureAuditEvent>> {
    try {
      const whereClause: any = {
        userId
      };
      
      if (cursor) {
        const cursorData = RepositoryFactory.decodeCursor<{ id: string }>(cursor);
        if (cursorData?.id) {
          whereClause.id = { lt: cursorData.id };
        }
      }

      const auditEvents = await this.prisma.signatureAuditEvent.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit + SignatureAuditEventRepository.PAGINATION_OFFSET
      });

      const hasNextPage = auditEvents.length > limit;
      const results = hasNextPage ? auditEvents.slice(SignatureAuditEventRepository.SLICE_START_INDEX, limit) : auditEvents;
      const nextCursor = hasNextPage ? RepositoryFactory.createCursor(results[results.length + SignatureAuditEventRepository.SLICE_LAST_INDEX], ['id']) : undefined;

      return {
        items: results.map((auditEvent: any) => this.toDomain(auditEvent)),
        nextCursor
      };
    } catch (error) {
      console.error('Failed to list audit events by user', {
        error: error instanceof Error ? error.message : error,
        userId,
        limit,
        cursor
      });
      throw documentS3Error({
        operation: 'listByUser',
        userId,
        limit,
        cursor,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Gets audit events by event type
   * @param eventType - Event type
   * @param limit - Maximum number of results
   * @param cursor - Optional cursor for pagination
   * @returns Page of audit event entities
   */
  async listByEventType(eventType: AuditEventType, limit: number, cursor?: string): Promise<Page<SignatureAuditEvent>> {
    try {
      const whereClause: any = {
        eventType
      };
      
      if (cursor) {
        const cursorData = RepositoryFactory.decodeCursor<{ id: string }>(cursor);
        if (cursorData?.id) {
          whereClause.id = { lt: cursorData.id };
        }
      }

      const auditEvents = await this.prisma.signatureAuditEvent.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit + SignatureAuditEventRepository.PAGINATION_OFFSET
      });

      const hasNextPage = auditEvents.length > limit;
      const results = hasNextPage ? auditEvents.slice(SignatureAuditEventRepository.SLICE_START_INDEX, limit) : auditEvents;
      const nextCursor = hasNextPage ? RepositoryFactory.createCursor(results[results.length + SignatureAuditEventRepository.SLICE_LAST_INDEX], ['id']) : undefined;

      return {
        items: results.map((auditEvent: any) => this.toDomain(auditEvent)),
        nextCursor
      };
    } catch (error) {
      console.error('Failed to list audit events by event type', {
        error: error instanceof Error ? error.message : error,
        eventType,
        limit,
        cursor
      });
      throw documentS3Error({
        operation: 'listByEventType',
        eventType,
        limit,
        cursor,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Finds audit events by envelope ID
   * @param envelopeId - Envelope ID
   * @returns Array of audit event entities
   */
  async findByEnvelopeId(envelopeId: EnvelopeId): Promise<SignatureAuditEvent[]> {
    try {
      const auditEvents = await this.prisma.signatureAuditEvent.findMany({
        where: { envelopeId: envelopeId.getValue() },
        orderBy: { createdAt: 'desc' }
      });

      return auditEvents.map((auditEvent: any) => this.toDomain(auditEvent));
    } catch (error) {
      console.error('Failed to find audit events by envelope ID', {
        error: error instanceof Error ? error.message : error,
        envelopeId: envelopeId.getValue()
      });
      throw documentS3Error({
        operation: 'findByEnvelopeId',
        envelopeId: envelopeId.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Finds audit events by signer ID
   * @param signerId - Signer ID
   * @returns Array of audit event entities
   */
  async findBySignerId(signerId: SignerId): Promise<SignatureAuditEvent[]> {
    try {
      const auditEvents = await this.prisma.signatureAuditEvent.findMany({
        where: { signerId: signerId.getValue() },
        orderBy: { createdAt: 'desc' }
      });

      return auditEvents.map((auditEvent: any) => this.toDomain(auditEvent));
    } catch (error) {
      console.error('Failed to find audit events by signer ID', {
        error: error instanceof Error ? error.message : error,
        signerId: signerId.getValue()
      });
      throw documentS3Error({
        operation: 'findBySignerId',
        signerId: signerId.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Finds audit events by IP address
   * @param ipAddress - IP address
   * @returns Array of audit event entities
   */
  async findByIpAddress(ipAddress: string): Promise<SignatureAuditEvent[]> {
    try {
      const auditEvents = await this.prisma.signatureAuditEvent.findMany({
        where: { ipAddress },
        orderBy: { createdAt: 'desc' }
      });

      return auditEvents.map((auditEvent: any) => this.toDomain(auditEvent));
    } catch (error) {
      console.error('Failed to find audit events by IP address', {
        error: error instanceof Error ? error.message : error,
        ipAddress
      });
      throw documentS3Error({
        operation: 'findByIpAddress',
        ipAddress,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Finds audit events by user agent
   * @param userAgent - User agent string
   * @returns Array of audit event entities
   */
  async findByUserAgent(userAgent: string): Promise<SignatureAuditEvent[]> {
    try {
      const auditEvents = await this.prisma.signatureAuditEvent.findMany({
        where: { userAgent: { contains: userAgent } },
        orderBy: { createdAt: 'desc' }
      });

      return auditEvents.map((auditEvent: any) => this.toDomain(auditEvent));
    } catch (error) {
      console.error('Failed to find audit events by user agent', {
        error: error instanceof Error ? error.message : error,
        userAgent
      });
      throw documentS3Error({
        operation: 'findByUserAgent',
        userAgent,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Finds audit events by timestamp range
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of audit event entities
   */
  async findByTimestampRange(startDate: Date, endDate: Date): Promise<SignatureAuditEvent[]> {
    try {
      const auditEvents = await this.prisma.signatureAuditEvent.findMany({
        where: { 
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return auditEvents.map((auditEvent: any) => this.toDomain(auditEvent));
    } catch (error) {
      console.error('Failed to find audit events by timestamp range', {
        error: error instanceof Error ? error.message : error,
        startDate,
        endDate
      });
      throw documentS3Error({
        operation: 'findByTimestampRange',
        startDate,
        endDate,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Counts audit events by envelope ID
   * @param envelopeId - Envelope ID
   * @returns Number of audit events
   */
  async countByEnvelopeId(envelopeId: EnvelopeId): Promise<number> {
    try {
      return await this.prisma.signatureAuditEvent.count({
        where: { envelopeId: envelopeId.getValue() }
      });
    } catch (error) {
      console.error('Failed to count audit events by envelope ID', {
        error: error instanceof Error ? error.message : error,
        envelopeId: envelopeId.getValue()
      });
      throw documentS3Error({
        operation: 'countByEnvelopeId',
        envelopeId: envelopeId.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Gets audit events by event type
   * @param eventType - Event type
   * @returns Array of audit event entities
   */
  async findByEventType(eventType: AuditEventType): Promise<SignatureAuditEvent[]> {
    try {
      const auditEvents = await this.prisma.signatureAuditEvent.findMany({
        where: { eventType },
        orderBy: { createdAt: 'desc' }
      });

      return auditEvents.map((auditEvent: any) => this.toDomain(auditEvent));
    } catch (error) {
      console.error('Failed to find audit events by event type', {
        error: error instanceof Error ? error.message : error,
        eventType
      });
      throw documentS3Error({
        operation: 'findByEventType',
        eventType,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }
}
