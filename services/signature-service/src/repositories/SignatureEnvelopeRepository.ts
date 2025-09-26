/**
 * @fileoverview SignatureEnvelopeRepository - Repository for SignatureEnvelope entity operations
 * @summary Provides data access operations for SignatureEnvelope aggregate root
 * @description This repository handles all database operations for SignatureEnvelope entities,
 * including CRUD operations, complex queries with relations, and business-specific searches.
 * It extends RepositoryBase to provide consistent data access patterns and uses Prisma for PostgreSQL operations.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { RepositoryBase, Page, decodeCursor, listPage } from '@lawprotect/shared-ts';
import { SignatureEnvelope } from '../domain/entities/SignatureEnvelope';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { S3Key } from '../domain/value-objects/S3Key';
import { DocumentHash } from '../domain/value-objects/DocumentHash';
import { EnvelopeSpec, Hashes } from '../domain/types/envelope';
import { repositoryError } from '../signature-errors';

const ENVELOPE_INCLUDE = { signers: { orderBy: { order: 'asc' } } } as const;
type EnvelopeWithIncludes = Prisma.SignatureEnvelopeGetPayload<{ include: typeof ENVELOPE_INCLUDE }>;

/**
 * SignatureEnvelopeRepository - Repository for SignatureEnvelope operations
 * 
 * Provides comprehensive data access operations for the SignatureEnvelope aggregate root,
 * including CRUD operations, complex queries with relations, and business-specific searches.
 * Extends RepositoryBase to leverage shared repository patterns and Prisma integration.
 */
