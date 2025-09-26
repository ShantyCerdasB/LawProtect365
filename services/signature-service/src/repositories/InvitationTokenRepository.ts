/**
 * @fileoverview InvitationTokenRepository - Repository for InvitationToken entity operations
 * @summary Handles all database operations for invitation tokens using Prisma
 * @description This repository provides comprehensive data access methods for invitation tokens,
 * including CRUD operations, business-specific queries, and token lifecycle management. It follows
 * the repository pattern and extends RepositoryBase for consistent data access patterns.
 */

import { PrismaClient, Prisma, InvitationTokenStatus } from '@prisma/client';
import { RepositoryBase, Page, decodeCursor, listPage, sha256Hex } from '@lawprotect/shared-ts';
import { InvitationToken } from '../domain/entities/InvitationToken';
import { InvitationTokenId } from '../domain/value-objects/InvitationTokenId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { SignerId } from '../domain/value-objects/SignerId';
import { InvitationTokenSpec } from '../domain/types/invitation-token';
import { repositoryError } from '../signature-errors';

type TokenRow = Prisma.InvitationTokenGetPayload<{}>;

/**
 * Repository for managing InvitationToken entities
 * 
 * This repository handles all database operations for invitation tokens, including
 * CRUD operations, token lifecycle management, and business-specific queries. It provides
 * methods for finding tokens by various criteria, updating token status, and managing
 * token expiration and usage tracking.
 */
export class InvitationTokenRepository extends RepositoryBase<InvitationToken, InvitationTokenId, InvitationTokenSpec> {
  private static readonly DEFAULT_PAGE_LIMIT = 20;
  
