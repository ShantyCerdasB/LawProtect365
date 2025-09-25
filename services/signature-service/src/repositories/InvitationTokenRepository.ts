/**
 * @fileoverview InvitationTokenRepository - Repository for InvitationToken entity operations
 * @summary Handles all database operations for invitation tokens using Prisma
 * @description This repository provides comprehensive data access methods for invitation tokens,
 * including CRUD operations, business-specific queries, and token lifecycle management. It follows
 * the repository pattern and extends RepositoryBase for consistent data access patterns.
 */

import { PrismaClient, InvitationTokenStatus } from '@prisma/client';
import { RepositoryBase, Page, RepositoryFactory } from '@lawprotect/shared-ts';
import { InvitationToken } from '../domain/entities/InvitationToken';
import { InvitationTokenId } from '../domain/value-objects/InvitationTokenId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { SignerId } from '../domain/value-objects/SignerId';
import { InvitationTokenSpec } from '../domain/types/invitation-token';
import { 
  documentS3Error,
  invalidEntity
} from '../signature-errors';

/**
 * Repository for managing InvitationToken entities
 * 
 * This repository handles all database operations for invitation tokens, including
 * CRUD operations, token lifecycle management, and business-specific queries. It provides
 * methods for finding tokens by various criteria, updating token status, and managing
 * token expiration and usage tracking.
 */