export class SignatureEnvelopeRepository extends RepositoryBase<SignatureEnvelope, EnvelopeId, EnvelopeSpec> {
  constructor(protected readonly prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Maps Prisma model to domain entity
   * @param model - Prisma SignatureEnvelope model
   * @returns SignatureEnvelope domain entity
   */
  protected toDomain(model: EnvelopeWithIncludes | unknown): SignatureEnvelope {
    try {
      return SignatureEnvelope.fromPersistence(model as any);
    } catch (cause) {
      throw repositoryError({ 
        operation: 'toDomain', 
        envelopeId: (model as any)?.id, 
        cause 
      });
    }
  }

  protected toCreateModel(entity: SignatureEnvelope): Prisma.SignatureEnvelopeUncheckedCreateInput {
    return {
      id: entity.getId().getValue(),
      createdBy: entity.getCreatedBy(),
      title: entity.getTitle(),
      description: entity.getDescription(),
      status: entity.getStatus().getValue(),
      signingOrderType: entity.getSigningOrder()?.getType(),
      originType: entity.getOrigin()?.getType(),
      templateId: entity.getTemplateId(),
      templateVersion: entity.getTemplateVersion(),
      sourceKey: entity.getSourceKey()?.getValue(),
      metaKey: entity.getMetaKey()?.getValue(),
      flattenedKey: entity.getFlattenedKey()?.getValue(),
      signedKey: entity.getSignedKey()?.getValue(),
      sourceSha256: entity.getSourceSha256()?.getValue(),
      flattenedSha256: entity.getFlattenedSha256()?.getValue(),
      signedSha256: entity.getSignedSha256()?.getValue(),
      sentAt: entity.getSentAt(),
      completedAt: entity.getCompletedAt(),
      cancelledAt: entity.getCancelledAt(),
      declinedAt: entity.getDeclinedAt(),
      declinedBySignerId: entity.getDeclinedBySignerId()?.getValue(),
      declinedReason: entity.getDeclinedReason(),
      expiresAt: entity.getExpiresAt()
    };
  }

  protected toUpdateModel(patch: Partial<SignatureEnvelope> | Record<string, unknown>): Prisma.SignatureEnvelopeUncheckedUpdateInput {
    const p: any = patch;
    const out: Prisma.SignatureEnvelopeUncheckedUpdateInput = {};
    const has = (k: string) => Object.prototype.hasOwnProperty.call(p, k);
    const set = (k: string, v: unknown) => { if (v !== undefined) (out as any)[k] = v; };

    set('createdBy', p.getCreatedBy?.() ?? (has('createdBy') ? p.createdBy : undefined));
    set('title', p.getTitle?.() ?? (has('title') ? p.title : undefined));
    set('description', p.getDescription?.() ?? (has('description') ? p.description : undefined));
    set('status', p.getStatus?.()?.getValue?.() ?? (has('status') ? p.status : undefined));
    set('signingOrderType', p.getSigningOrder?.()?.getType?.() ?? (has('signingOrderType') ? p.signingOrderType : undefined));
    set('originType', p.getOrigin?.()?.getType?.() ?? (has('originType') ? p.originType : undefined));
    set('templateId', p.getTemplateId?.() ?? (has('templateId') ? p.templateId : undefined));
    set('templateVersion', p.getTemplateVersion?.() ?? (has('templateVersion') ? p.templateVersion : undefined));
    set('sourceKey', p.getSourceKey?.()?.getValue?.() ?? (has('sourceKey') ? p.sourceKey : undefined));
    set('metaKey', p.getMetaKey?.()?.getValue?.() ?? (has('metaKey') ? p.metaKey : undefined));
    set('flattenedKey', p.getFlattenedKey?.()?.getValue?.() ?? (has('flattenedKey') ? p.flattenedKey : undefined));
    set('signedKey', p.getSignedKey?.()?.getValue?.() ?? (has('signedKey') ? p.signedKey : undefined));
    set('sourceSha256', p.getSourceSha256?.()?.getValue?.() ?? (has('sourceSha256') ? p.sourceSha256 : undefined));
    set('flattenedSha256', p.getFlattenedSha256?.()?.getValue?.() ?? (has('flattenedSha256') ? p.flattenedSha256 : undefined));
    set('signedSha256', p.getSignedSha256?.()?.getValue?.() ?? (has('signedSha256') ? p.signedSha256 : undefined));
    set('sentAt', p.getSentAt?.() ?? (has('sentAt') ? p.sentAt : undefined));
    set('completedAt', p.getCompletedAt?.() ?? (has('completedAt') ? p.completedAt : undefined));
    set('cancelledAt', p.getCancelledAt?.() ?? (has('cancelledAt') ? p.cancelledAt : undefined));
    set('declinedAt', p.getDeclinedAt?.() ?? (has('declinedAt') ? p.declinedAt : undefined));
    set('declinedBySignerId', p.getDeclinedBySignerId?.()?.getValue?.() ?? (has('declinedBySignerId') ? p.declinedBySignerId : undefined));
    set('declinedReason', p.getDeclinedReason?.() ?? (has('declinedReason') ? p.declinedReason : undefined));
    set('expiresAt', p.getExpiresAt?.() ?? (has('expiresAt') ? p.expiresAt : undefined));

    return out;
  }

  /**
   * Maps domain entity to Prisma model
   * @param entity - SignatureEnvelope domain entity
   * @returns Prisma SignatureEnvelope model
   */
  protected toModel(entity: Partial<SignatureEnvelope>): unknown {
    if (!entity || typeof entity.getId !== 'function') {
      throw repositoryError({
        operation: 'toModel',
        cause: new Error('Entity missing getId method or is null/undefined')
      });
    }
    
    return {
      id: entity.getId?.()?.getValue(),
      createdBy: entity.getCreatedBy?.(),
      title: entity.getTitle?.(),
      description: entity.getDescription?.(),
      status: entity.getStatus?.()?.getValue(),
      signingOrderType: entity.getSigningOrder?.()?.getType(),
      originType: entity.getOrigin?.()?.getType(),
      templateId: entity.getTemplateId?.(),
      templateVersion: entity.getTemplateVersion?.(),
      sourceKey: entity.getSourceKey?.()?.getValue(),
      metaKey: entity.getMetaKey?.()?.getValue(),
      flattenedKey: entity.getFlattenedKey?.()?.getValue(),
      signedKey: entity.getSignedKey?.()?.getValue(),
      sourceSha256: entity.getSourceSha256?.()?.getValue(),
      flattenedSha256: entity.getFlattenedSha256?.()?.getValue(),
      signedSha256: entity.getSignedSha256?.()?.getValue(),
      sentAt: entity.getSentAt?.(),
      completedAt: entity.getCompletedAt?.(),
      cancelledAt: entity.getCancelledAt?.(),
      declinedAt: entity.getDeclinedAt?.(),
      declinedBySignerId: entity.getDeclinedBySignerId?.()?.getValue(),
      declinedReason: entity.getDeclinedReason?.(),
      expiresAt: entity.getExpiresAt?.(),
      createdAt: entity.getCreatedAt?.(),
      updatedAt: entity.getUpdatedAt?.()
    };
  }

  /**
   * Builds a persistence-level filter for a primary identifier
   * @param id - Entity identifier
   * @returns Prisma where clause
   */
  protected whereById(id: EnvelopeId): Prisma.SignatureEnvelopeWhereUniqueInput {
    return { id: id.getValue() };
  }

  /**
   * Builds a persistence-level filter from a query specification
   * @param spec - Query/filter specification
   * @returns Prisma where clause
   */
  protected whereFromSpec(spec: EnvelopeSpec): Prisma.SignatureEnvelopeWhereInput {
    const AND: Prisma.SignatureEnvelopeWhereInput[] = [];
    const OR: Prisma.SignatureEnvelopeWhereInput[] = [];

    if (spec.createdBy) AND.push({ createdBy: spec.createdBy });
    if (spec.status) AND.push({ status: spec.status.getValue() });
    if (spec.title) AND.push({ title: spec.title });

    if (spec.isExpired !== undefined) {
      if (spec.isExpired) {
        OR.push({ expiresAt: { lt: new Date() } });
      } else {
        AND.push({ OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] });
      }
    }

    const where: Prisma.SignatureEnvelopeWhereInput = {};
    if (AND.length) where.AND = AND;
    if (OR.length) where.OR = OR;
    return where;
  }

