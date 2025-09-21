/**
 * @fileoverview EnvelopeSignerRepository - Repository for EnvelopeSigner entity operations
 * @summary Handles all database operations for envelope signers using Prisma
 * @description This repository provides comprehensive data access methods for envelope signers,
 * including CRUD operations, business-specific queries, and status management. It follows
 * the repository pattern and extends RepositoryBase for consistent data access patterns.
 */

import { PrismaClient, SignerStatus } from '@prisma/client';
import { RepositoryBase, Page, RepositoryFactory } from '@lawprotect/shared-ts';
import { EnvelopeSigner } from '../domain/entities/EnvelopeSigner';
import { SignerId } from '../domain/value-objects/SignerId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { SignerSpec } from '../domain/types/signer';
import { 
  documentS3Error,
  invalidEntity
} from '../signature-errors';

/**
 * Repository for managing EnvelopeSigner entities
 * 
 * This repository handles all database operations for envelope signers, including
 * CRUD operations, status management, and business-specific queries. It provides
 * methods for finding signers by various criteria, updating signer status,
 * and managing signature data.
 */
export class EnvelopeSignerRepository extends RepositoryBase<EnvelopeSigner, SignerId, SignerSpec> {
  private static readonly DEFAULT_PAGE_LIMIT = 20;
  private static readonly PAGINATION_OFFSET = 1;
  private static readonly SLICE_LAST_INDEX = -1;
  private static readonly MIN_COUNT_THRESHOLD = 0;
  constructor(protected readonly prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Maps Prisma model to domain entity
   * @param model - Prisma model data
   * @returns Domain entity
   */
  protected toDomain(model: unknown): EnvelopeSigner {
    try {
      return EnvelopeSigner.fromPersistence(model as any);
    } catch (error) {
      console.error('Failed to map signer from persistence', {
        error: error instanceof Error ? error.message : error,
        signerId: (model as any)?.id
      });
      throw documentS3Error({
        operation: 'toDomain',
        signerId: (model as any)?.id,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Maps domain entity to Prisma model
   * @param entity - Domain entity
   * @returns Prisma model data
   */
  protected toModel(entity: Partial<EnvelopeSigner>): unknown {
    if (!entity || typeof entity.getId !== 'function') {
      throw invalidEntity({
        operation: 'toModel',
        reason: 'Entity missing getId method or is null/undefined'
      });
    }

    return {
      id: entity.getId?.()?.getValue(),
      envelopeId: entity.getEnvelopeId?.()?.getValue(),
      userId: entity.getUserId?.(),
      isExternal: entity.getIsExternal?.(),
      email: entity.getEmail?.()?.getValue(),
      fullName: entity.getFullName?.(),
      invitedByUserId: entity.getInvitedByUserId?.(),
      participantRole: entity.getParticipantRole?.(),
      order: entity.getOrder?.(),
      status: entity.getStatus?.(),
      signedAt: entity.getSignedAt?.(),
      declinedAt: entity.getDeclinedAt?.(),
      declineReason: entity.getDeclineReason?.(),
      consentGiven: entity.getConsentGiven?.(),
      consentTimestamp: entity.getConsentTimestamp?.(),
      documentHash: entity.getDocumentHash?.(),
      signatureHash: entity.getSignatureHash?.(),
      signedS3Key: entity.getSignedS3Key?.(),
      kmsKeyId: entity.getKmsKeyId?.(),
      algorithm: entity.getAlgorithm?.(),
      ipAddress: entity.getIpAddress?.(),
      userAgent: entity.getUserAgent?.(),
      reason: entity.getReason?.(),
      location: entity.getLocation?.(),
      createdAt: entity.getCreatedAt?.(),
      updatedAt: entity.getUpdatedAt?.()
    };
  }

  /**
   * Creates where clause for ID-based queries
   * @param id - Signer ID
   * @returns Where clause
   */
  protected whereById(id: SignerId): { id: string } {
    return { id: id.getValue() };
  }

  /**
   * Creates where clause from specification
   * @param spec - Query specification
   * @returns Where clause
   */
  protected whereFromSpec(spec: SignerSpec): any {
    const where: any = {};

    if (spec.envelopeId) {
      where.envelopeId = spec.envelopeId;
    }
    if (spec.userId) {
      where.userId = spec.userId;
    }
    if (spec.email) {
      where.email = spec.email;
    }
    if (spec.status) {
      where.status = spec.status;
    }
    if (spec.isExternal !== undefined) {
      where.isExternal = spec.isExternal;
    }
    if (spec.participantRole) {
      where.participantRole = spec.participantRole;
    }
    if (spec.hasSigned !== undefined) {
      where.status = spec.hasSigned ? SignerStatus.SIGNED : { not: SignerStatus.SIGNED };
    }
    if (spec.hasDeclined !== undefined) {
      where.status = spec.hasDeclined ? SignerStatus.DECLINED : { not: SignerStatus.DECLINED };
    }
    if (spec.consentGiven !== undefined) {
      where.consentGiven = spec.consentGiven;
    }

    return where;
  }

  /**
   * Finds a signer by ID
   * @param id - Signer ID
   * @returns Signer entity or null
   */
  async findById(id: SignerId): Promise<EnvelopeSigner | null> {
    try {
      const signer = await this.prisma.envelopeSigner.findUnique({
        where: this.whereById(id),
        include: {
          envelope: true,
          user: true
        }
      });

      return signer ? this.toDomain(signer) : null;
    } catch (error) {
      console.error('Failed to find signer by ID', {
        error: error instanceof Error ? error.message : error,
        signerId: id.getValue()
      });
      throw documentS3Error({
        operation: 'findById',
        signerId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Creates a new signer
   * @param entity - Signer entity
   * @returns Created signer entity
   */
  async create(entity: EnvelopeSigner): Promise<EnvelopeSigner> {
    try {
      const created = await this.prisma.envelopeSigner.create({
        data: this.toModel(entity) as any,
        include: {
          envelope: true,
          user: true
        }
      });

      return this.toDomain(created);
    } catch (error) {
      console.error('Failed to create signer', {
        error: error instanceof Error ? error.message : error,
        signerId: entity.getId().getValue()
      });
      throw documentS3Error({
        operation: 'create',
        signerId: entity.getId().getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Updates a signer
   * @param id - Signer ID
   * @param entity - Updated signer entity
   * @returns Updated signer entity
   */
  async update(id: SignerId, entity: Partial<EnvelopeSigner>): Promise<EnvelopeSigner> {
    try {
      const updated = await this.prisma.envelopeSigner.update({
        where: this.whereById(id),
        data: this.toModel(entity) as any,
        include: {
          envelope: true,
          user: true
        }
      });

      return this.toDomain(updated);
    } catch (error) {
      console.error('Failed to update signer', {
        error: error instanceof Error ? error.message : error,
        signerId: id.getValue()
      });
      throw documentS3Error({
        operation: 'update',
        signerId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Deletes a signer
   * @param id - Signer ID
   */
  async delete(id: SignerId): Promise<void> {
    try {
      await this.prisma.envelopeSigner.delete({
        where: this.whereById(id)
      });
    } catch (error) {
      console.error('Failed to delete signer', {
        error: error instanceof Error ? error.message : error,
        signerId: id.getValue()
      });
      throw documentS3Error({
        operation: 'delete',
        signerId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Lists signers with pagination
   * @param spec - Query specification
   * @param limit - Maximum number of results
   * @param cursor - Pagination cursor
   * @returns Page of signer entities
   */
  async list(spec: SignerSpec, limit: number = EnvelopeSignerRepository.DEFAULT_PAGE_LIMIT, cursor?: string): Promise<Page<EnvelopeSigner>> {
    try {
      const where = this.whereFromSpec(spec);
      
      const signers = await this.prisma.envelopeSigner.findMany({
        where,
        take: limit + EnvelopeSignerRepository.PAGINATION_OFFSET,
        cursor: cursor ? RepositoryFactory.decodeCursor(cursor) as any : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          envelope: true,
          user: true
        }
      });

      const hasNextPage = signers.length > limit;
      const results = hasNextPage ? signers.slice(0, EnvelopeSignerRepository.SLICE_LAST_INDEX) : signers;
      const nextCursor = hasNextPage ? RepositoryFactory.createCursor(results[results.length + EnvelopeSignerRepository.SLICE_LAST_INDEX], ['id']) : undefined;

      return {
        items: results.map((signer: any) => this.toDomain(signer)),
        nextCursor
      };
    } catch (error) {
      console.error('Failed to list signers', {
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
   * Finds all signers for an envelope
   * @param envelopeId - Envelope ID
   * @returns Array of signer entities
   */
  async findByEnvelopeId(envelopeId: EnvelopeId): Promise<EnvelopeSigner[]> {
    try {
      const signers = await this.prisma.envelopeSigner.findMany({
        where: { envelopeId: envelopeId.getValue() },
        orderBy: { order: 'asc' },
        include: {
          envelope: true,
          user: true
        }
      });

      return signers.map((signer: any) => this.toDomain(signer));
    } catch (error) {
      console.error('Failed to find signers by envelope ID', {
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
   * Finds a signer by email and envelope ID
   * @param email - Signer email
   * @param envelopeId - Envelope ID
   * @returns Signer entity or null
   */
  async findByEmail(email: string, envelopeId: EnvelopeId): Promise<EnvelopeSigner | null> {
    try {
      const signer = await this.prisma.envelopeSigner.findUnique({
        where: {
          envelopeId_email: {
            envelopeId: envelopeId.getValue(),
            email: email.toLowerCase()
          }
        },
        include: {
          envelope: true,
          user: true
        }
      });

      return signer ? this.toDomain(signer) : null;
    } catch (error) {
      console.error('Failed to find signer by email', {
        error: error instanceof Error ? error.message : error,
        email,
        envelopeId: envelopeId.getValue()
      });
      throw documentS3Error({
        operation: 'findByEmail',
        email,
        envelopeId: envelopeId.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Finds signers by user ID
   * @param userId - User ID
   * @returns Array of signer entities
   */
  async findByUserId(userId: string): Promise<EnvelopeSigner[]> {
    try {
      const signers = await this.prisma.envelopeSigner.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          envelope: true,
          user: true
        }
      });

      return signers.map((signer: any) => this.toDomain(signer));
    } catch (error) {
      console.error('Failed to find signers by user ID', {
        error: error instanceof Error ? error.message : error,
        userId
      });
      throw documentS3Error({
        operation: 'findByUserId',
        userId,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Finds signers by status
   * @param status - Signer status
   * @param envelopeId - Optional envelope ID filter
   * @returns Array of signer entities
   */
  async findByStatus(status: SignerStatus, envelopeId?: EnvelopeId): Promise<EnvelopeSigner[]> {
    try {
      const where: any = { status };
      if (envelopeId) {
        where.envelopeId = envelopeId.getValue();
      }

      const signers = await this.prisma.envelopeSigner.findMany({
        where,
        orderBy: { order: 'asc' },
        include: {
          envelope: true,
          user: true
        }
      });

      return signers.map((signer: any) => this.toDomain(signer));
    } catch (error) {
      console.error('Failed to find signers by status', {
        error: error instanceof Error ? error.message : error,
        status,
        envelopeId: envelopeId?.getValue()
      });
      throw documentS3Error({
        operation: 'findByStatus',
        status,
        envelopeId: envelopeId?.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }


  /**
   * Counts signers for an envelope
   * @param envelopeId - Envelope ID
   * @returns Number of signers
   */
  async countByEnvelopeId(envelopeId: EnvelopeId): Promise<number> {
    try {
      return await this.prisma.envelopeSigner.count({
        where: { envelopeId: envelopeId.getValue() }
      });
    } catch (error) {
      console.error('Failed to count signers by envelope ID', {
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
   * Checks if a signer exists by email and envelope ID
   * @param email - Signer email
   * @param envelopeId - Envelope ID
   * @returns True if signer exists
   */
  async existsByEmail(email: string, envelopeId: EnvelopeId): Promise<boolean> {
    try {
      const count = await this.prisma.envelopeSigner.count({
        where: {
          envelopeId: envelopeId.getValue(),
          email: email.toLowerCase()
        }
      });

      return count > EnvelopeSignerRepository.MIN_COUNT_THRESHOLD;
    } catch (error) {
      console.error('Failed to check if signer exists by email', {
        error: error instanceof Error ? error.message : error,
        email,
        envelopeId: envelopeId.getValue()
      });
      throw documentS3Error({
        operation: 'existsByEmail',
        email,
        envelopeId: envelopeId.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

}
