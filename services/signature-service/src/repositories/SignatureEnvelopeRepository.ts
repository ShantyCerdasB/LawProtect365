/**
 * @fileoverview SignatureEnvelopeRepository - Repository for SignatureEnvelope entity operations
 * @summary Provides data access operations for SignatureEnvelope aggregate root
 * @description This repository handles all database operations for SignatureEnvelope entities,
 * including CRUD operations, complex queries with relations, and business-specific searches.
 * It extends RepositoryBase to provide consistent data access patterns and uses Prisma for PostgreSQL operations.
 */

import { RepositoryBase, Page, RepositoryFactory } from '@lawprotect/shared-ts';
import { SignatureEnvelope } from '../domain/entities/SignatureEnvelope';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { EnvelopeStatus } from '../domain/value-objects/EnvelopeStatus';
import { S3Key } from '../domain/value-objects/S3Key';
import { DocumentHash } from '../domain/value-objects/DocumentHash';
import { EnvelopeStatus as PrismaEnvelopeStatus, SignerStatus } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { EnvelopeSpec, S3Keys, Hashes } from '../domain/types/envelope';
import { 
  envelopeNotFound, 
  documentS3Error,
  invalidEntity
} from '../signature-errors';

/**
 * SignatureEnvelopeRepository - Repository for SignatureEnvelope operations
 * 
 * Provides comprehensive data access operations for the SignatureEnvelope aggregate root,
 * including CRUD operations, complex queries with relations, and business-specific searches.
 * Extends RepositoryBase to leverage shared repository patterns and Prisma integration.
 */
export class SignatureEnvelopeRepository extends RepositoryBase<SignatureEnvelope, EnvelopeId, EnvelopeSpec> {
  private static readonly PAGINATION_OFFSET = 1;
  private static readonly SLICE_START_INDEX = 0;
  private static readonly MIN_COUNT_THRESHOLD = 0;
  