  /**
   * Finds an entity by its identifier
   * @param id - Entity identifier
   * @param tx - Optional transactional context
   * @returns The entity if found; otherwise null
   */
  async findById(id: EnvelopeId, tx?: Prisma.TransactionClient): Promise<SignatureEnvelope | null> {
    const client = tx ?? this.prisma;
    
    try {
      const envelope = await client.signatureEnvelope.findUnique({
        where: this.whereById(id),
        include: ENVELOPE_INCLUDE
      });

      return envelope ? this.toDomain(envelope) : null;
    } catch (cause) {
      throw repositoryError({
        operation: 'findById',
        envelopeId: id.getValue(),
        cause
      });
    }
  }

  /**
   * Creates a new entity
   * @param data - Domain data to persist
   * @param tx - Optional transactional context
   * @returns The created entity
   */
  async create(data: Partial<SignatureEnvelope>, tx?: Prisma.TransactionClient): Promise<SignatureEnvelope> {
    const client = tx ?? this.prisma;
    
    try {
      const envelopeData = this.toCreateModel(data as SignatureEnvelope);
      const created = await client.signatureEnvelope.create({
        data: envelopeData,
        include: ENVELOPE_INCLUDE
      });

      return this.toDomain(created);
    } catch (cause) {
      throw repositoryError({
        operation: 'create',
        envelopeId: data.getId?.()?.getValue(),
        cause
      });
    }
  }

  /**
   * Updates an existing entity
   * @param id - Entity identifier
   * @param patch - Partial domain changes to apply
   * @param tx - Optional transactional context
   * @returns The updated entity
   */
  async update(id: EnvelopeId, patch: Partial<SignatureEnvelope>, tx?: Prisma.TransactionClient): Promise<SignatureEnvelope> {
    const client = tx ?? this.prisma;
    
    try {
      const updateData = this.toUpdateModel(patch);

      const updated = await client.signatureEnvelope.update({
        where: this.whereById(id),
        data: updateData,
        include: ENVELOPE_INCLUDE
      });

      return this.toDomain(updated);
    } catch (cause) {
      throw repositoryError({
        operation: 'update',
        envelopeId: id.getValue(),
        cause
      });
    }
  }

