/**
 * @fileoverview SignerReminderTrackingRepository - Repository for reminder tracking data access
 * @summary Handles persistence operations for signer reminder tracking
 * @description Provides data access methods for managing reminder tracking records,
 * including creation, updates, and queries for reminder history and limits.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { RepositoryBase, Page, decodeCursor, listPage, EntityMapper, WhereBuilder } from '@lawprotect/shared-ts';
import { SignerReminderTracking } from '../domain/entities/SignerReminderTracking';
import { SignerId } from '../domain/value-objects/SignerId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { ReminderTrackingId } from '../domain/value-objects/ReminderTrackingId';
import { TrackingSpec } from '../domain/types/reminder-tracking';
import { repositoryError } from '../signature-errors';

type TrackingModel = Prisma.SignerReminderTrackingGetPayload<{}>;

/**
 * Repository for SignerReminderTracking entities
 * 
 * Handles all database operations related to reminder tracking,
 * including CRUD operations and business logic queries.
 */
export class SignerReminderTrackingRepository extends RepositoryBase<SignerReminderTracking, ReminderTrackingId, TrackingSpec> {
  private static readonly DEFAULT_PAGE_LIMIT = 20;

  constructor(protected readonly prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Maps Prisma model to domain entity
   * @param model - Prisma model data
   * @returns Domain entity
   */
  protected toDomain(model: TrackingModel | unknown): SignerReminderTracking {
    try {
      return SignerReminderTracking.fromPersistence(model as any);
    } catch (error) {
      throw repositoryError({ operation: 'toDomain', trackingId: (model as any)?.id, cause: error });
    }
  }

  /**
   * Maps domain entity to Prisma create input
   * @param entity - Domain entity
   * @returns Prisma create input data
   */
  protected toCreateModel(entity: SignerReminderTracking): Prisma.SignerReminderTrackingUncheckedCreateInput {
    return {
      id: entity.getId().getValue(),
      signerId: entity.getSignerId().getValue(),
      envelopeId: entity.getEnvelopeId().getValue(),
      lastReminderAt: entity.getLastReminderAt(),
      reminderCount: entity.getReminderCount(),
      lastReminderMessage: entity.getLastReminderMessage(),
      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt()
    };
  }

  /**
   * Maps domain entity to Prisma update input
   * @param patch - Partial domain entity or record
   * @returns Prisma update input data
   */
  protected toUpdateModel(patch: Partial<SignerReminderTracking> | Record<string, unknown>): Prisma.SignerReminderTrackingUncheckedUpdateInput {
    return EntityMapper.toUpdateModel(patch, [
      { field: 'signerId', getter: 'getSignerId', valueExtractor: (v: unknown) => (v as any)?.getValue?.() },
      { field: 'envelopeId', getter: 'getEnvelopeId', valueExtractor: (v: unknown) => (v as any)?.getValue?.() },
      { field: 'lastReminderAt', getter: 'getLastReminderAt' },
      { field: 'reminderCount', getter: 'getReminderCount' },
      { field: 'lastReminderMessage', getter: 'getLastReminderMessage' },
      { field: 'updatedAt', getter: 'getUpdatedAt' }
    ]);
  }

  /**
   * Maps domain entity to Prisma model
   * @param entity - Partial domain entity
   * @returns Prisma model data
   */
  protected toModel(entity: Partial<SignerReminderTracking>): unknown {
    if (!entity.getId) {
      throw new Error('Entity must have getId method');
    }

    const p: any = entity;
    return {
      id: p.getId().getValue(),
      signerId: p.getSignerId?.()?.getValue?.() ?? p.signerId,
      envelopeId: p.getEnvelopeId?.()?.getValue?.() ?? p.envelopeId,
      lastReminderAt: p.getLastReminderAt?.() ?? p.lastReminderAt,
      reminderCount: p.getReminderCount?.() ?? p.reminderCount,
      lastReminderMessage: p.getLastReminderMessage?.() ?? p.lastReminderMessage,
      createdAt: p.getCreatedAt?.() ?? p.createdAt,
      updatedAt: p.getUpdatedAt?.() ?? p.updatedAt
    };
  }

  /**
   * Creates where clause for ID-based queries
   * @param id - Tracking ID
   * @returns Where clause
   */
  protected whereById(id: ReminderTrackingId): Prisma.SignerReminderTrackingWhereUniqueInput {
    return { id: id.getValue() };
  }

  /**
   * Creates where clause from specification
   * @param spec - Query specification
   * @returns Where clause
   */
  protected whereFromSpec(spec: TrackingSpec): Prisma.SignerReminderTrackingWhereInput {
    const b = new WhereBuilder<Prisma.SignerReminderTrackingWhereInput>(() => this.now());

    // Basic fields
    b.eq('signerId', spec.signerId)
     .eq('envelopeId', spec.envelopeId);

    // Reminder count ranges
    if (spec.minReminderCount !== undefined) {
      b.and({ reminderCount: { gte: spec.minReminderCount } });
    }
    if (spec.maxReminderCount !== undefined) {
      b.and({ reminderCount: { lte: spec.maxReminderCount } });
    }

    // Date ranges
    b.range('createdAt', {
      lt: spec.createdBefore,
      gte: spec.createdAfter
    });

    b.range('updatedAt', {
      lt: spec.updatedBefore,
      gte: spec.updatedAfter
    });

    return b.build();
  }

  /**
   * Finds reminder tracking by ID
   * @param id - The tracking ID
   * @param tx - Optional transaction client
   * @returns SignerReminderTracking entity or null if not found
   */
  async findById(id: ReminderTrackingId, tx?: Prisma.TransactionClient): Promise<SignerReminderTracking | null> {
    const client = tx ?? this.prisma;
    try {
      const tracking = await client.signerReminderTracking.findUnique({
        where: this.whereById(id)
      });

      return tracking ? this.toDomain(tracking) : null;
    } catch (error) {
      throw repositoryError({ operation: 'findById', trackingId: id.getValue(), cause: error });
    }
  }

  /**
   * Creates a new reminder tracking record
   * @param entity - The SignerReminderTracking entity to create
   * @param tx - Optional transaction client
   * @returns Created SignerReminderTracking entity
   */
  async create(entity: SignerReminderTracking, tx?: Prisma.TransactionClient): Promise<SignerReminderTracking> {
    const client = tx ?? this.prisma;
    try {
      const created = await client.signerReminderTracking.create({
        data: this.toCreateModel(entity)
      });

      return this.toDomain(created);
    } catch (error) {
      throw repositoryError({ operation: 'create', trackingId: entity.getId().getValue(), cause: error });
    }
  }

  /**
   * Updates an existing reminder tracking record
   * @param id - The tracking ID
   * @param patch - Partial entity data to update
   * @param tx - Optional transaction client
   * @returns Updated SignerReminderTracking entity
   */
  async update(id: ReminderTrackingId, patch: Partial<SignerReminderTracking>, tx?: Prisma.TransactionClient): Promise<SignerReminderTracking> {
    const client = tx ?? this.prisma;
    try {
      const updated = await client.signerReminderTracking.update({
        where: this.whereById(id),
        data: this.toUpdateModel(patch)
      });

      return this.toDomain(updated);
    } catch (error) {
      throw repositoryError({ operation: 'update', trackingId: id.getValue(), cause: error });
    }
  }

  /**
   * Deletes reminder tracking record
   * @param id - The reminder tracking ID
   * @param tx - Optional transaction client
   */
  async delete(id: ReminderTrackingId, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    try {
      await client.signerReminderTracking.delete({
        where: this.whereById(id)
      });
    } catch (error) {
      throw repositoryError({ operation: 'delete', trackingId: id.getValue(), cause: error });
    }
  }

  /**
   * Lists reminder tracking records with pagination
   * @param spec - Query specification
   * @param limit - Maximum number of results
   * @param cursor - Pagination cursor
   * @param tx - Optional transaction client
   * @returns Page of tracking entities
   */
  async list(spec: TrackingSpec, limit = SignerReminderTrackingRepository.DEFAULT_PAGE_LIMIT, cursor?: string, tx?: Prisma.TransactionClient): Promise<Page<SignerReminderTracking>> {
    const client = tx ?? this.prisma;
    try {
      const where = this.whereFromSpec(spec);
      type Decoded = { createdAt: string | Date; id: string };
      const decoded: Decoded | undefined = cursor ? decodeCursor<Decoded>(cursor) : undefined;

      const cfg = {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] as Array<Record<string, 'asc'|'desc'>>,
        cursorFields: ['createdAt', 'id'] as string[],
        normalizeCursor: (d?: Decoded) =>
          d ? { id: d.id, createdAt: d.createdAt instanceof Date ? d.createdAt : new Date(d.createdAt) } : undefined,
      };

      const { rows, nextCursor } = await listPage(client.signerReminderTracking, where, limit, decoded, cfg);
      return { items: rows.map(r => this.toDomain(r as TrackingModel)), nextCursor };
    } catch (error) {
      throw repositoryError({ operation: 'list', spec, cause: error });
    }
  }