  constructor(protected readonly prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Maps Prisma model to domain entity
   * @param model - Prisma SignatureEnvelope model
   * @returns SignatureEnvelope domain entity
   */
  protected toDomain(model: unknown): SignatureEnvelope {
    try {
      return SignatureEnvelope.fromPersistence(model as any);
    } catch (error) {
      console.error('Failed to map envelope from persistence', { 
        error: error instanceof Error ? error.message : error,
        envelopeId: (model as any)?.id 
      });
      throw documentS3Error({
        operation: 'toDomain',
        envelopeId: (model as any)?.id,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  protected toCreateModel(entity: SignatureEnvelope): any {
    return {
      id: entity.getId().getValue(),
      createdBy: entity.getCreatedBy(),
      title: entity.getTitle(),
      description: entity.getDescription(),
      status: entity.getStatus().getValue(),
      signingOrder: entity.getSigningOrder(),
      origin: entity.getOrigin(),
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

  protected toUpdateModel(patch: Partial<SignatureEnvelope> | Record<string, unknown>): any {
    const p: any = patch;
    const out: any = {};
    const has = (k: string) => Object.prototype.hasOwnProperty.call(p, k);
    const set = (k: string, v: unknown) => { if (v !== undefined) out[k] = v; };

    set('createdBy', p.getCreatedBy?.() ?? (has('createdBy') ? p.createdBy : undefined));
    set('title', p.getTitle?.() ?? (has('title') ? p.title : undefined));
    set('description', p.getDescription?.() ?? (has('description') ? p.description : undefined));
    set('status', p.getStatus?.()?.getValue?.() ?? (has('status') ? p.status : undefined));
    set('signingOrder', p.getSigningOrder?.() ?? (has('signingOrder') ? p.signingOrder : undefined));
    set('origin', p.getOrigin?.() ?? (has('origin') ? p.origin : undefined));
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
      throw invalidEntity({
        operation: 'toModel',
        reason: 'Entity missing getId method or is null/undefined'
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
  protected whereById(id: EnvelopeId): unknown {
    return { id: id.getValue() };
  }

  /**
   * Builds a persistence-level filter from a query specification
   * @param spec - Query/filter specification
   * @returns Prisma where clause
   */
  protected whereFromSpec(spec: EnvelopeSpec): unknown {
    const where: any = {};
    
    if (spec.createdBy) {
      where.createdBy = spec.createdBy;
    }
    
    if (spec.status) {
      where.status = spec.status.getValue();
    }
    
    if (spec.title) {
      where.title = spec.title;
    }
    
    if (spec.isExpired !== undefined) {
      if (spec.isExpired) {
        where.expiresAt = { lt: this.now() };
      } else {
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gte: this.now() } }
        ];
      }
    }
    
    return where;
  }

  /**
   * Finds an entity by its identifier
   * @param id - Entity identifier
   * @param tx - Optional transactional context
   * @returns The entity if found; otherwise null
   */
  async findById(id: EnvelopeId, tx?: any): Promise<SignatureEnvelope | null> {
    const client = tx || this.prisma;
    
    try {
      const envelope = await client.signatureEnvelope.findUnique({
        where: this.whereById(id) as any,
        include: {
          signers: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return envelope ? this.toDomain(envelope) : null;
    } catch (error) {
      console.error('Failed to find envelope by ID', { 
        error: error instanceof Error ? error.message : error,
        envelopeId: id.getValue() 
      });
      throw envelopeNotFound({
        envelopeId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Creates a new entity
   * @param data - Domain data to persist
   * @param tx - Optional transactional context
   * @returns The created entity
   */
  async create(data: Partial<SignatureEnvelope>, tx?: any): Promise<SignatureEnvelope> {
    const client = tx || this.prisma;
    
    try {
      const envelopeDataRaw = this.toModel(data) as any;
      const { createdAt: _c1, updatedAt: _u1, ...envelopeData } = envelopeDataRaw;
      const created = await client.signatureEnvelope.create({
        data: envelopeData,
        include: {
          signers: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return this.toDomain(created);
    } catch (error) {
      console.error('Failed to create envelope', { 
        error: error instanceof Error ? error.message : error,
        envelopeData: data 
      });
      throw documentS3Error({
        operation: 'create',
        envelopeData: data,
        originalError: error instanceof Error ? error.message : error
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
  async update(id: EnvelopeId, patch: Partial<SignatureEnvelope>, tx?: any): Promise<SignatureEnvelope> {
    const client = tx || this.prisma;
    
    try {
      const updateDataRaw = this.toModel(patch) as any;
      const { id: _omitId, createdAt: _c2, updatedAt: _u2, ...updateData } = updateDataRaw;

      const updated = await client.signatureEnvelope.update({
        where: this.whereById(id) as any,
        data: updateData,
        include: {
          signers: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return this.toDomain(updated);
    } catch (error) {
      console.error('Failed to update envelope', { 
        error: error instanceof Error ? error.message : error,
        envelopeId: id.getValue(),
        patch 
      });
      throw documentS3Error({
        operation: 'update',
        envelopeId: id.getValue(),
        patch,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Deletes an entity by its identifier
   * @param id - Entity identifier
   * @param tx - Optional transactional context
   */
  async delete(id: EnvelopeId, tx?: any): Promise<void> {
    const client = tx || this.prisma;
    
    try {
      await client.signatureEnvelope.delete({
        where: this.whereById(id) as any
      });
    } catch (error) {
      console.error('Failed to delete envelope', { 
        error: error instanceof Error ? error.message : error,
        envelopeId: id.getValue() 
      });
      throw documentS3Error({
        operation: 'delete',
        envelopeId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
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
  async list(spec: EnvelopeSpec, limit: number, cursor?: string, tx?: any): Promise<{ items: SignatureEnvelope[]; nextCursor?: string }> {
    const client = tx || this.prisma;
    
    try {
      const where = this.whereFromSpec(spec) as any;

      if (cursor) {
        const cursorData = RepositoryFactory.decodeCursor<{ createdAt: string; id: string }>(cursor);
        if (cursorData?.createdAt && cursorData?.id) {
          where.OR = [
            { createdAt: { lt: new Date(cursorData.createdAt) } },
            {
              AND: [
                { createdAt: new Date(cursorData.createdAt) },
                { id: { lt: cursorData.id } }
              ]
            }
          ];
        }
      }

      const envelopes = await client.signatureEnvelope.findMany({
        where,
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' }
        ],
        take: limit + SignatureEnvelopeRepository.PAGINATION_OFFSET,
        include: {
          signers: {
            orderBy: { order: 'asc' }
          }
        }
      });

      const items = envelopes
        .slice(SignatureEnvelopeRepository.SLICE_START_INDEX, limit)
        .map((envelope: any) => this.toDomain(envelope));

      const nextCursor = envelopes.length > limit
        ? RepositoryFactory.createCursor(envelopes[limit], ['createdAt', 'id'])
        : undefined;

      return { items, nextCursor };
    } catch (error) {
      console.error('Failed to list envelopes', { 
        error: error instanceof Error ? error.message : error,
        spec,
        limit,
        cursor 
      });
      throw documentS3Error({
        operation: 'list',
        spec,
        limit,
        cursor,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Finds envelope by ID with all signers
   * @param id - Envelope ID
   * @param tx - Optional transaction context
   * @returns SignatureEnvelope with signers or null if not found
   */
  async getWithSigners(id: EnvelopeId, tx?: any): Promise<SignatureEnvelope | null> {
    const client = tx || this.prisma;
    
    try {
      const envelope = await client.signatureEnvelope.findUnique({
        where: { id: id.getValue() },
        include: {
          signers: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return envelope ? this.toDomain(envelope) : null;
    } catch (error) {
      console.error('Failed to get envelope with signers', { 
        error: error instanceof Error ? error.message : error,
        envelopeId: id.getValue() 
      });
      throw documentS3Error({
        operation: 'getWithSigners',
        envelopeId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Finds envelope by ID with signers filtered by status
   * @param id - Envelope ID
   * @param status - Signer status to filter by
   * @param tx - Optional transaction context
   * @returns SignatureEnvelope with filtered signers or null if not found
   */
  async getWithSignersAndStatus(id: EnvelopeId, status: SignerStatus, tx?: any): Promise<SignatureEnvelope | null> {
    const client = tx || this.prisma;
    
    const envelope = await client.signatureEnvelope.findUnique({
      where: { id: id.getValue() },
      include: {
        signers: {
          where: { status },
          orderBy: { order: 'asc' }
        }
      }
    });

    return envelope ? this.toDomain(envelope) : null;
  }

  /**
   * Finds envelopes by creator user ID
   * @param userId - User ID who created the envelopes
   * @param limit - Maximum number of results
   * @param cursor - Optional cursor for pagination
   * @param tx - Optional transaction context
   * @returns Page of SignatureEnvelope entities
   */
  async findByCreatedBy(userId: string, limit: number, cursor?: string, tx?: any): Promise<Page<SignatureEnvelope>> {
    const client = tx || this.prisma;
    
    const whereClause: any = { createdBy: userId };
    
    if (cursor) {
      const cursorData = RepositoryFactory.decodeCursor<{ createdAt: string; id: string }>(cursor);
      if (cursorData?.createdAt && cursorData?.id) {
        whereClause.OR = [
          { createdAt: { lt: new Date(cursorData.createdAt) } },
          {
            AND: [
              { createdAt: new Date(cursorData.createdAt) },
              { id: { lt: cursorData.id } }
            ]
          }
        ];
      }
    }

    const envelopes = await client.signatureEnvelope.findMany({
      where: whereClause,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }
      ],
      take: limit + 1,
      include: {
        signers: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return RepositoryFactory.createPage(
      envelopes,
      limit,
      (envelope: any) => RepositoryFactory.createCursor(envelope, ['createdAt', 'id'])
    );
  }

  /**
   * Finds envelopes by status
   * @param status - Envelope status to filter by
   * @param limit - Maximum number of results
   * @param cursor - Optional cursor for pagination
   * @param tx - Optional transaction context
   * @returns Page of SignatureEnvelope entities
   */
  async findByStatus(status: EnvelopeStatus, limit: number, cursor?: string, tx?: any): Promise<Page<SignatureEnvelope>> {
    const client = tx || this.prisma;
    
    const whereClause: any = { status: status.getValue() };
    
    if (cursor) {
      const cursorData = RepositoryFactory.decodeCursor<{ createdAt: string; id: string }>(cursor);
      if (cursorData?.createdAt && cursorData?.id) {
        whereClause.OR = [
          { createdAt: { lt: new Date(cursorData.createdAt) } },
          {
            AND: [
              { createdAt: new Date(cursorData.createdAt) },
              { id: { lt: cursorData.id } }
            ]
          }
        ];
      }
    }

    const envelopes = await client.signatureEnvelope.findMany({
      where: whereClause,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }
      ],
      take: limit + 1,
      include: {
        signers: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return RepositoryFactory.createPage(
      envelopes,
      limit,
      (envelope: any) => RepositoryFactory.createCursor(envelope, ['createdAt', 'id'])
    );
  }

  /**
   * Finds envelope by title and creator
   * @param title - Envelope title
   * @param userId - User ID who created the envelope
   * @param tx - Optional transaction context
   * @returns SignatureEnvelope or null if not found
   */
  async findByTitleAndCreator(title: string, userId: string, tx?: any): Promise<SignatureEnvelope | null> {
    const client = tx || this.prisma;
    
    const envelope = await client.signatureEnvelope.findFirst({
      where: {
        title,
        createdBy: userId
      },
      include: {
        signers: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return envelope ? this.toDomain(envelope) : null;
  }

  /**
   * Finds expired envelopes
   * @param limit - Maximum number of results
   * @param cursor - Optional cursor for pagination
   * @param tx - Optional transaction context
   * @returns Page of expired SignatureEnvelope entities
   */
  async findExpiredEnvelopes(limit: number, cursor?: string, tx?: any): Promise<Page<SignatureEnvelope>> {
    const client = tx || this.prisma;
    
    const whereClause: any = {
      expiresAt: { lt: this.now() },
      status: { not: PrismaEnvelopeStatus.COMPLETED }
    };
    
    if (cursor) {
      const cursorData = RepositoryFactory.decodeCursor<{ expiresAt: string; id: string }>(cursor);
      if (cursorData?.expiresAt && cursorData?.id) {
        whereClause.OR = [
          { expiresAt: { gt: new Date(cursorData.expiresAt) } },
          {
            AND: [
              { expiresAt: new Date(cursorData.expiresAt) },
              { id: { gt: cursorData.id } }
            ]
          }
        ];
      }
    }

    const envelopes = await client.signatureEnvelope.findMany({
      where: whereClause,
      orderBy: [
        { expiresAt: 'asc' },
        { id: 'asc' }
      ],
      take: limit + 1,
      include: {
        signers: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return RepositoryFactory.createPage(
      envelopes,
      limit,
      (envelope: any) => RepositoryFactory.createCursor(envelope, ['expiresAt', 'id'])
    );
  }

  /**
   * Updates S3 keys for envelope
   * @param id - Envelope ID
   * @param s3Keys - S3 keys to update
   * @param tx - Optional transaction context
   * @returns Updated SignatureEnvelope
   */
  async updateS3Keys(id: EnvelopeId, s3Keys: S3Keys, tx?: any): Promise<SignatureEnvelope> {
    const client = tx || this.prisma;
    
    try {
      const currentEnvelope = await this.findById(id, tx);
      if (!currentEnvelope) {
        throw envelopeNotFound({ envelopeId: id.getValue() });
      }

      currentEnvelope.updateS3Keys(
        s3Keys.sourceKey ? S3Key.fromString(s3Keys.sourceKey) : undefined,
        s3Keys.metaKey ? S3Key.fromString(s3Keys.metaKey) : undefined,
        s3Keys.flattenedKey ? S3Key.fromString(s3Keys.flattenedKey) : undefined,
        s3Keys.signedKey ? S3Key.fromString(s3Keys.signedKey) : undefined
      );

      const updated = await client.signatureEnvelope.update({
        where: { id: id.getValue() },
        data: ((): any => {
          const raw = this.toModel(currentEnvelope) as any;
          const { id: _omitId, createdAt: _c3, updatedAt: _u3, ...rest } = raw;
          return rest;
        })(),
        include: {
          signers: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return this.toDomain(updated);
    } catch (error) {
      console.error('Failed to update S3 keys', {
        error: error instanceof Error ? error.message : error,
        envelopeId: id.getValue(),
        s3Keys
      });
      throw documentS3Error({
        operation: 'updateS3Keys',
        envelopeId: id.getValue(),
        s3Keys,
        originalError: error instanceof Error ? error.message : error
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
  async updateHashes(id: EnvelopeId, hashes: Hashes, tx?: any): Promise<SignatureEnvelope> {
    const client = tx || this.prisma;
    
    try {
      const currentEnvelope = await this.findById(id, tx);
      if (!currentEnvelope) {
        throw envelopeNotFound({ envelopeId: id.getValue() });
      }

      currentEnvelope.updateHashes(
        hashes.sourceSha256 ? DocumentHash.fromString(hashes.sourceSha256) : undefined,
        hashes.flattenedSha256 ? DocumentHash.fromString(hashes.flattenedSha256) : undefined,
        hashes.signedSha256 ? DocumentHash.fromString(hashes.signedSha256) : undefined
      );

      const updated = await client.signatureEnvelope.update({
        where: { id: id.getValue() },
        data: ((): any => {
          const raw = this.toModel(currentEnvelope) as any;
          const { id: _omitId, createdAt: _c4, updatedAt: _u4, ...rest } = raw;
          return rest;
        })(),
        include: {
          signers: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return this.toDomain(updated);
    } catch (error) {
      console.error('Failed to update hashes', {
        error: error instanceof Error ? error.message : error,
        envelopeId: id.getValue(),
        hashes
      });
      throw documentS3Error({
        operation: 'updateHashes',
        envelopeId: id.getValue(),
        hashes,
        originalError: error instanceof Error ? error.message : error
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
  async updateSignedDocument(id: EnvelopeId, signedKey: string, signedSha256: string, tx?: any): Promise<SignatureEnvelope> {
    const client = tx || this.prisma;
    
    try {
      const currentEnvelope = await this.findById(id, tx);
      if (!currentEnvelope) {
        throw envelopeNotFound({ envelopeId: id.getValue() });
      }

      currentEnvelope.updateSignedDocument(
        S3Key.fromString(signedKey),
        DocumentHash.fromString(signedSha256)
      );

      const updated = await client.signatureEnvelope.update({
        where: { id: id.getValue() },
        data: ((): any => {
          const raw = this.toModel(currentEnvelope) as any;
          const { id: _omitId, createdAt: _c5, updatedAt: _u5, ...rest } = raw;
          return rest;
        })(),
        include: {
          signers: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return this.toDomain(updated);
    } catch (error) {
      console.error('Failed to update signed document', {
        error: error instanceof Error ? error.message : error,
        envelopeId: id.getValue(),
        signedKey,
        signedSha256
      });
      throw documentS3Error({
        operation: 'updateSignedDocument',
        envelopeId: id.getValue(),
        signedKey,
        signedSha256,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Counts envelopes by creator
   * @param userId - User ID who created the envelopes
   * @param tx - Optional transaction context
   * @returns Number of envelopes created by user
   */
  async countByCreatedBy(userId: string, tx?: any): Promise<number> {
    const client = tx || this.prisma;
    
    return await client.signatureEnvelope.count({
      where: { createdBy: userId }
    });
  }

  /**
   * Checks if envelope exists by title and creator
   * @param title - Envelope title
   * @param userId - User ID who created the envelope
   * @param tx - Optional transaction context
   * @returns True if envelope exists
   */
  async existsByTitleAndCreator(title: string, userId: string, tx?: any): Promise<boolean> {
    const client = tx || this.prisma;
    
    const count = await client.signatureEnvelope.count({
      where: {
        title,
        createdBy: userId
      }
    });

    return count > SignatureEnvelopeRepository.MIN_COUNT_THRESHOLD;
  }

  /**
   * Checks if envelope exists by ID
   * @param id - Envelope ID
   * @param tx - Optional transaction context
   * @returns True if envelope exists
   */
  async existsById(id: EnvelopeId, tx?: any): Promise<boolean> {
    const client = tx || this.prisma;
    
    const count = await client.signatureEnvelope.count({
      where: { id: id.getValue() }
    });

    return count > SignatureEnvelopeRepository.MIN_COUNT_THRESHOLD;
  }

  /**
   * Gets envelope with all relations (signers, audit events, consents)
   * @param id - Envelope ID
   * @param tx - Optional transaction context
   * @returns SignatureEnvelope with all relations or null if not found
   */
  async getEnvelopeWithAllRelations(id: EnvelopeId, tx?: any): Promise<SignatureEnvelope | null> {
    const client = tx || this.prisma;
    
    const envelope = await client.signatureEnvelope.findUnique({
      where: { id: id.getValue() },
      include: {
        signers: {
          orderBy: { order: 'asc' }
        },
        auditEvents: {
          orderBy: { createdAt: 'desc' }
        },
        consents: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return envelope ? this.toDomain(envelope) : null;
  }

  /**
   * Gets envelope with audit events
   * @param id - Envelope ID
   * @param limit - Maximum number of audit events
   * @param cursor - Optional cursor for pagination
   * @param tx - Optional transaction context
   * @returns SignatureEnvelope with audit events or null if not found
   */
  async getEnvelopeWithAuditEvents(id: EnvelopeId, limit: number, cursor?: string, tx?: any): Promise<SignatureEnvelope | null> {
    const client = tx || this.prisma;
    
    const whereClause: any = { envelopeId: id.getValue() };
    
    if (cursor) {
      const cursorData = RepositoryFactory.decodeCursor<{ createdAt: string; id: string }>(cursor);
      if (cursorData?.createdAt && cursorData?.id) {
        whereClause.OR = [
          { createdAt: { lt: new Date(cursorData.createdAt) } },
          {
            AND: [
              { createdAt: new Date(cursorData.createdAt) },
              { id: { lt: cursorData.id } }
            ]
          }
        ];
      }
    }

    const envelope = await client.signatureEnvelope.findUnique({
      where: { id: id.getValue() },
      include: {
        signers: {
          orderBy: { order: 'asc' }
        },
        auditEvents: {
          where: whereClause,
          orderBy: [
            { createdAt: 'desc' },
            { id: 'desc' }
          ],
          take: limit + 1
        }
      }
    });

    return envelope ? this.toDomain(envelope) : null;
  }

  /**
   * Gets envelope with consents
   * @param id - Envelope ID
   * @param tx - Optional transaction context
   * @returns SignatureEnvelope with consents or null if not found
   */
  async getEnvelopeWithConsents(id: EnvelopeId, tx?: any): Promise<SignatureEnvelope | null> {
    const client = tx || this.prisma;
    
    const envelope = await client.signatureEnvelope.findUnique({
      where: { id: id.getValue() },
      include: {
        signers: {
          orderBy: { order: 'asc' }
        },
        consents: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return envelope ? this.toDomain(envelope) : null;
  }

  /**
   * Completes an envelope using entity method
   * @param id - Envelope ID
   * @param tx - Optional transaction context
   * @returns Updated SignatureEnvelope
   */
  async completeEnvelope(id: EnvelopeId, tx?: any): Promise<SignatureEnvelope> {
    const client = tx || this.prisma;
    
    try {
      const currentEnvelope = await this.findById(id, tx);
      if (!currentEnvelope) {
        throw envelopeNotFound({ envelopeId: id.getValue() });
      }

      currentEnvelope.complete();

      const updated = await client.signatureEnvelope.update({
        where: { id: id.getValue() },
        data: ((): any => {
          const raw = this.toModel(currentEnvelope) as any;
          const { id: _omitId, createdAt: _c6, updatedAt: _u6, ...rest } = raw;
          return rest;
        })(),
        include: {
          signers: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return this.toDomain(updated);
    } catch (error) {
      console.error('Failed to complete envelope', {
        error: error instanceof Error ? error.message : error,
        envelopeId: id.getValue()
      });
      throw documentS3Error({
        operation: 'completeEnvelope',
        envelopeId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
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
    tx?: any
  ): Promise<SignatureEnvelope> {
    const client = tx || this.prisma;

    try {
      const updated = await client.signatureEnvelope.update({
        where: { id: envelopeId.getValue() },
        data: { flattenedKey },
        include: {
          signers: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return this.toDomain(updated);
    } catch (error) {
      throw documentS3Error({
        operation: 'updateFlattenedKey',
        envelopeId: envelopeId.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }
}
