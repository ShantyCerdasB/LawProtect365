/**
 * @fileoverview ConsentRepository - Repository for Consent entity operations
 * @summary Handles all database operations for consents using Prisma
 * @description This repository provides comprehensive data access methods for consents,
 * including CRUD operations, compliance queries, and consent lifecycle management. It follows
 * the repository pattern and extends RepositoryBase for consistent data access patterns.
 */

import { PrismaClient } from '@prisma/client';
import { RepositoryBase, Page, RepositoryFactory } from '@lawprotect/shared-ts';
import { Consent } from '../domain/entities/Consent';
import { ConsentId } from '../domain/value-objects/ConsentId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { SignerId } from '../domain/value-objects/SignerId';
import { ConsentSpec } from '../domain/types/consent';
import { 
  documentS3Error,
  invalidEntity
} from '../signature-errors';

/**
 * Repository for managing Consent entities
 * 
 * This repository handles all database operations for consents, including
 * CRUD operations, compliance queries, and consent lifecycle management. It provides
 * methods for finding consents by various criteria, updating consent status, and managing
 * consent compliance tracking.
 */
export class ConsentRepository extends RepositoryBase<Consent, ConsentId, ConsentSpec> {
  private static readonly PAGINATION_OFFSET = 1;
  private static readonly SLICE_START_INDEX = 0;
  private static readonly SLICE_LAST_INDEX = -1;
  private static readonly MIN_COUNT_THRESHOLD = 0;
  private static readonly DEFAULT_PAGE_LIMIT = 20;
  