  constructor(protected readonly prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Maps Prisma model to domain entity
   * @param model - Prisma model data
   * @returns Domain entity
   */
  protected toDomain(model: TokenRow | unknown): InvitationToken {
    try {
      return InvitationToken.fromPersistence(model as any);
    } catch (error) {
      throw repositoryError({ operation: 'toDomain', tokenId: (model as any)?.id, cause: error });
    }
  }

  protected toCreateModel(entity: InvitationToken): Prisma.InvitationTokenUncheckedCreateInput {
    return {
      id: entity.getId().getValue(),
      envelopeId: entity.getEnvelopeId().getValue(),
      signerId: entity.getSignerId().getValue(),
      tokenHash: entity.getTokenHash(),
      status: entity.getStatus(),
      expiresAt: entity.getExpiresAt(),
      sentAt: entity.getSentAt(),
      lastSentAt: entity.getLastSentAt(),
      resendCount: entity.getResendCount(),
      usedAt: entity.getUsedAt(),
      usedBy: entity.getUsedBy(),
      viewCount: entity.getViewCount(),
      lastViewedAt: entity.getLastViewedAt(),
      signedAt: entity.getSignedAt(),
      signedBy: entity.getSignedBy(),
      revokedAt: entity.getRevokedAt(),
      revokedReason: entity.getRevokedReason(),
      createdBy: entity.getCreatedBy(),
      ipAddress: entity.getIpAddress(),
      userAgent: entity.getUserAgent(),
      country: entity.getCountry()
    };
  }

  protected toUpdateModel(patch: Partial<InvitationToken> | Record<string, unknown>): Prisma.InvitationTokenUncheckedUpdateInput {
    const p: any = patch;
    const out: any = {};
    const has = (k: string) => Object.prototype.hasOwnProperty.call(p, k);
    const set = (k: string, v: unknown) => { if (v !== undefined) out[k] = v; };

    set('envelopeId', p.getEnvelopeId?.()?.getValue?.() ?? (has('envelopeId') ? p.envelopeId : undefined));
    set('signerId', p.getSignerId?.()?.getValue?.() ?? (has('signerId') ? p.signerId : undefined));
    set('tokenHash', p.getTokenHash?.() ?? (has('tokenHash') ? p.tokenHash : undefined));
    set('status', p.getStatus?.() ?? (has('status') ? p.status : undefined));
    set('expiresAt', p.getExpiresAt?.() ?? (has('expiresAt') ? p.expiresAt : undefined));
    set('sentAt', p.getSentAt?.() ?? (has('sentAt') ? p.sentAt : undefined));
    set('lastSentAt', p.getLastSentAt?.() ?? (has('lastSentAt') ? p.lastSentAt : undefined));
    set('resendCount', p.getResendCount?.() ?? (has('resendCount') ? p.resendCount : undefined));
    set('usedAt', p.getUsedAt?.() ?? (has('usedAt') ? p.usedAt : undefined));
    set('usedBy', p.getUsedBy?.() ?? (has('usedBy') ? p.usedBy : undefined));
    set('viewCount', p.getViewCount?.() ?? (has('viewCount') ? p.viewCount : undefined));
    set('lastViewedAt', p.getLastViewedAt?.() ?? (has('lastViewedAt') ? p.lastViewedAt : undefined));
    set('signedAt', p.getSignedAt?.() ?? (has('signedAt') ? p.signedAt : undefined));
    set('signedBy', p.getSignedBy?.() ?? (has('signedBy') ? p.signedBy : undefined));
    set('revokedAt', p.getRevokedAt?.() ?? (has('revokedAt') ? p.revokedAt : undefined));
    set('revokedReason', p.getRevokedReason?.() ?? (has('revokedReason') ? p.revokedReason : undefined));
    set('createdBy', p.getCreatedBy?.() ?? (has('createdBy') ? p.createdBy : undefined));
    set('ipAddress', p.getIpAddress?.() ?? (has('ipAddress') ? p.ipAddress : undefined));
    set('userAgent', p.getUserAgent?.() ?? (has('userAgent') ? p.userAgent : undefined));
    set('country', p.getCountry?.() ?? (has('country') ? p.country : undefined));

    return out;
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
  protected whereFromSpec(spec: InvitationTokenSpec): Prisma.InvitationTokenWhereInput {
    const AND: Prisma.InvitationTokenWhereInput[] = [];
    const OR: Prisma.InvitationTokenWhereInput[] = [];

    // Basic fields
    if (spec.envelopeId) AND.push({ envelopeId: spec.envelopeId });
    if (spec.signerId) AND.push({ signerId: spec.signerId });
    if (spec.tokenHash) AND.push({ tokenHash: spec.tokenHash });
    if (spec.createdBy) AND.push({ createdBy: spec.createdBy });
    if (spec.usedBy) AND.push({ usedBy: spec.usedBy });

    // Date ranges
    if (spec.expiresBefore || spec.expiresAfter) {
      AND.push({ expiresAt: {
        ...(spec.expiresBefore ? { lt: spec.expiresBefore } : {}),
        ...(spec.expiresAfter ? { gte: spec.expiresAfter } : {}),
      }});
    }

    if (spec.usedBefore || spec.usedAfter) {
      AND.push({ usedAt: {
        ...(spec.usedBefore ? { lt: spec.usedBefore } : {}),
        ...(spec.usedAfter ? { gte: spec.usedAfter } : {}),
      }});
    }

    if (spec.createdBefore || spec.createdAfter) {
      AND.push({ createdAt: {
        ...(spec.createdBefore ? { lt: spec.createdBefore } : {}),
        ...(spec.createdAfter ? { gte: spec.createdAfter } : {}),
      }});
    }

    // Status: if there are flags, ignore direct 'status' to avoid conflicts
    const hasAnyFlag = spec.isActive !== undefined || spec.isUsed !== undefined || spec.isRevoked !== undefined || spec.isExpired !== undefined;

    if (!hasAnyFlag && spec.status) {
      AND.push({ status: spec.status });
    }

    // Boolean flags (prioritized over direct status)
    if (spec.isExpired !== undefined) {
      if (spec.isExpired) {
        OR.push({ status: InvitationTokenStatus.EXPIRED }, { expiresAt: { lt: this.now() } });
      } else {
        AND.push({ status: { not: InvitationTokenStatus.EXPIRED } });
        AND.push({ OR: [{ expiresAt: null }, { expiresAt: { gte: this.now() } }] });
      }
    }
    if (spec.isActive !== undefined) {
      AND.push(spec.isActive ? { status: InvitationTokenStatus.ACTIVE } : { status: { not: InvitationTokenStatus.ACTIVE } });
    }
    if (spec.isUsed !== undefined) {
      AND.push(spec.isUsed ? { status: InvitationTokenStatus.SIGNED } : { status: { not: InvitationTokenStatus.SIGNED } });
    }
    if (spec.isRevoked !== undefined) {
      AND.push(spec.isRevoked ? { status: InvitationTokenStatus.REVOKED } : { status: { not: InvitationTokenStatus.REVOKED } });
    }

    const root: Prisma.InvitationTokenWhereInput = {};
    if (AND.length) root.AND = AND;
    if (OR.length) root.OR = OR;
    return root;
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
      throw repositoryError({ operation: 'findById', tokenId: id.getValue(), cause: error });
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
        data: this.toCreateModel(entity)
      });

      return this.toDomain(created);
    } catch (error) {
      throw repositoryError({ operation: 'create', tokenId: entity.getId().getValue(), cause: error });
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
        data: this.toUpdateModel(entity)
      });

      return this.toDomain(updated);
    } catch (error) {
      throw repositoryError({ operation: 'update', tokenId: id.getValue(), cause: error });
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
      throw repositoryError({ operation: 'delete', tokenId: id.getValue(), cause: error });
    }
  }

  /**
   * Lists tokens with pagination
   * @param spec - Query specification
   * @param limit - Maximum number of results
   * @param cursor - Pagination cursor
   * @returns Page of token entities
   */
  async list(spec: InvitationTokenSpec, limit = InvitationTokenRepository.DEFAULT_PAGE_LIMIT, cursor?: string): Promise<Page<InvitationToken>> {
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

      const { rows, nextCursor } = await listPage(this.prisma.invitationToken, where, limit, decoded, cfg);
      return { items: rows.map(r => this.toDomain(r)), nextCursor };
    } catch (error) {
      throw repositoryError({ operation: 'list', spec, cause: error });
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
      throw repositoryError({ operation: 'findByEnvelopeId', envelopeId: envelopeId.getValue(), cause: error });
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
      throw repositoryError({ operation: 'findBySignerId', signerId: signerId.getValue(), cause: error });
    }
  }

  /**
   * Gets token by plain token (hashes it internally)
   * @param token - Plain token string
   * @returns Token entity or null
   */
  async getByToken(token: string): Promise<InvitationToken | null> {
    try {
      const tokenHash = this.hashToken(token);
      return await this.findByTokenHash(tokenHash);
    } catch (error) {
      throw repositoryError({ operation: 'getByToken', cause: error });
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
      throw repositoryError({ operation: 'findByTokenHash', cause: error, tokenHash });
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
          OR: [{ expiresAt: null }, { expiresAt: { gte: this.now() } }],
        },
      });
      return token ? this.toDomain(token) : null;
    } catch (error) {
      throw repositoryError({ operation: 'findActiveByTokenHash', cause: error, tokenHash });
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
      const where: Prisma.InvitationTokenWhereInput = {
        OR: [{ status: InvitationTokenStatus.EXPIRED }, { expiresAt: { lt: this.now() } }],
      };

      type Decoded = { expiresAt: string | Date; id: string };
      const decoded = cursor ? decodeCursor<Decoded>(cursor) : undefined;

      const cfg = {
        orderBy: [{ expiresAt: 'asc' }, { id: 'asc' }] as Array<Record<string, 'asc'|'desc'>>,
        cursorFields: ['expiresAt', 'id'] as string[],
        normalizeCursor: (d?: Decoded) =>
          d ? { id: d.id, expiresAt: d.expiresAt instanceof Date ? d.expiresAt : new Date(d.expiresAt) } : undefined,
      };

      const { rows, nextCursor } = await listPage(this.prisma.invitationToken, where, limit, decoded, cfg);
      return { items: rows.map(r => this.toDomain(r)), nextCursor };
    } catch (error) {
      throw repositoryError({ operation: 'findExpiredTokens', cause: error });
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
      const where: Prisma.InvitationTokenWhereInput = {
        status: InvitationTokenStatus.ACTIVE,
        resendCount: { lt: maxResends },
        OR: [{ expiresAt: null }, { expiresAt: { gte: this.now() } }],
      };

      type Decoded = { lastSentAt: string | Date; id: string };
      const decoded = cursor ? decodeCursor<Decoded>(cursor) : undefined;

      const cfg = {
        orderBy: [{ lastSentAt: 'asc' }, { id: 'asc' }] as Array<Record<string, 'asc'|'desc'>>,
        cursorFields: ['lastSentAt', 'id'] as string[],
        normalizeCursor: (d?: Decoded) =>
          d ? { id: d.id, lastSentAt: d.lastSentAt instanceof Date ? d.lastSentAt : new Date(d.lastSentAt) } : undefined,
      };

      const { rows, nextCursor } = await listPage(this.prisma.invitationToken, where, limit, decoded, cfg);
      return { items: rows.map(r => this.toDomain(r)), nextCursor };
    } catch (error) {
      throw repositoryError({ operation: 'findTokensForResend', cause: error, maxResends, limit });
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
      throw repositoryError({ operation: 'countByEnvelopeId', envelopeId: envelopeId.getValue(), cause: error });
    }
  }

  /**
   * Checks if token exists by hash
   * @param tokenHash - Token hash
   * @returns True if token exists
   */
  async existsByTokenHash(tokenHash: string): Promise<boolean> {
    try {
      const found = await this.prisma.invitationToken.findFirst({
        where: { tokenHash },
        select: { id: true },
      });
      return !!found;
    } catch (error) {
      throw repositoryError({ operation: 'existsByTokenHash', cause: error, tokenHash });
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
      const current = await this.findById(id);
      if (!current) {
        throw repositoryError({ operation: 'updateWithEntity', tokenId: id.getValue(), cause: new Error('NotFound') });
      }

      updateFn(current);

      const updated = await this.prisma.invitationToken.update({
        where: this.whereById(id),
        data: this.toUpdateModel(current),
      });

      return this.toDomain(updated);
    } catch (error) {
      throw repositoryError({ operation: 'updateWithEntity', tokenId: id.getValue(), cause: error });
    }
  }

  /**
   * Hashes a token for secure storage
   * @param token - Plain token string
   * @returns Hashed token string
   */
  private hashToken(token: string): string {
    return sha256Hex(token);
  }
}
