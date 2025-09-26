/**
 * @fileoverview SignatureAuditEventRepository - Repository for SignatureAuditEvent entity operations
 * @summary Handles all database operations for audit events using Prisma
 * @description This repository provides comprehensive data access methods for audit events,
 * including CRUD operations, compliance queries, and audit trail management. It follows
 * the repository pattern and extends RepositoryBase for consistent data access patterns.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { RepositoryBase, Page, decodeCursor, listPage, textContainsInsensitive, rangeFilter } from '@lawprotect/shared-ts';
import { SignatureAuditEvent } from '../domain/entities/SignatureAuditEvent';
import { SignatureAuditEventId } from '../domain/value-objects/SignatureAuditEventId';
import { AuditSpec } from '../domain/types/audit';
import { repositoryError } from '../signature-errors';

type AuditRow = Prisma.SignatureAuditEventGetPayload<{}>;

/**
 * Repository for managing SignatureAuditEvent entities
 * 
 * This repository handles all database operations for audit events, including
 * CRUD operations, compliance queries, and audit trail management. It provides
 * methods for finding events by various criteria, generating audit reports, and managing
 * audit trail for compliance and security purposes.
 */
export class SignatureAuditEventRepository extends RepositoryBase<SignatureAuditEvent, SignatureAuditEventId, AuditSpec> {
  private static readonly DEFAULT_PAGE_LIMIT = 25;
  
  constructor(protected readonly prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Maps Prisma model to domain entity
   * @param model - Prisma model data
   * @returns Domain entity
   */
  protected toDomain(model: AuditRow | unknown): SignatureAuditEvent {
    try {
      return SignatureAuditEvent.fromPersistence(model as any);
    } catch (error) {
      throw repositoryError({
        operation: 'toDomain',
        auditEventId: (model as any)?.id,
        cause: error
      });
    }
  }

  protected toCreateModel(entity: SignatureAuditEvent): Prisma.SignatureAuditEventUncheckedCreateInput {
    return {
      id: entity.getId().getValue(),
      envelopeId: entity.getEnvelopeId().getValue(),
      signerId: entity.getSignerId()?.getValue() ?? null,
      eventType: entity.getEventType(),
      description: entity.getDescription(),
      userId: entity.getUserId(),
      userEmail: entity.getUserEmail(),
      ipAddress: entity.getIpAddress(),
      userAgent: entity.getUserAgent(),
      country: entity.getCountry(),
      metadata: entity.getMetadata() as any,
      createdAt: entity.getCreatedAt()
    };
  }

  protected toUpdateModel(patch: Partial<SignatureAuditEvent> | Record<string, unknown>): Prisma.SignatureAuditEventUncheckedUpdateInput {
    const p: any = patch;
    const out: any = {};
    const has = (k: string) => Object.prototype.hasOwnProperty.call(p, k);
    const set = (k: string, v: unknown) => { if (v !== undefined) out[k] = v; };

    set('envelopeId', p.getEnvelopeId?.()?.getValue?.() ?? (has('envelopeId') ? p.envelopeId : undefined));
    const signerIdGetter = p.getSignerId?.();
    const signerIdValue = signerIdGetter?.getValue?.();
    if (signerIdGetter !== undefined) {
      out.signerId = signerIdValue ?? null;
    } else if (has('signerId')) {
      out.signerId = p.signerId;
    }
    set('eventType', p.getEventType?.() ?? (has('eventType') ? p.eventType : undefined));
    set('description', p.getDescription?.() ?? (has('description') ? p.description : undefined));
    set('userId', p.getUserId?.() ?? (has('userId') ? p.userId : undefined));
    set('userEmail', p.getUserEmail?.() ?? (has('userEmail') ? p.userEmail : undefined));
    set('ipAddress', p.getIpAddress?.() ?? (has('ipAddress') ? p.ipAddress : undefined));
    set('userAgent', p.getUserAgent?.() ?? (has('userAgent') ? p.userAgent : undefined));
    set('country', p.getCountry?.() ?? (has('country') ? p.country : undefined));
    set('metadata', p.getMetadata?.() ?? (has('metadata') ? p.metadata : undefined));


    return out;
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
  protected whereFromSpec(spec: AuditSpec): Prisma.SignatureAuditEventWhereInput {
    const AND: Prisma.SignatureAuditEventWhereInput[] = [];
    const push = (c: Prisma.SignatureAuditEventWhereInput) => AND.push(c);

    if (spec.envelopeId) push({ envelopeId: spec.envelopeId });
    if (spec.signerId) push({ signerId: spec.signerId });
    if (spec.eventType) push({ eventType: spec.eventType });
    if (spec.userId) push({ userId: spec.userId });
    if (spec.userEmail) push({ userEmail: spec.userEmail });
    if (spec.ipAddress) push({ ipAddress: spec.ipAddress });
    if (spec.country) push({ country: spec.country });

    if (spec.userAgent) push({ userAgent: textContainsInsensitive(spec.userAgent) });
    if (spec.description) push({ description: textContainsInsensitive(spec.description) });

    const createdRange = rangeFilter(spec.createdBefore, spec.createdAfter);
    if (createdRange) push({ createdAt: createdRange });

    return AND.length ? { AND } : {};
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
      throw repositoryError({
        operation: 'findById',
        auditEventId: id.getValue(),
        cause: error
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
        data: this.toCreateModel(entity)
      });

      return this.toDomain(created);
    } catch (error) {
      throw repositoryError({
        operation: 'create',
        auditEventId: entity.getId().getValue(),
        cause: error
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
        data: this.toUpdateModel(entity)
      });

      return this.toDomain(updated);
    } catch (error) {
      throw repositoryError({
        operation: 'update',
        auditEventId: id.getValue(),
        cause: error
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
      throw repositoryError({
        operation: 'delete',
        auditEventId: id.getValue(),
        cause: error
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
      type Decoded = { createdAt: string | Date; id: string } | undefined;
      const decoded = cursor ? decodeCursor<Decoded>(cursor) : undefined;

      const cfg = {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] as Array<Record<string, 'asc'|'desc'>>,
        cursorFields: ['createdAt', 'id'] as string[],
        normalizeCursor: (d?: { createdAt: string | Date; id: string }) =>
          d ? { id: d.id, createdAt: d.createdAt instanceof Date ? d.createdAt : new Date(d.createdAt) } : undefined,
      };

      const { rows, nextCursor } = await listPage(this.prisma.signatureAuditEvent, where, limit, decoded, cfg);
      return { items: rows.map(r => this.toDomain(r as AuditRow)), nextCursor };
    } catch (error) {
      throw repositoryError({ operation: 'list', spec, cause: error });
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
        orderBy: { createdAt: 'desc' }
      });

      return auditEvents.map((auditEvent: any) => this.toDomain(auditEvent));
    } catch (error) {
      throw repositoryError({
        operation: 'getAllByEnvelope',
        envelopeId,
        cause: error
      });
    }
  }
}