export class InvitationTokenRepository extends RepositoryBase<InvitationToken, InvitationTokenId, InvitationTokenSpec> {
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
  protected toDomain(model: unknown): InvitationToken {
    try {
      return InvitationToken.fromPersistence(model as any);
    } catch (error) {
      console.error('Failed to map invitation token from persistence', {
        error: error instanceof Error ? error.message : error,
        tokenId: (model as any)?.id
      });
      throw documentS3Error({
        operation: 'toDomain',
        tokenId: (model as any)?.id,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Maps domain entity to Prisma model
   * @param entity - Domain entity
   * @returns Prisma model data
   */
  protected toModel(entity: Partial<InvitationToken>): unknown {
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
      tokenHash: entity.getTokenHash?.(),
      status: entity.getStatus?.(),
      expiresAt: entity.getExpiresAt?.(),
      sentAt: entity.getSentAt?.(),
      lastSentAt: entity.getLastSentAt?.(),
      resendCount: entity.getResendCount?.(),
      usedAt: entity.getUsedAt?.(),
      usedBy: entity.getUsedBy?.(),
      viewCount: entity.getViewCount?.(),
      lastViewedAt: entity.getLastViewedAt?.(),
      signedAt: entity.getSignedAt?.(),
      signedBy: entity.getSignedBy?.(),
      revokedAt: entity.getRevokedAt?.(),
      revokedReason: entity.getRevokedReason?.(),
      createdBy: entity.getCreatedBy?.(),
      ipAddress: entity.getIpAddress?.(),
      userAgent: entity.getUserAgent?.(),
      country: entity.getCountry?.(),
      createdAt: entity.getCreatedAt?.(),
      updatedAt: entity.getUpdatedAt?.()
    };
  }

  /**
   * Creates where clause for ID-based queries
   * @param id - Token ID
   * @returns Where clause
   */
  protected whereById(id: InvitationTokenId): { id: string } {
    return { id: id.getValue() };
  }

  /**
   * Creates where clause from specification
   * @param spec - Query specification
   * @returns Where clause
   */
  protected whereFromSpec(spec: InvitationTokenSpec): any {
    const where: any = {};

    this.addBasicFields(where, spec);
    this.addDateFields(where, spec);
    this.addBooleanFlags(where, spec);

    return where;
  }

  /**
   * Adds basic fields to where clause
   * @param where - Where clause object
   * @param spec - Query specification
   */
  private addBasicFields(where: any, spec: InvitationTokenSpec): void {
    if (spec.envelopeId) where.envelopeId = spec.envelopeId;
    if (spec.signerId) where.signerId = spec.signerId;
    if (spec.status) where.status = spec.status;
    if (spec.tokenHash) where.tokenHash = spec.tokenHash;
    if (spec.createdBy) where.createdBy = spec.createdBy;
    if (spec.usedBy) where.usedBy = spec.usedBy;
  }

  /**
   * Adds date fields to where clause
   * @param where - Where clause object
   * @param spec - Query specification
   */
  private addDateFields(where: any, spec: InvitationTokenSpec): void {
    if (spec.expiresBefore) {
      where.expiresAt = { ...where.expiresAt, lt: spec.expiresBefore };
    }
    if (spec.expiresAfter) {
      where.expiresAt = { ...where.expiresAt, gte: spec.expiresAfter };
    }
    if (spec.usedBefore) {
      where.usedAt = { ...where.usedAt, lt: spec.usedBefore };
    }
    if (spec.usedAfter) {
      where.usedAt = { ...where.usedAt, gte: spec.usedAfter };
    }
    if (spec.createdBefore) {
      where.createdAt = { ...where.createdAt, lt: spec.createdBefore };
    }
    if (spec.createdAfter) {
      where.createdAt = { ...where.createdAt, gte: spec.createdAfter };
    }
  }

  /**
   * Adds boolean flags to where clause
   * @param where - Where clause object
   * @param spec - Query specification
   */
  private addBooleanFlags(where: any, spec: InvitationTokenSpec): void {
    if (spec.isExpired !== undefined) {
      if (spec.isExpired) {
        this.addExpiredTokenFilter(where);
      } else {
        this.addNonExpiredTokenFilter(where);
      }
    }
    if (spec.isActive !== undefined) {
      where.status = spec.isActive ? InvitationTokenStatus.ACTIVE : { not: InvitationTokenStatus.ACTIVE };
    }
    if (spec.isUsed !== undefined) {
      where.status = spec.isUsed ? InvitationTokenStatus.SIGNED : { not: InvitationTokenStatus.SIGNED };
    }
    if (spec.isRevoked !== undefined) {
      where.status = spec.isRevoked ? InvitationTokenStatus.REVOKED : { not: InvitationTokenStatus.REVOKED };
    }
  }

  /**
   * Adds expired token filter to where clause
   * @param where - Where clause object
   */
  private addExpiredTokenFilter(where: any): void {
    where.OR = [
      { status: InvitationTokenStatus.EXPIRED },
      { expiresAt: { lt: new Date() } }
    ];
  }

  /**
   * Adds non-expired token filter to where clause
   * @param where - Where clause object
   */
  private addNonExpiredTokenFilter(where: any): void {
    where.AND = [
      { status: { not: InvitationTokenStatus.EXPIRED } },
      { OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ]}
    ];
  }

  /**
   * Finds a token by ID
   * @param id - Token ID
   * @returns Token entity or null
   */
  async findById(id: InvitationTokenId): Promise<InvitationToken | null> {
    try {
      const token = await this.prisma.invitationToken.findUnique({
        where: this.whereById(id)
      });

      return token ? this.toDomain(token) : null;
    } catch (error) {
      console.error('Failed to find invitation token by ID', {
        error: error instanceof Error ? error.message : error,
        tokenId: id.getValue()
      });
      throw documentS3Error({
        operation: 'findById',
        tokenId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Creates a new token
   * @param entity - Token entity
   * @returns Created token entity
   */
  async create(entity: InvitationToken): Promise<InvitationToken> {
    try {
      const created = await this.prisma.invitationToken.create({
        data: this.toModel(entity) as any
      });

      return this.toDomain(created);
    } catch (error) {
      console.error('Failed to create invitation token', {
        error: error instanceof Error ? error.message : error,
        tokenId: entity.getId().getValue()
      });
      throw documentS3Error({
        operation: 'create',
        tokenId: entity.getId().getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Updates a token
   * @param id - Token ID
   * @param entity - Updated token entity
   * @returns Updated token entity
   */
  async update(id: InvitationTokenId, entity: Partial<InvitationToken>): Promise<InvitationToken> {
    try {
      const updated = await this.prisma.invitationToken.update({
        where: this.whereById(id),
        data: this.toModel(entity) as any
      });

      return this.toDomain(updated);
    } catch (error) {
      console.error('Failed to update invitation token', {
        error: error instanceof Error ? error.message : error,
        tokenId: id.getValue()
      });
      throw documentS3Error({
        operation: 'update',
        tokenId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Deletes a token
   * @param id - Token ID
   */
  async delete(id: InvitationTokenId): Promise<void> {
    try {
      await this.prisma.invitationToken.delete({
        where: this.whereById(id)
      });
    } catch (error) {
      console.error('Failed to delete invitation token', {
        error: error instanceof Error ? error.message : error,
        tokenId: id.getValue()
      });
      throw documentS3Error({
        operation: 'delete',
        tokenId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Lists tokens with pagination
   * @param spec - Query specification
   * @param limit - Maximum number of results
   * @param cursor - Pagination cursor
   * @returns Page of token entities
   */
  async list(spec: InvitationTokenSpec, limit: number = InvitationTokenRepository.DEFAULT_PAGE_LIMIT, cursor?: string): Promise<Page<InvitationToken>> {
    try {
      const where = this.whereFromSpec(spec);
      
      const tokens = await this.prisma.invitationToken.findMany({
        where,
        take: limit + InvitationTokenRepository.PAGINATION_OFFSET,
        cursor: cursor ? RepositoryFactory.decodeCursor(cursor) as any : undefined,
        orderBy: { createdAt: 'desc' }
      });

      const hasNextPage = tokens.length > limit;
      const results = hasNextPage ? tokens.slice(InvitationTokenRepository.SLICE_START_INDEX, limit) : tokens;
      const nextCursor = hasNextPage ? RepositoryFactory.createCursor(results[results.length + InvitationTokenRepository.SLICE_LAST_INDEX], ['id']) : undefined;

      return {
        items: results.map((token: any) => this.toDomain(token)),
        nextCursor
      };
    } catch (error) {
      console.error('Failed to list invitation tokens', {
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
   * Finds tokens by envelope ID
   * @param envelopeId - Envelope ID
   * @returns Array of token entities
   */
  async findByEnvelopeId(envelopeId: EnvelopeId): Promise<InvitationToken[]> {
    try {
      const tokens = await this.prisma.invitationToken.findMany({
        where: { envelopeId: envelopeId.getValue() },
        orderBy: { createdAt: 'desc' }
      });

      return tokens.map((token: any) => this.toDomain(token));
    } catch (error) {
      console.error('Failed to find invitation tokens by envelope ID', {
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
   * Finds tokens by signer ID
   * @param signerId - Signer ID
   * @returns Array of token entities
   */
  async findBySignerId(signerId: SignerId): Promise<InvitationToken[]> {
    try {
      const tokens = await this.prisma.invitationToken.findMany({
        where: { signerId: signerId.getValue() },
        orderBy: { createdAt: 'desc' }
      });

      return tokens.map((token: any) => this.toDomain(token));
    } catch (error) {
      console.error('Failed to find invitation tokens by signer ID', {
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
   * Gets token by plain token (hashes it internally)
   * @param token - Plain token string
   * @returns Token entity or null
   */
  async getByToken(token: string): Promise<InvitationToken | null> {
    try {
      // Hash the token to search in database
      const tokenHash = this.hashToken(token);
      
      // ✅ AGREGAR LOGGING PARA DEBUG
      
      return await this.findByTokenHash(tokenHash);
    } catch (error) {
      console.error('Failed to get invitation token by token', {
        error: error instanceof Error ? error.message : error,
        token: token.substring(0, 8) + '...' // Log only first 8 chars for security
      });
      throw documentS3Error({
        operation: 'getByToken',
        token: token.substring(0, 8) + '...',
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Finds token by token hash
   * @param tokenHash - Token hash
   * @returns Token entity or null
   */
  async findByTokenHash(tokenHash: string): Promise<InvitationToken | null> {
    try {
      const token = await this.prisma.invitationToken.findUnique({
        where: { tokenHash }
      });

      return token ? this.toDomain(token) : null;
    } catch (error) {
      console.error('Failed to find invitation token by hash', {
        error: error instanceof Error ? error.message : error,
        tokenHash
      });
      throw documentS3Error({
        operation: 'findByTokenHash',
        tokenHash,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Finds active token by token hash
   * @param tokenHash - Token hash
   * @returns Active token entity or null
   */
  async findActiveByTokenHash(tokenHash: string): Promise<InvitationToken | null> {
    try {
      const token = await this.prisma.invitationToken.findFirst({
        where: { 
          tokenHash,
          status: InvitationTokenStatus.ACTIVE,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        }
      });

      return token ? this.toDomain(token) : null;
    } catch (error) {
      console.error('Failed to find active invitation token by hash', {
        error: error instanceof Error ? error.message : error,
        tokenHash
      });
      throw documentS3Error({
        operation: 'findActiveByTokenHash',
        tokenHash,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Finds expired tokens
   * @param limit - Maximum number of results
   * @param cursor - Optional cursor for pagination
   * @returns Page of expired token entities
   */
  async findExpiredTokens(limit: number, cursor?: string): Promise<Page<InvitationToken>> {
    try {
      const whereClause: any = {
        OR: [
          { status: InvitationTokenStatus.EXPIRED },
          { expiresAt: { lt: new Date() } }
        ]
      };
      
      if (cursor) {
        const cursorData = RepositoryFactory.decodeCursor<{ id: string }>(cursor);
        if (cursorData?.id) {
          whereClause.id = { lt: cursorData.id };
        }
      }

      const tokens = await this.prisma.invitationToken.findMany({
        where: whereClause,
        orderBy: { expiresAt: 'asc' },
        take: limit + InvitationTokenRepository.PAGINATION_OFFSET
      });

      const hasNextPage = tokens.length > limit;
      const results = hasNextPage ? tokens.slice(InvitationTokenRepository.SLICE_START_INDEX, limit) : tokens;
      const nextCursor = hasNextPage ? RepositoryFactory.createCursor(results[results.length + InvitationTokenRepository.SLICE_LAST_INDEX], ['id']) : undefined;

      return {
        items: results.map((token: any) => this.toDomain(token)),
        nextCursor
      };
    } catch (error) {
      console.error('Failed to find expired invitation tokens', {
        error: error instanceof Error ? error.message : error,
        limit,
        cursor
      });
      throw documentS3Error({
        operation: 'findExpiredTokens',
        limit,
        cursor,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Finds tokens that can be resent
   * @param maxResends - Maximum number of resends allowed
   * @param limit - Maximum number of results
   * @param cursor - Optional cursor for pagination
   * @returns Page of resendable token entities
   */
  async findTokensForResend(maxResends: number, limit: number, cursor?: string): Promise<Page<InvitationToken>> {
    try {
      const whereClause: any = {
        status: InvitationTokenStatus.ACTIVE,
        resendCount: { lt: maxResends },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      };
      
      if (cursor) {
        const cursorData = RepositoryFactory.decodeCursor<{ id: string }>(cursor);
        if (cursorData?.id) {
          whereClause.id = { lt: cursorData.id };
        }
      }

      const tokens = await this.prisma.invitationToken.findMany({
        where: whereClause,
        orderBy: { lastSentAt: 'asc' },
        take: limit + InvitationTokenRepository.PAGINATION_OFFSET
      });

      const hasNextPage = tokens.length > limit;
      const results = hasNextPage ? tokens.slice(InvitationTokenRepository.SLICE_START_INDEX, limit) : tokens;
      const nextCursor = hasNextPage ? RepositoryFactory.createCursor(results[results.length + InvitationTokenRepository.SLICE_LAST_INDEX], ['id']) : undefined;

      return {
        items: results.map((token: any) => this.toDomain(token)),
        nextCursor
      };
    } catch (error) {
      console.error('Failed to find tokens for resend', {
        error: error instanceof Error ? error.message : error,
        maxResends,
        limit,
        cursor
      });
      throw documentS3Error({
        operation: 'findTokensForResend',
        maxResends,
        limit,
        cursor,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Counts tokens by envelope ID
   * @param envelopeId - Envelope ID
   * @returns Number of tokens
   */
  async countByEnvelopeId(envelopeId: EnvelopeId): Promise<number> {
    try {
      return await this.prisma.invitationToken.count({
        where: { envelopeId: envelopeId.getValue() }
      });
    } catch (error) {
      console.error('Failed to count invitation tokens by envelope ID', {
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
   * Checks if token exists by hash
   * @param tokenHash - Token hash
   * @returns True if token exists
   */
  async existsByTokenHash(tokenHash: string): Promise<boolean> {
    try {
      const count = await this.prisma.invitationToken.count({
        where: { tokenHash }
      });

      return count > InvitationTokenRepository.MIN_COUNT_THRESHOLD;
    } catch (error) {
      console.error('Failed to check if invitation token exists by hash', {
        error: error instanceof Error ? error.message : error,
        tokenHash
      });
      throw documentS3Error({
        operation: 'existsByTokenHash',
        tokenHash,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Updates token using entity methods
   * @param id - Token ID
   * @param updateFn - Function to update the entity
   * @returns Updated token entity
   */
  async updateWithEntity(id: InvitationTokenId, updateFn: (token: InvitationToken) => void): Promise<InvitationToken> {
    try {
      // Get current token
      const currentToken = await this.findById(id);
      if (!currentToken) {
        throw documentS3Error({
          operation: 'updateWithEntity',
          tokenId: id.getValue(),
          originalError: 'Token not found'
        });
      }

      // Apply entity method
      updateFn(currentToken);

      // Persist changes
      const updated = await this.prisma.invitationToken.update({
        where: this.whereById(id),
        data: this.toModel(currentToken) as any
      });

      return this.toDomain(updated);
    } catch (error) {
      console.error('Failed to update invitation token with entity method', {
        error: error instanceof Error ? error.message : error,
        tokenId: id.getValue()
      });
      throw documentS3Error({
        operation: 'updateWithEntity',
        tokenId: id.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Hashes a token for secure storage
   * @param token - Plain token string
   * @returns Hashed token string
   */
  private hashToken(token: string): string {
    // Use crypto to hash the token (same as in the service)
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