  /**
   * Deletes an entity by its identifier
   * @param id - Entity identifier
   * @param tx - Optional transactional context
   */
  async delete(id: EnvelopeId, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    
    try {
      await client.signatureEnvelope.delete({
        where: this.whereById(id)
      });
    } catch (cause) {
      throw repositoryError({
        operation: 'delete',
        envelopeId: id.getValue(),
        cause
      });
    }
  }

  /**
   * Lists entities by specification with optional cursor pagination
   * @param spec - Query/filter specification
   * @param limit - Page size
   * @param cursor - Opaque pagination cursor
   * @param tx - Optional transactional context
   * @returns A page of items and an optional nextCursor
   */
  async list(spec: EnvelopeSpec, limit = 20, cursor?: string, tx?: Prisma.TransactionClient): Promise<Page<SignatureEnvelope>> {
    try {
      const where = this.whereFromSpec(spec);
      type Decoded = { createdAt: string | Date; id: string };
      const decoded = cursor ? decodeCursor<Decoded>(cursor) : undefined;

      const cfg = {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] as Array<Record<string,'asc'|'desc'>>,
        cursorFields: ['createdAt','id'] as string[],
        normalizeCursor: (d?: Decoded) => d ? { id: d.id, createdAt: d.createdAt instanceof Date ? d.createdAt : new Date(d.createdAt) } : undefined,
        include: ENVELOPE_INCLUDE,
      };

      const client = tx ?? this.prisma;
      const { rows, nextCursor } = await listPage(client.signatureEnvelope, where, limit, decoded, cfg);
      return { items: rows.map(r => this.toDomain(r as EnvelopeWithIncludes)), nextCursor };
    } catch (cause) {
      throw repositoryError({ operation: 'list', spec, cause });
    }
  }

  /**
   * Finds envelope by ID with all signers
   * @param id - Envelope ID
   * @param tx - Optional transaction context
   * @returns SignatureEnvelope with signers or null if not found
   */
  async getWithSigners(id: EnvelopeId, tx?: Prisma.TransactionClient): Promise<SignatureEnvelope | null> {
    const client = tx ?? this.prisma;
    
    try {
      const envelope = await client.signatureEnvelope.findUnique({
        where: { id: id.getValue() },
        include: ENVELOPE_INCLUDE
      });

      return envelope ? this.toDomain(envelope) : null;
    } catch (cause) {
      throw repositoryError({
        operation: 'getWithSigners',
        envelopeId: id.getValue(),
        cause
      });
    }
  }







  /**
   * Updates document hashes for envelope
   * @param id - Envelope ID
   * @param hashes - Hashes to update
   * @param tx - Optional transaction context
   * @returns Updated SignatureEnvelope
   */
  async updateHashes(id: EnvelopeId, hashes: Hashes, tx?: Prisma.TransactionClient): Promise<SignatureEnvelope> {
    const client = tx ?? this.prisma;
    
    try {
      const currentEnvelope = await this.findById(id, tx);
      if (!currentEnvelope) {
        throw repositoryError({
          operation: 'updateHashes',
          envelopeId: id.getValue(),
          cause: new Error('Envelope not found')
        });
      }

      currentEnvelope.updateHashes(
        hashes.sourceSha256 ? DocumentHash.fromString(hashes.sourceSha256) : undefined,
        hashes.flattenedSha256 ? DocumentHash.fromString(hashes.flattenedSha256) : undefined,
        hashes.signedSha256 ? DocumentHash.fromString(hashes.signedSha256) : undefined
      );

      const raw = this.toModel(currentEnvelope) as Prisma.SignatureEnvelopeUncheckedUpdateInput;
      const { id: _omitId, createdAt: _c4, updatedAt: _u4, ...data } = raw as Record<string, unknown>;

      const updated = await client.signatureEnvelope.update({
        where: { id: id.getValue() },
        data: data as Prisma.SignatureEnvelopeUncheckedUpdateInput,
        include: ENVELOPE_INCLUDE
      });

      return this.toDomain(updated);
    } catch (cause) {
      throw repositoryError({
        operation: 'updateHashes',
        envelopeId: id.getValue(),
        cause
      });
    }
  }

  /**
   * Updates signed document information
   * @param id - Envelope ID
   * @param signedKey - S3 key for signed document
   * @param signedSha256 - SHA-256 hash of signed document
   * @param tx - Optional transaction context
   * @returns Updated SignatureEnvelope
   */
  async updateSignedDocument(id: EnvelopeId, signedKey: string, signedSha256: string, tx?: Prisma.TransactionClient): Promise<SignatureEnvelope> {
    const client = tx ?? this.prisma;
    
    try {
      const currentEnvelope = await this.findById(id, tx);
      if (!currentEnvelope) {
        throw repositoryError({
          operation: 'updateSignedDocument',
          envelopeId: id.getValue(),
          cause: new Error('Envelope not found')
        });
      }

      currentEnvelope.updateSignedDocument(
        S3Key.fromString(signedKey),
        DocumentHash.fromString(signedSha256)
      );

      const raw = this.toModel(currentEnvelope) as Prisma.SignatureEnvelopeUncheckedUpdateInput;
      const { id: _omitId, createdAt: _c5, updatedAt: _u5, ...data } = raw as Record<string, unknown>;

      const updated = await client.signatureEnvelope.update({
        where: { id: id.getValue() },
        data: data as Prisma.SignatureEnvelopeUncheckedUpdateInput,
        include: ENVELOPE_INCLUDE
      });

      return this.toDomain(updated);
    } catch (cause) {
      throw repositoryError({
        operation: 'updateSignedDocument',
        envelopeId: id.getValue(),
        cause
      });
    }
  }

  /**
   * Completes an envelope using entity method
   * @param id - Envelope ID
   * @param tx - Optional transaction context
   * @returns Updated SignatureEnvelope
   */
  async completeEnvelope(id: EnvelopeId, tx?: Prisma.TransactionClient): Promise<SignatureEnvelope> {
    const client = tx ?? this.prisma;
    
    try {
      const currentEnvelope = await this.findById(id, tx);
      if (!currentEnvelope) {
        throw repositoryError({
          operation: 'completeEnvelope',
          envelopeId: id.getValue(),
          cause: new Error('Envelope not found')
        });
      }

      currentEnvelope.complete();

      const raw = this.toModel(currentEnvelope) as Prisma.SignatureEnvelopeUncheckedUpdateInput;
      const { id: _omitId, createdAt: _c6, updatedAt: _u6, ...data } = raw as Record<string, unknown>;

      const updated = await client.signatureEnvelope.update({
        where: { id: id.getValue() },
        data: data as Prisma.SignatureEnvelopeUncheckedUpdateInput,
        include: ENVELOPE_INCLUDE
      });

      return this.toDomain(updated);
    } catch (cause) {
      throw repositoryError({
        operation: 'completeEnvelope',
        envelopeId: id.getValue(),
        cause
      });
    }
  }

  /**
   * Updates flattened key for an envelope
   * @param envelopeId - The envelope ID
   * @param flattenedKey - The flattened document S3 key
   * @param tx - Optional transaction context
   * @returns The updated signature envelope
   */
  async updateFlattenedKey(
    envelopeId: EnvelopeId,
    flattenedKey: string,
    tx?: Prisma.TransactionClient
  ): Promise<SignatureEnvelope> {
    const client = tx ?? this.prisma;

    try {
      const updated = await client.signatureEnvelope.update({
        where: { id: envelopeId.getValue() },
        data: { flattenedKey },
        include: ENVELOPE_INCLUDE
      });

      return this.toDomain(updated);
    } catch (cause) {
      throw repositoryError({
        operation: 'updateFlattenedKey',
        envelopeId: envelopeId.getValue(),
        cause
      });
    }
  }
}
