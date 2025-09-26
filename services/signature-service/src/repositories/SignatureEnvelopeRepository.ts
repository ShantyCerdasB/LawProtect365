/**
 * @fileoverview SignatureEnvelopeRepository - Repository for SignatureEnvelope entity operations
 * @summary Provides data access operations for SignatureEnvelope aggregate root
 * @description This repository handles all database operations for SignatureEnvelope entities,
 * including CRUD operations, complex queries with relations, and business-specific searches.
 * It extends RepositoryBase to provide consistent data access patterns and uses Prisma for PostgreSQL operations.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { RepositoryBase, Page, decodeCursor, listPage, EntityMapper, WhereBuilder  } from '@lawprotect/shared-ts';
import { SignatureEnvelope } from '../domain/entities/SignatureEnvelope';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { S3Key } from '../domain/value-objects/S3Key';
import { DocumentHash } from '../domain/value-objects/DocumentHash';
import { EnvelopeSpec, Hashes } from '../domain/types/envelope';
import { EnvelopeStatus } from '../domain/value-objects/EnvelopeStatus';
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
    return EntityMapper.toUpdateModel(patch, [
      { field: 'createdBy', getter: 'getCreatedBy' },
      { field: 'title', getter: 'getTitle' },
      { field: 'description', getter: 'getDescription' },
      { field: 'status', getter: 'getStatus', valueExtractor: (v: unknown) => (v as any)?.getValue?.() },
      { field: 'signingOrderType', getter: 'getSigningOrder', valueExtractor: (v: unknown) => (v as any)?.getType?.() },
      { field: 'originType', getter: 'getOrigin', valueExtractor: (v: unknown) => (v as any)?.getType?.() },
      { field: 'templateId', getter: 'getTemplateId' },
      { field: 'templateVersion', getter: 'getTemplateVersion' },
      { field: 'sourceKey', getter: 'getSourceKey', valueExtractor: (v: unknown) => (v as any)?.getValue?.() },
      { field: 'metaKey', getter: 'getMetaKey', valueExtractor: (v: unknown) => (v as any)?.getValue?.() },
      { field: 'flattenedKey', getter: 'getFlattenedKey', valueExtractor: (v: unknown) => (v as any)?.getValue?.() },
      { field: 'signedKey', getter: 'getSignedKey', valueExtractor: (v: unknown) => (v as any)?.getValue?.() },
      { field: 'sourceSha256', getter: 'getSourceSha256', valueExtractor: (v: unknown) => (v as any)?.getValue?.() },
      { field: 'flattenedSha256', getter: 'getFlattenedSha256', valueExtractor: (v: unknown) => (v as any)?.getValue?.() },
      { field: 'signedSha256', getter: 'getSignedSha256', valueExtractor: (v: unknown) => (v as any)?.getValue?.() },
      { field: 'sentAt', getter: 'getSentAt' },
      { field: 'completedAt', getter: 'getCompletedAt' },
      { field: 'cancelledAt', getter: 'getCancelledAt' },
      { field: 'declinedAt', getter: 'getDeclinedAt' },
      { field: 'declinedBySignerId', getter: 'getDeclinedBySignerId', valueExtractor: (v: unknown) => (v as any)?.getValue?.() },
      { field: 'declinedReason', getter: 'getDeclinedReason' },
      { field: 'expiresAt', getter: 'getExpiresAt' }
    ]);
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
    const b = new WhereBuilder<Prisma.SignatureEnvelopeWhereInput>(() => this.now());

    // Basic fields
    b.eq('createdBy', spec.createdBy)
     .eq('title', spec.title);

    // Status with getValue
    if (spec.status) {
      b.and({ status: spec.status.getValue() });
    }

    // Expired flag
    if (spec.isExpired !== undefined) {
      if (spec.isExpired) {
        b.or({ expiresAt: { lt: this.now() } });
      } else {
        b.and({ 
          OR: [
            { expiresAt: null }, 
            { expiresAt: { gte: this.now() } }
          ] 
        });
      }
    }

    return b.build();
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
          cause: new Error('Envelope not found'),
        });
      }

      // Domain-level validation/invariants:
      currentEnvelope.updateHashes(
        hashes.sourceSha256 ? DocumentHash.fromString(hashes.sourceSha256) : undefined,
        hashes.flattenedSha256 ? DocumentHash.fromString(hashes.flattenedSha256) : undefined,
        hashes.signedSha256 ? DocumentHash.fromString(hashes.signedSha256) : undefined
      );

      // Explicit partial update payload (no toUpdateModel here)
      const data: Prisma.SignatureEnvelopeUncheckedUpdateInput = {
        ...(hashes.sourceSha256 && { sourceSha256: hashes.sourceSha256 }),
        ...(hashes.flattenedSha256 && { flattenedSha256: hashes.flattenedSha256 }),
        ...(hashes.signedSha256 && { signedSha256: hashes.signedSha256 }),
      };

      const updated = await client.signatureEnvelope.update({
        where: { id: id.getValue() },
        data,
        include: ENVELOPE_INCLUDE,
      });

      return this.toDomain(updated);
    } catch (cause) {
      throw repositoryError({
        operation: 'updateHashes',
        envelopeId: id.getValue(),
        cause,
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


      const data: Prisma.SignatureEnvelopeUncheckedUpdateInput = {
        signedKey,
        signedSha256
      };

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

      const data: Prisma.SignatureEnvelopeUncheckedUpdateInput = {
        status: EnvelopeStatus.completed().getValue(),
        completedAt: new Date()
      };

      const updated = await client.signatureEnvelope.update({
        where: { id: id.getValue() },
        data,
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
