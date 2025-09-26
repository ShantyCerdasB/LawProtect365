/**
 * @fileoverview EnvelopeSignerRepository - Repository for EnvelopeSigner entity operations
 * @summary Handles all database operations for envelope signers using Prisma
 * @description This repository provides comprehensive data access methods for envelope signers,
 * including CRUD operations, business-specific queries, and status management. It follows
 * the repository pattern and extends RepositoryBase for consistent data access patterns.
 */

import { PrismaClient, Prisma, SignerStatus, ParticipantRole } from '@prisma/client';
import { RepositoryBase, Page, textContainsInsensitive, rangeFilter, EntityMapper, WhereBuilder } from '@lawprotect/shared-ts';
import { EnvelopeSigner } from '../domain/entities/EnvelopeSigner';
import { SignerId } from '../domain/value-objects/SignerId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { SignerSpec } from '../domain/types/signer';
import { 
  repositoryError
} from '../signature-errors';

type SignerWithIncludes = Prisma.EnvelopeSignerGetPayload<{ include: { envelope: true; user: true } }>;

const SIGNER_INCLUDE = { envelope: true, user: true } as const;

/**
 * Maps domain participant role to Prisma enum
 * @param role - Domain participant role string
 * @returns Prisma ParticipantRole enum value
 */
