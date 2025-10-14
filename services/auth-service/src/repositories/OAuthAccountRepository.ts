/**
 * @fileoverview OAuthAccountRepository - Data access for OAuthAccount entity
 * @summary Handles OAuthAccount entity persistence operations
 * @description Provides data access methods for OAuthAccount entity using Prisma,
 * including CRUD operations and OAuth account linking. Extends RepositoryBase for consistent patterns.
 */

import { PrismaClient, Prisma, OAuthProvider as PrismaOAuthProvider } from '@prisma/client';
import { 
  RepositoryBase, 
  EntityMapper, 
  WhereBuilder
} from '@lawprotect/shared-ts';
import { OAuthAccount } from '../domain/entities/OAuthAccount';
import { OAuthAccountId } from '../domain/value-objects/OAuthAccountId';
import { OAuthProvider } from '../domain/enums/OAuthProvider';
import { OAuthAccountSpec } from '../domain/interfaces/OAuthAccountSpec';
import { repositoryError } from '../auth-errors/factories';

type OAuthAccountRow = Prisma.OAuthAccountGetPayload<{}>;

/**
 * Repository for OAuthAccount entity persistence
 * 
 * Handles all database operations for OAuthAccount entity.
 * Extends RepositoryBase to leverage shared repository patterns and Prisma integration.
 */
export class OAuthAccountRepository extends RepositoryBase<OAuthAccount, OAuthAccountId, OAuthAccountSpec> {
  private static readonly DEFAULT_PAGE_LIMIT = 25;
  