  /**
   * Finds reminder tracking by signer and envelope
   * @param signerId - The signer ID
   * @param envelopeId - The envelope ID
   * @param tx - Optional transaction client
   * @returns SignerReminderTracking entity or null if not found
   */
  async findBySignerAndEnvelope(signerId: SignerId, envelopeId: EnvelopeId, tx?: Prisma.TransactionClient): Promise<SignerReminderTracking | null> {
    const client = tx ?? this.prisma;
    try {
      const tracking = await client.signerReminderTracking.findUnique({
        where: {
          signerId_envelopeId: {
            signerId: signerId.getValue(),
            envelopeId: envelopeId.getValue()
          }
        }
      });

      return tracking ? this.toDomain(tracking) : null;
    } catch (error) {
      throw repositoryError({ operation: 'findBySignerAndEnvelope', signerId: signerId.getValue(), envelopeId: envelopeId.getValue(), cause: error });
    }
  }

  /**
   * Finds all reminder tracking records for an envelope
   * @param envelopeId - The envelope ID
   * @param tx - Optional transaction client
   * @returns Array of SignerReminderTracking entities
   */
  async findByEnvelope(envelopeId: EnvelopeId, tx?: Prisma.TransactionClient): Promise<SignerReminderTracking[]> {
    const client = tx ?? this.prisma;
    try {
      const trackingRecords = await client.signerReminderTracking.findMany({
        where: {
          envelopeId: envelopeId.getValue()
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return trackingRecords.map((tracking: any) => this.toDomain(tracking));
    } catch (error) {
      throw repositoryError({ operation: 'findByEnvelope', envelopeId: envelopeId.getValue(), cause: error });
    }
  }

  /**
   * Creates or updates a reminder tracking record
   * @param entity - The SignerReminderTracking entity to upsert
   * @param tx - Optional transaction client
   * @returns Created or updated SignerReminderTracking entity
   */
  async upsert(entity: SignerReminderTracking, tx?: Prisma.TransactionClient): Promise<SignerReminderTracking> {
    const client = tx ?? this.prisma;
    try {
      const data = this.toCreateModel(entity);
      
      const upserted = await client.signerReminderTracking.upsert({
        where: {
          signerId_envelopeId: {
            signerId: data.signerId,
            envelopeId: data.envelopeId
          }
        },
        create: data,
        update: this.toUpdateModel(entity)
      });

      return this.toDomain(upserted);
    } catch (error) {
      throw repositoryError({ operation: 'upsert', trackingId: entity.getId().getValue(), cause: error });
    }
  }
}