  constructor(protected readonly prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Maps Prisma model to domain entity
   * @param model - Prisma model data
   * @returns Domain entity
   */
  protected toDomain(model: unknown): Consent {
    try {
      return Consent.fromPersistence(model as any);
    } catch (error) {
      console.error('Failed to map consent from persistence', {
        error: error instanceof Error ? error.message : error,
        consentId: (model as any)?.id
      });
      throw documentS3Error({
        operation: 'toDomain',
        consentId: (model as any)?.id,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Maps domain entity to Prisma model
   * @param entity - Domain entity
   * @returns Prisma model data
   */
  protected toModel(entity: Partial<Consent>): unknown {
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
      signatureId: entity.getSignatureId?.()?.getValue(),
      consentGiven: entity.getConsentGiven?.(),
      consentTimestamp: entity.getConsentTimestamp?.(),
      consentText: entity.getConsentText?.(),
      ipAddress: entity.getIpAddress?.(),
      userAgent: entity.getUserAgent?.(),
      createdAt: entity.getCreatedAt?.(),
      updatedAt: entity.getUpdatedAt?.()
    };
  }

  /**
   * Creates where clause for ID-based queries
   * @param id - Consent ID
   * @returns Where clause
   */
  protected whereById(id: ConsentId): { id: string } {
    return { id: id.getValue() };
  }

  /**
   * Creates where clause from specification
   * @param spec - Query specification
   * @returns Where clause
   */
  protected whereFromSpec(spec: ConsentSpec): any {
    const where: any = {};

    if (spec.envelopeId) {
      where.envelopeId = spec.envelopeId;
    }
    if (spec.signerId) {
      where.signerId = spec.signerId;
    }
    if (spec.signatureId) {
      where.signatureId = spec.signatureId;
    }
    if (spec.consentGiven !== undefined) {
      where.consentGiven = spec.consentGiven;
    }
    if (spec.consentText) {
      where.consentText = { contains: spec.consentText };
    }
    if (spec.ipAddress) {
      where.ipAddress = spec.ipAddress;
    }
    if (spec.userAgent) {
      where.userAgent = { contains: spec.userAgent };
    }
    if (spec.consentBefore) {
      where.consentTimestamp = { ...where.consentTimestamp, lt: spec.consentBefore };
    }
    if (spec.consentAfter) {
      where.consentTimestamp = { ...where.consentTimestamp, gte: spec.consentAfter };
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
   * Finds a consent by ID
   * @param id - Consent ID
   * @returns Consent entity or null
   */
  async findById(id: ConsentId): Promise<Consent | null> {
    try {
      const consent = await this.prisma.consent.findUnique({
        where: this.whereById(id)
      });

      return consent ? this.toDomain(consent) : null;
    } catch (error) {
      console.error('Failed to find consent by ID', {
        error: error instanceof Error ? error.message : error,
        consentId: id.getValue()
      });
      throw documentS3Error({
        operation: 'findById',
        consentId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Creates a new consent
   * @param entity - Consent entity
   * @returns Created consent entity
   */
  async create(entity: Consent): Promise<Consent> {
    try {
      const created = await this.prisma.consent.create({
        data: this.toModel(entity) as any
      });

      return this.toDomain(created);
    } catch (error) {
      console.error('Failed to create consent', {
        error: error instanceof Error ? error.message : error,
        consentId: entity.getId().getValue()
      });
      throw documentS3Error({
        operation: 'create',
        consentId: entity.getId().getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Updates a consent
   * @param id - Consent ID
   * @param entity - Updated consent entity
   * @returns Updated consent entity
   */
  async update(id: ConsentId, entity: Partial<Consent>): Promise<Consent> {
    try {
      const updated = await this.prisma.consent.update({
        where: this.whereById(id),
        data: this.toModel(entity) as any
      });

      return this.toDomain(updated);
    } catch (error) {
      console.error('Failed to update consent', {
        error: error instanceof Error ? error.message : error,
        consentId: id.getValue()
      });
      throw documentS3Error({
        operation: 'update',
        consentId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Deletes a consent
   * @param id - Consent ID
   */
  async delete(id: ConsentId): Promise<void> {
    try {
      await this.prisma.consent.delete({
        where: this.whereById(id)
      });
    } catch (error) {
      console.error('Failed to delete consent', {
        error: error instanceof Error ? error.message : error,
        consentId: id.getValue()
      });
      throw documentS3Error({
        operation: 'delete',
        consentId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Lists consents with pagination
   * @param spec - Query specification
   * @param limit - Maximum number of results
   * @param cursor - Pagination cursor
   * @returns Page of consent entities
   */
  async list(spec: ConsentSpec, limit: number = ConsentRepository.DEFAULT_PAGE_LIMIT, cursor?: string): Promise<Page<Consent>> {
    try {
      const where = this.whereFromSpec(spec);
      
      const consents = await this.prisma.consent.findMany({
        where,
        take: limit + ConsentRepository.PAGINATION_OFFSET,
        cursor: cursor ? RepositoryFactory.decodeCursor(cursor) as any : undefined,
        orderBy: { createdAt: 'desc' }
      });

      const hasNextPage = consents.length > limit;
      const results = hasNextPage ? consents.slice(ConsentRepository.SLICE_START_INDEX, limit) : consents;
      const nextCursor = hasNextPage ? RepositoryFactory.createCursor(results[results.length + ConsentRepository.SLICE_LAST_INDEX], ['id']) : undefined;

      return {
        items: results.map((consent: any) => this.toDomain(consent)),
        nextCursor
      };
    } catch (error) {
      console.error('Failed to list consents', {
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
   * Finds consents by envelope ID
   * @param envelopeId - Envelope ID
   * @returns Array of consent entities
   */
  async findByEnvelopeId(envelopeId: EnvelopeId): Promise<Consent[]> {
    try {
      const consents = await this.prisma.consent.findMany({
        where: { envelopeId: envelopeId.getValue() },
        orderBy: { createdAt: 'desc' }
      });

      return consents.map((consent: any) => this.toDomain(consent));
    } catch (error) {
      console.error('Failed to find consents by envelope ID', {
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
   * Finds consents by signer ID
   * @param signerId - Signer ID
   * @returns Array of consent entities
   */
  async findBySignerId(signerId: SignerId): Promise<Consent[]> {
    try {
      const consents = await this.prisma.consent.findMany({
        where: { signerId: signerId.getValue() },
        orderBy: { createdAt: 'desc' }
      });

      return consents.map((consent: any) => this.toDomain(consent));
    } catch (error) {
      console.error('Failed to find consents by signer ID', {
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
   * Finds consent by signer and envelope
   * @param signerId - Signer ID
   * @param envelopeId - Envelope ID
   * @returns Consent entity or null
   */
  async findBySignerAndEnvelope(signerId: SignerId, envelopeId: EnvelopeId): Promise<Consent | null> {
    try {
      const consent = await this.prisma.consent.findFirst({
        where: { 
          signerId: signerId.getValue(),
          envelopeId: envelopeId.getValue()
        }
      });

      return consent ? this.toDomain(consent) : null;
    } catch (error) {
      console.error('Failed to find consent by signer and envelope', {
        error: error instanceof Error ? error.message : error,
        signerId: signerId.getValue(),
        envelopeId: envelopeId.getValue()
      });
      throw documentS3Error({
        operation: 'findBySignerAndEnvelope',
        signerId: signerId.getValue(),
        envelopeId: envelopeId.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Finds consent by signature ID
   * @param signatureId - Signature ID
   * @returns Consent entity or null
   */
  async findBySignatureId(signatureId: SignerId): Promise<Consent | null> {
    try {
      const consent = await this.prisma.consent.findFirst({
        where: { signatureId: signatureId.getValue() }
      });

      return consent ? this.toDomain(consent) : null;
    } catch (error) {
      console.error('Failed to find consent by signature ID', {
        error: error instanceof Error ? error.message : error,
        signatureId: signatureId.getValue()
      });
      throw documentS3Error({
        operation: 'findBySignatureId',
        signatureId: signatureId.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Finds consents by IP address
   * @param ipAddress - IP address
   * @returns Array of consent entities
   */
  async findByIpAddress(ipAddress: string): Promise<Consent[]> {
    try {
      const consents = await this.prisma.consent.findMany({
        where: { ipAddress },
        orderBy: { createdAt: 'desc' }
      });

      return consents.map((consent: any) => this.toDomain(consent));
    } catch (error) {
      console.error('Failed to find consents by IP address', {
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
   * Finds consents by user agent
   * @param userAgent - User agent string
   * @returns Array of consent entities
   */
  async findByUserAgent(userAgent: string): Promise<Consent[]> {
    try {
      const consents = await this.prisma.consent.findMany({
        where: { userAgent: { contains: userAgent } },
        orderBy: { createdAt: 'desc' }
      });

      return consents.map((consent: any) => this.toDomain(consent));
    } catch (error) {
      console.error('Failed to find consents by user agent', {
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
   * Finds consents by timestamp range
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of consent entities
   */
  async findByTimestampRange(startDate: Date, endDate: Date): Promise<Consent[]> {
    try {
      const consents = await this.prisma.consent.findMany({
        where: { 
          consentTimestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { consentTimestamp: 'desc' }
      });

      return consents.map((consent: any) => this.toDomain(consent));
    } catch (error) {
      console.error('Failed to find consents by timestamp range', {
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
   * Finds consents by consent given status
   * @param consentGiven - Whether consent was given
   * @param limit - Maximum number of results
   * @param cursor - Optional cursor for pagination
   * @returns Page of consent entities
   */
  async findByConsentGiven(consentGiven: boolean, limit: number, cursor?: string): Promise<Page<Consent>> {
    try {
      const whereClause: any = {
        consentGiven
      };
      
      if (cursor) {
        const cursorData = RepositoryFactory.decodeCursor<{ id: string }>(cursor);
        if (cursorData?.id) {
          whereClause.id = { lt: cursorData.id };
        }
      }

      const consents = await this.prisma.consent.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit + ConsentRepository.PAGINATION_OFFSET
      });

      const hasNextPage = consents.length > limit;
      const results = hasNextPage ? consents.slice(ConsentRepository.SLICE_START_INDEX, limit) : consents;
      const nextCursor = hasNextPage ? RepositoryFactory.createCursor(results[results.length + ConsentRepository.SLICE_LAST_INDEX], ['id']) : undefined;

      return {
        items: results.map((consent: any) => this.toDomain(consent)),
        nextCursor
      };
    } catch (error) {
      console.error('Failed to find consents by consent given status', {
        error: error instanceof Error ? error.message : error,
        consentGiven,
        limit,
        cursor
      });
      throw documentS3Error({
        operation: 'findByConsentGiven',
        consentGiven,
        limit,
        cursor,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Counts consents by envelope ID
   * @param envelopeId - Envelope ID
   * @returns Number of consents
   */
  async countByEnvelopeId(envelopeId: EnvelopeId): Promise<number> {
    try {
      return await this.prisma.consent.count({
        where: { envelopeId: envelopeId.getValue() }
      });
    } catch (error) {
      console.error('Failed to count consents by envelope ID', {
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
   * Checks if consent exists by signer and envelope
   * @param signerId - Signer ID
   * @param envelopeId - Envelope ID
   * @returns True if consent exists
   */
  async existsBySignerAndEnvelope(signerId: SignerId, envelopeId: EnvelopeId): Promise<boolean> {
    try {
      const count = await this.prisma.consent.count({
        where: { 
          signerId: signerId.getValue(),
          envelopeId: envelopeId.getValue()
        }
      });

      return count > ConsentRepository.MIN_COUNT_THRESHOLD;
    } catch (error) {
      console.error('Failed to check if consent exists by signer and envelope', {
        error: error instanceof Error ? error.message : error,
        signerId: signerId.getValue(),
        envelopeId: envelopeId.getValue()
      });
      throw documentS3Error({
        operation: 'existsBySignerAndEnvelope',
        signerId: signerId.getValue(),
        envelopeId: envelopeId.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Updates consent using entity methods
   * @param id - Consent ID
   * @param updateFn - Function to update the entity
   * @returns Updated consent entity
   */
  async updateWithEntity(id: ConsentId, updateFn: (consent: Consent) => void): Promise<Consent> {
    try {
      // Get current consent
      const currentConsent = await this.findById(id);
      if (!currentConsent) {
        throw documentS3Error({
          operation: 'updateWithEntity',
          consentId: id.getValue(),
          originalError: 'Consent not found'
        });
      }

      // Apply entity method
      updateFn(currentConsent);

      // Persist changes
      const updated = await this.prisma.consent.update({
        where: this.whereById(id),
        data: this.toModel(currentConsent) as any
      });

      return this.toDomain(updated);
    } catch (error) {
      console.error('Failed to update consent with entity method', {
        error: error instanceof Error ? error.message : error,
        consentId: id.getValue()
      });
      throw documentS3Error({
        operation: 'updateWithEntity',
        consentId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }
}