function mapParticipantRole(role: string): ParticipantRole {
  switch (role) {
    case 'SIGNER':
      return ParticipantRole.SIGNER;
    case 'VIEWER':
      return ParticipantRole.VIEWER;
    default:
      // Default to SIGNER for unknown roles
      return ParticipantRole.SIGNER;
  }
}

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

  constructor(protected readonly prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Maps Prisma model to domain entity
   * @param model - Prisma model data
   * @returns Domain entity
   */
  protected toDomain(model: SignerWithIncludes): EnvelopeSigner {
    try {
      return EnvelopeSigner.fromPersistence(model as any);
    } catch (error) {
      throw repositoryError({ operation: 'toDomain', signerId: (model as any)?.id, cause: error });
    }
  }

  protected toCreateModel(entity: EnvelopeSigner): Prisma.EnvelopeSignerUncheckedCreateInput {
    return {
      id: entity.getId().getValue(),
      envelopeId: entity.getEnvelopeId().getValue(),
      userId: entity.getUserId(),
      isExternal: entity.getIsExternal(),
      email: entity.getEmail()?.getValue() ?? null,
      fullName: entity.getFullName(),
      invitedByUserId: entity.getInvitedByUserId(),
      participantRole: mapParticipantRole(entity.getParticipantRole()),
      order: entity.getOrder(),
      status: entity.getStatus(),
      signedAt: entity.getSignedAt(),
      declinedAt: entity.getDeclinedAt(),
      declineReason: entity.getDeclineReason(),
      consentGiven: entity.getConsentGiven(),
      consentTimestamp: entity.getConsentTimestamp(),
      documentHash: entity.getDocumentHash(),
      signatureHash: entity.getSignatureHash(),
      signedS3Key: entity.getSignedS3Key(),
      kmsKeyId: entity.getKmsKeyId(),
      algorithm: entity.getAlgorithm(),
      ipAddress: entity.getIpAddress(),
      userAgent: entity.getUserAgent(),
      location: entity.getLocation()
    };
  }

  protected toUpdateModel(patch: Partial<EnvelopeSigner> | Record<string, unknown>): Prisma.EnvelopeSignerUncheckedUpdateInput {
    return EntityMapper.toUpdateModel(patch, [
      { field: 'envelopeId', getter: 'getEnvelopeId', valueExtractor: (v: unknown) => (v as any)?.getValue?.() },
      { field: 'userId', getter: 'getUserId' },
      { field: 'isExternal', getter: 'getIsExternal' },
      { field: 'email', getter: 'getEmail', valueExtractor: (v: unknown) => (v as any)?.getValue?.() },
      { field: 'fullName', getter: 'getFullName' },
      { field: 'invitedByUserId', getter: 'getInvitedByUserId' },
      { field: 'participantRole', getter: 'getParticipantRole', valueExtractor: (v: unknown) => mapParticipantRole(v as string) },
      { field: 'order', getter: 'getOrder' },
      { field: 'status', getter: 'getStatus' },
      { field: 'signedAt', getter: 'getSignedAt' },
      { field: 'declinedAt', getter: 'getDeclinedAt' },
      { field: 'declineReason', getter: 'getDeclineReason' },
      { field: 'consentGiven', getter: 'getConsentGiven' },
      { field: 'consentTimestamp', getter: 'getConsentTimestamp' },
      { field: 'documentHash', getter: 'getDocumentHash' },
      { field: 'signatureHash', getter: 'getSignatureHash' },
      { field: 'signedS3Key', getter: 'getSignedS3Key' },
      { field: 'kmsKeyId', getter: 'getKmsKeyId' },
      { field: 'algorithm', getter: 'getAlgorithm' },
      { field: 'ipAddress', getter: 'getIpAddress' },
      { field: 'userAgent', getter: 'getUserAgent' },
      { field: 'location', getter: 'getLocation' }
    ]);
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
    const b = new WhereBuilder<any>(() => this.now());

    // Protect against impossible combinations
    if (spec.hasSigned === true && spec.hasDeclined === true) {
      return { AND: [{ status: SignerStatus.SIGNED }, { status: SignerStatus.DECLINED }] };
    }

    // Basic fields
    b.eq('envelopeId', spec.envelopeId)
     .eq('userId', spec.userId)
     .eq('participantRole', spec.participantRole)
     .eq('isExternal', spec.isExternal)
     .eq('status', spec.status)
     .eq('consentGiven', spec.consentGiven);

    // Email with normalization
    if (spec.email) {
      b.and({ email: spec.email.toLowerCase?.() ?? spec.email });
    }

    // Boolean flags
    b.flag(
      spec.hasSigned,
      { status: SignerStatus.SIGNED },
      { status: { not: SignerStatus.SIGNED } }
    );

    b.flag(
      spec.hasDeclined,
      { status: SignerStatus.DECLINED },
      { status: { not: SignerStatus.DECLINED } }
    );

    // Text search
    if ((spec as any).emailContains) {
      b.and({ email: textContainsInsensitive((spec as any).emailContains) });
    }
    if ((spec as any).fullNameContains) {
      b.and({ fullName: textContainsInsensitive((spec as any).fullNameContains) });
    }

    // Date ranges
    const signedRange = rangeFilter((spec as any).signedBefore, (spec as any).signedAfter);
    if (signedRange) b.and({ signedAt: signedRange });

    const declinedRange = rangeFilter((spec as any).declinedBefore, (spec as any).declinedAfter);
    if (declinedRange) b.and({ declinedAt: declinedRange });

    const createdRange = rangeFilter((spec as any).createdBefore, (spec as any).createdAfter);
    if (createdRange) b.and({ createdAt: createdRange });

    return b.build();
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
        include: SIGNER_INCLUDE,
      });
      return signer ? this.toDomain(signer) : null;
    } catch (error) {
      throw repositoryError({ operation: 'findById', signerId: id.getValue(), cause: error });
    }
  }

  /**
   * Creates a new signer
   * @param entity - Signer entity
   * @param tx - Optional transaction client
   * @returns Created signer entity
   */
  async create(entity: EnvelopeSigner, tx?: Prisma.TransactionClient): Promise<EnvelopeSigner> {
    try {
      const client = tx ?? this.prisma;
      const created = await client.envelopeSigner.create({
        data: this.toCreateModel(entity),
        include: SIGNER_INCLUDE,
      });
      return this.toDomain(created);
    } catch (error) {
      throw repositoryError({ operation: 'create', signerId: entity.getId().getValue(), cause: error });
    }
  }

  /**
   * Updates a signer
   * @param id - Signer ID
   * @param entity - Updated signer entity
   * @param tx - Optional transaction client
   * @returns Updated signer entity
   */
  async update(id: SignerId, entity: Partial<EnvelopeSigner>, tx?: Prisma.TransactionClient): Promise<EnvelopeSigner> {
    try {
      const client = tx ?? this.prisma;
      const updated = await client.envelopeSigner.update({
        where: this.whereById(id),
        data: this.toUpdateModel(entity),
        include: SIGNER_INCLUDE,
      });
      return this.toDomain(updated);
    } catch (error) {
      throw repositoryError({ operation: 'update', signerId: id.getValue(), cause: error });
    }
  }

  /**
   * Deletes a signer
   * @param id - Signer ID
   * @param tx - Optional transaction client
   */
  async delete(id: SignerId, tx?: Prisma.TransactionClient): Promise<void> {
    try {
      const client = tx ?? this.prisma;
      await client.envelopeSigner.delete({ where: this.whereById(id) });
    } catch (error) {
      throw repositoryError({ operation: 'delete', signerId: id.getValue(), cause: error });
    }
  }

  /**
   * Lists signers with pagination
   * @param spec - Query specification
   * @param limit - Maximum number of results
   * @param cursor - Pagination cursor
   * @returns Page of signer entities
   */
  async list(spec: SignerSpec, limit = EnvelopeSignerRepository.DEFAULT_PAGE_LIMIT, cursor?: string): Promise<Page<EnvelopeSigner>> {
    return this.listWithCursorPagination(
      this.prisma.envelopeSigner,
      spec,
      limit,
      cursor,
      SIGNER_INCLUDE
    );
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
        include: SIGNER_INCLUDE,
      });
      return signers.map(s => this.toDomain(s));
    } catch (error) {
      throw repositoryError({
        operation: 'findByEnvelopeId',
        envelopeId: envelopeId.getValue(),
        cause: error
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
        include: SIGNER_INCLUDE,
      });
      return signers.map(s => this.toDomain(s));
    } catch (error) {
      throw repositoryError({ operation: 'findByUserId', cause: error, userId });
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
      if (envelopeId) where.envelopeId = envelopeId.getValue();

      const signers = await this.prisma.envelopeSigner.findMany({
        where,
        orderBy: { order: 'asc' },
        include: SIGNER_INCLUDE,
      });
      return signers.map(s => this.toDomain(s));
    } catch (error) {
      throw repositoryError({
        operation: 'findByStatus',
        status,
        envelopeId: envelopeId?.getValue(),
        cause: error
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
      const found = await this.prisma.envelopeSigner.findFirst({
        where: { envelopeId: envelopeId.getValue(), email: email.toLowerCase() },
        select: { id: true },
      });
      return !!found;
    } catch (error) {
      throw repositoryError({ operation: 'existsByEmail', envelopeId: envelopeId.getValue(), cause: error });
    }
  }

  /**
   * Updates a signer using an entity updater function
   * @param id - Signer ID
   * @param updateFn - Function that takes current entity and returns updated entity
   * @param tx - Optional transaction client
   * @returns Updated signer entity
   */
  async updateWithEntity(
    id: SignerId,
    updateFn: (s: EnvelopeSigner) => EnvelopeSigner,
    tx?: Prisma.TransactionClient
  ): Promise<EnvelopeSigner> {
    try {
      const current = await this.findById(id);
      if (!current) {
        throw repositoryError({ operation: 'updateWithEntity', signerId: id.getValue(), cause: new Error('NotFound') });
      }

      const next = updateFn(current) ?? current;
      const client = tx ?? this.prisma;
      const updated = await client.envelopeSigner.update({
        where: this.whereById(id),
        data: this.toUpdateModel(next),
        include: SIGNER_INCLUDE,
      });
      return this.toDomain(updated);
    } catch (error) {
      throw repositoryError({ operation: 'updateWithEntity', signerId: id.getValue(), cause: error });
    }
  }

}