  constructor(protected readonly prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Maps Prisma model to domain entity
   * @param model - Prisma model data
   * @returns Domain entity
   */
  protected toDomain(model: OAuthAccountRow): OAuthAccount {
    try {
      return OAuthAccount.fromPersistence(model as any);
    } catch (error) {
      throw repositoryError({
        operation: 'toDomain',
        oauthAccountId: (model as any)?.id,
        cause: error
      });
    }
  }

  protected toCreateModel(entity: OAuthAccount): Prisma.OAuthAccountUncheckedCreateInput {
    return {
      id: entity.getId(),
      userId: entity.getUserId().toString(),
      provider: entity.getProvider() as PrismaOAuthProvider,
      providerAccountId: entity.getProviderId()
    };
  }

  protected toUpdateModel(patch: Partial<OAuthAccount> | Record<string, unknown>): Prisma.OAuthAccountUncheckedUpdateInput {
    return EntityMapper.toUpdateModel(patch, [
      { field: 'userId', getter: 'getUserId', valueExtractor: (v: unknown) => (v as any)?.toString?.() },
      { field: 'provider', getter: 'getProvider' },
      { field: 'providerAccountId', getter: 'getProviderId' }
    ]);
  }

  /**
   * Creates where clause for ID-based queries
   * @param id - OAuth account ID
   * @returns Where clause
   */
  protected whereById(id: OAuthAccountId): { id: string } {
    return { id: id.getValue() };
  }

  /**
   * Creates where clause from specification
   * @param spec - Query specification
   * @returns Where clause
   */
  protected whereFromSpec(spec: OAuthAccountSpec): Prisma.OAuthAccountWhereInput {
    const b = new WhereBuilder<Prisma.OAuthAccountWhereInput>(() => this.now());

    // Basic fields
    b.eq('userId', spec.userId)
     .eq('provider', spec.provider)
     .eq('providerAccountId', spec.providerAccountId);

    // Date ranges
    if (spec.createdAfter || spec.createdBefore) {
      b.and({
        createdAt: {
          ...(spec.createdAfter && { gte: spec.createdAfter }),
          ...(spec.createdBefore && { lte: spec.createdBefore })
        }
      });
    }

    return b.build();
  }

  /**
   * Finds an entity by its identifier
   * @param id - Entity identifier
   * @param tx - Optional transactional context
   * @returns The entity if found; otherwise `null`
   */
  async findById(id: OAuthAccountId, tx?: any): Promise<OAuthAccount | null> {
    try {
      const result = await (tx || this.prisma).oAuthAccount.findUnique({
        where: this.whereById(id)
      });
      return result ? this.toDomain(result) : null;
    } catch (error) {
      throw repositoryError({ operation: 'findById', id: id.getValue(), cause: error });
    }
  }

  /**
   * Creates a new entity
   * @param data - Domain data to persist
   * @param tx - Optional transactional context
   * @returns The created entity
   */
  async create(data: Partial<OAuthAccount>, tx?: any): Promise<OAuthAccount> {
    try {
      const entity = data as OAuthAccount;
      const created = await (tx || this.prisma).oAuthAccount.create({
        data: this.toCreateModel(entity)
      });
      return this.toDomain(created);
    } catch (error) {
      throw repositoryError({ operation: 'create', cause: error });
    }
  }

  /**
   * Updates an existing entity
   * @param id - Entity identifier
   * @param patch - Partial domain changes to apply
   * @param tx - Optional transactional context
   * @returns The updated entity
   */
  async update(id: OAuthAccountId, patch: Partial<OAuthAccount>, tx?: any): Promise<OAuthAccount> {
    try {
      const updated = await (tx || this.prisma).oAuthAccount.update({
        where: this.whereById(id),
        data: this.toUpdateModel(patch)
      });
      return this.toDomain(updated);
    } catch (error) {
      throw repositoryError({ operation: 'update', id: id.getValue(), cause: error });
    }
  }

  /**
   * Deletes an entity by its identifier
   * @param id - Entity identifier
   * @param tx - Optional transactional context
   */
  async delete(id: OAuthAccountId, tx?: any): Promise<void> {
    try {
      await (tx || this.prisma).oAuthAccount.delete({
        where: this.whereById(id)
      });
    } catch (error) {
      throw repositoryError({ operation: 'delete', id: id.getValue(), cause: error });
    }
  }

  /**
   * Lists entities by specification with optional cursor pagination
   * @param spec - Query/filter specification
   * @param limit - Page size (maximum number of items to return)
   * @param cursor - Opaque pagination cursor
   * @param tx - Optional transactional context
   * @returns A page of items and an optional `nextCursor` when more results exist
   */
  async list(
    spec: OAuthAccountSpec,
    limit: number,
    cursor?: string,
    tx?: any
  ): Promise<{ items: OAuthAccount[]; nextCursor?: string }> {
    return this.listWithCursorPagination(
      tx || this.prisma.oAuthAccount,
      spec,
      limit,
      cursor
    );
  }

  /**
   * Upserts an OAuth account (create or update)
   * @param userId - User ID to link to
   * @param provider - OAuth provider
   * @param providerAccountId - Provider account ID
   * @param tx - Optional transactional context
   * @returns Created or updated OAuthAccount entity
   */
  async upsert(
    userId: string,
    provider: OAuthProvider,
    providerAccountId: string,
    tx?: any
  ): Promise<OAuthAccount> {
    try {
      const oauthAccount = await (tx || this.prisma).oAuthAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider: provider as PrismaOAuthProvider,
            providerAccountId
          }
        },
        update: {
          userId,
          updatedAt: new Date()
        },
        create: {
          userId,
          provider: provider as PrismaOAuthProvider,
          providerAccountId
        }
      });

      return this.toDomain(oauthAccount);
    } catch (error) {
      throw repositoryError({ 
        operation: 'upsert',
        userId,
        provider,
        providerAccountId,
        cause: error
      });
    }
  }

  /**
   * Finds OAuth account by provider and provider account ID
   * @param provider - OAuth provider
   * @param providerAccountId - Provider account ID
   * @param tx - Optional transactional context
   * @returns OAuthAccount entity or null if not found
   */
  async findByProviderAndAccountId(
    provider: OAuthProvider,
    providerAccountId: string,
    tx?: any
  ): Promise<OAuthAccount | null> {
    try {
      const oauthAccount = await (tx || this.prisma).oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: provider as PrismaOAuthProvider,
            providerAccountId
          }
        }
      });

      return oauthAccount ? this.toDomain(oauthAccount) : null;
    } catch (error) {
      throw repositoryError({ 
        operation: 'findByProviderAndAccountId',
        provider,
        providerAccountId,
        cause: error
      });
    }
  }

  /**
   * Finds OAuth accounts by user ID with cursor pagination
   * @param userId - User ID
   * @param limit - Page size
   * @param cursor - Optional pagination cursor
   * @returns Page of OAuthAccount entities
   */
  async findByUserId(
    userId: string,
    limit: number = OAuthAccountRepository.DEFAULT_PAGE_LIMIT,
    cursor?: string
  ): Promise<{ items: OAuthAccount[]; nextCursor?: string }> {
    return this.list({ userId }, limit, cursor);
  }

  /**
   * Unlinks OAuth account from user
   * @param userId - User ID
   * @param provider - OAuth provider
   * @param providerAccountId - Provider account ID
   * @param tx - Optional transactional context
   * @returns Deleted OAuthAccount entity or null if not found
   */
  async unlink(
    userId: string,
    provider: OAuthProvider,
    providerAccountId: string,
    tx?: any
  ): Promise<OAuthAccount | null> {
    try {
      const oauthAccount = await (tx || this.prisma).oAuthAccount.findFirst({
        where: {
          userId,
          provider: provider as PrismaOAuthProvider,
          providerAccountId
        }
      });

      if (!oauthAccount) {
        return null;
      }

      await this.delete(OAuthAccountId.fromString(oauthAccount.id), tx);
      return this.toDomain(oauthAccount);
    } catch (error) {
      throw repositoryError({ 
        operation: 'unlink',
        userId,
        provider,
        providerAccountId,
        cause: error
      });
    }
  }
}
