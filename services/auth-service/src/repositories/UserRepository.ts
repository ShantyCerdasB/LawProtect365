/**
 * @fileoverview UserRepository - Data access for User entity
 * @summary Handles User entity persistence operations
 * @description Provides data access methods for User entity using Prisma,
 * including CRUD operations and business queries. Extends RepositoryBase for consistent patterns.
 */

import { PrismaClient, Prisma, $Enums } from '@prisma/client';
import { 
  RepositoryBase, 
  EntityMapper, 
  WhereBuilder,
  textContainsInsensitive,
  rangeFilter
} from '@lawprotect/shared-ts';
import { User } from '../domain/entities/User';
import { UserId } from '../domain/value-objects/UserId';
import { UserRole, UserAccountStatus, AdminIncludeField } from '../domain/enums';
import { UserSpec } from '../domain/interfaces/UserSpec';
import { AdminUserQuery, AdminUserResponse } from '../domain/interfaces/admin';
import { repositoryError } from '../auth-errors/factories';

type UserRow = Prisma.UserGetPayload<{}>;

/**
 * Repository for User entity persistence
 * 
 * Handles all database operations for User entity.
 * Extends RepositoryBase to leverage shared repository patterns and Prisma integration.
 */
export class UserRepository extends RepositoryBase<User, UserId, UserSpec> {
  private static readonly DEFAULT_PAGE_LIMIT = 25;
  
  constructor(protected readonly prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Maps Prisma model to domain entity
   * @param model - Prisma model data
   * @returns Domain entity
   */
  protected toDomain(model: UserRow): User {
    try {
      return User.fromPersistence(model as any);
    } catch (error) {
      throw repositoryError({
        operation: 'toDomain',
        userId: (model as any)?.id,
        cause: error
      });
    }
  }

  protected toCreateModel(entity: User): Prisma.UserUncheckedCreateInput {
    return {
      id: entity.getId().toString(),
      email: entity.getEmail().toString(),
      name: `${entity.getFirstName()} ${entity.getLastName()}`.trim(),
      givenName: entity.getFirstName(),
      lastName: entity.getLastName(),
      role: entity.getRole() as $Enums.UserRole,
      status: entity.getStatus() as $Enums.UserAccountStatus,
      mfaEnabled: entity.isMfaEnabled(),
      lastLoginAt: entity.getLastLoginAt()
    };
  }

  protected toUpdateModel(patch: Partial<User> | Record<string, unknown>): Prisma.UserUncheckedUpdateInput {
    return EntityMapper.toUpdateModel(patch, [
      { field: 'email', getter: 'getEmail', valueExtractor: (v: unknown) => (v as any)?.toString?.() },
      { field: 'givenName', getter: 'getFirstName' },
      { field: 'lastName', getter: 'getLastName' },
      { field: 'role', getter: 'getRole' },
      { field: 'status', getter: 'getStatus' },
      { field: 'mfaEnabled', getter: 'isMfaEnabled' },
      { field: 'lastLoginAt', getter: 'getLastLoginAt' }
    ]);
  }

  /**
   * Creates where clause for ID-based queries
   * @param id - User ID
   * @returns Where clause
   */
  protected whereById(id: UserId): { id: string } {
    return { id: id.toString() };
  }

  /**
   * Creates where clause from specification
   * @param spec - Query specification
   * @returns Where clause
   */
  protected whereFromSpec(spec: UserSpec): Prisma.UserWhereInput {
    const b = new WhereBuilder<Prisma.UserWhereInput>(() => this.now());

    // Basic fields
    b.eq('email', spec.email)
     .eq('role', spec.role)
     .eq('status', spec.status)
     .eq('mfaEnabled', spec.mfaEnabled);

    // Text search
    if (spec.search) {
      b.and({
        OR: [
          { name: textContainsInsensitive(spec.search) },
          { email: textContainsInsensitive(spec.search) }
        ]
      });
    }

    // Date ranges
    const createdRange = rangeFilter(spec.createdBefore, spec.createdAfter);
    if (createdRange) b.and({ createdAt: createdRange });

    const lastLoginRange = rangeFilter(spec.lastLoginBefore, spec.lastLoginAfter);
    if (lastLoginRange) b.and({ lastLoginAt: lastLoginRange });

    return b.build();
  }

  /**
   * Finds an entity by its identifier
   * @param id - Entity identifier
   * @param tx - Optional transactional context
   * @returns The entity if found; otherwise `null`
   */
  async findById(id: UserId, tx?: any): Promise<User | null> {
    try {
      const result = await (tx || this.prisma).user.findUnique({
        where: this.whereById(id)
      });
      return result ? this.toDomain(result) : null;
    } catch (error) {
      throw repositoryError({ operation: 'findById', id: id.toString(), cause: error });
    }
  }

  /**
   * Creates a new entity
   * @param data - Domain data to persist
   * @param tx - Optional transactional context
   * @returns The created entity
   */
  async create(data: Partial<User>, tx?: any): Promise<User> {
    try {
      const entity = data as User;
      const created = await (tx || this.prisma).user.create({
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
  async update(id: UserId, patch: Partial<User>, tx?: any): Promise<User> {
    try {
      const updated = await (tx || this.prisma).user.update({
        where: this.whereById(id),
        data: this.toUpdateModel(patch)
      });
      return this.toDomain(updated);
    } catch (error) {
      throw repositoryError({ operation: 'update', id: id.toString(), cause: error });
    }
  }

  /**
   * Deletes an entity by its identifier (soft delete)
   * @param id - Entity identifier
   * @param tx - Optional transactional context
   */
  async delete(id: UserId, tx?: any): Promise<void> {
    try {
      await (tx || this.prisma).user.update({
        where: this.whereById(id),
        data: {
          status: $Enums.UserAccountStatus.DELETED,
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      throw repositoryError({ operation: 'delete', id: id.toString(), cause: error });
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
    spec: UserSpec,
    limit: number,
    cursor?: string,
    tx?: any
  ): Promise<{ items: User[]; nextCursor?: string }> {
    return this.listWithCursorPagination(
      tx || this.prisma.user,
      spec,
      limit,
      cursor
    );
  }

  /**
   * Finds user by Cognito sub
   * @param cognitoSub - Cognito subject identifier
   * @param tx - Optional transactional context
   * @returns User entity or null if not found
   */
  async findByCognitoSub(cognitoSub: string, tx?: any): Promise<User | null> {
    try {
      const user = await (tx || this.prisma).user.findUnique({
        where: { cognitoSub }
      });

      return user ? this.toDomain(user) : null;
    } catch (error) {
      throw repositoryError({ 
        operation: 'findByCognitoSub',
        cognitoSub,
        cause: error
      });
    }
  }

  /**
   * Find user by Cognito sub with minimal data for GET /me
   * @param cognitoSub - Cognito user sub
   * @param tx - Optional transactional context
   * @returns User entity or null if not found
   */
  async findByCognitoSubLight(cognitoSub: string, tx?: any): Promise<User | null> {
    try {
      const user = await (tx || this.prisma).user.findUnique({
        where: { cognitoSub },
        select: {
          id: true,
          cognitoSub: true,
          email: true,
          givenName: true,
          lastName: true,
          role: true,
          status: true,
          mfaEnabled: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return user ? this.toDomain(user) : null;
    } catch (error) {
      throw repositoryError({
        operation: 'findByCognitoSubLight',
        cognitoSub,
        cause: error
      });
    }
  }

  /**
   * Finds users by email with cursor pagination
   * @param email - Email address
   * @param limit - Page size
   * @param cursor - Optional pagination cursor
   * @returns Page of User entities
   */
  async findByEmail(
    email: string,
    limit: number = UserRepository.DEFAULT_PAGE_LIMIT,
    cursor?: string
  ): Promise<{ items: User[]; nextCursor?: string }> {
    return this.list({ email }, limit, cursor);
  }

  /**
   * Finds users by role with cursor pagination
   * @param role - User role
   * @param limit - Page size
   * @param cursor - Optional pagination cursor
   * @returns Page of User entities
   */
  async findByRole(
    role: $Enums.UserRole,
    limit: number = UserRepository.DEFAULT_PAGE_LIMIT,
    cursor?: string
  ): Promise<{ items: User[]; nextCursor?: string }> {
    return this.list({ role }, limit, cursor);
  }

  /**
   * Finds users by status with cursor pagination
   * @param status - User status
   * @param limit - Page size
   * @param cursor - Optional pagination cursor
   * @returns Page of User entities
   */
  async findByStatus(
    status: $Enums.UserAccountStatus,
    limit: number = UserRepository.DEFAULT_PAGE_LIMIT,
    cursor?: string
  ): Promise<{ items: User[]; nextCursor?: string }> {
    return this.list({ status }, limit, cursor);
  }

  /**
   * Updates user status
   * @param id - User ID
   * @param status - New status
   * @param tx - Optional transactional context
   * @returns Updated User entity
   */
  async updateStatus(id: UserId, status: UserAccountStatus, tx?: any): Promise<User> {
    try {
      const user = await (tx || this.prisma).user.update({
        where: this.whereById(id),
        data: {
          status: status as $Enums.UserAccountStatus,
          updatedAt: new Date()
        }
      });

      return this.toDomain(user);
    } catch (error) {
      throw repositoryError({ 
        operation: 'updateStatus',
        id: id.toString(),
        status,
        cause: error
      });
    }
  }

  /**
   * Updates user role
   * @param id - User ID
   * @param role - New role
   * @param tx - Optional transactional context
   * @returns Updated User entity
   */
  async updateRole(id: UserId, role: UserRole, tx?: any): Promise<User> {
    try {
      const user = await (tx || this.prisma).user.update({
        where: this.whereById(id),
        data: {
          role: role as $Enums.UserRole,
          updatedAt: new Date()
        }
      });

      return this.toDomain(user);
    } catch (error) {
      throw repositoryError({ 
        operation: 'updateRole',
        id: id.toString(),
        role,
        cause: error
      });
    }
  }

  /**
   * Counts users by specification
   * @param spec - Query specification
   * @returns Number of users matching the specification
   */
  async countBySpec(spec: UserSpec): Promise<number> {
    try {
      return await this.prisma.user.count({
        where: this.whereFromSpec(spec)
      });
    } catch (error) {
      throw repositoryError({ 
        operation: 'countBySpec',
        spec,
        cause: error
      });
    }
  }

  /**
   * Lists users for admin with advanced filtering and pagination
   * @param query - Admin query parameters
   * @param viewerRole - Role of the user making the request
   * @returns Paginated admin user response
   */
  async listForAdmin(query: AdminUserQuery, viewerRole: UserRole): Promise<AdminUserResponse> {
    try {
      const where = this.buildAdminWhereClause(query, viewerRole);
      const orderBy = this.buildAdminOrderBy(query);
      
      const [users, totalCount] = await Promise.all([
        this.prisma.user.findMany({
          where,
          orderBy,
          take: query.limit || 25,
          skip: query.cursor ? 1 : 0,
          cursor: query.cursor ? { id: query.cursor } : undefined,
          include: {
            oauthAccounts: query.include?.includes(AdminIncludeField.IDP) || false
          }
        }),
        this.prisma.user.count({ where })
      ]);

      const items = users.map(user => this.mapToAdminUserItem(user));
      const hasMore = users.length === (query.limit || 25);
      const nextCursor = hasMore ? users[users.length - 1]?.id : null;

      return {
        items,
        pageInfo: {
          nextCursor,
          limit: query.limit || 25,
          hasMore
        },
        summary: {
          count: totalCount
        }
      };
    } catch (error) {
      throw repositoryError({
        operation: 'listForAdmin',
        query,
        cause: error
      });
    }
  }

  private buildAdminWhereClause(query: AdminUserQuery, viewerRole: UserRole): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    // Apply role visibility rules
    const visibleRoles = viewerRole === UserRole.SUPER_ADMIN 
      ? Object.values(UserRole)
      : Object.values(UserRole).filter(role => role !== UserRole.SUPER_ADMIN);
    
    where.role = { in: visibleRoles as any };

    // Text search
    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { name: { contains: query.q, mode: 'insensitive' } },
        { givenName: { contains: query.q, mode: 'insensitive' } },
        { lastName: { contains: query.q, mode: 'insensitive' } }
      ];
    }

    // Role filter
    if (query.role?.length) {
      where.role = { in: query.role as any };
    }

    // Status filter (exclude DELETED by default if not specified)
    if (query.status?.length) {
      where.status = { in: query.status as any };
    } else {
      where.status = { not: UserAccountStatus.DELETED as any };
    }

    // MFA filter
    if (query.mfa) {
      where.mfaEnabled = query.mfa === 'enabled';
    }

    // Date ranges
    if (query.createdFrom || query.createdTo) {
      where.createdAt = {
        ...(query.createdFrom && { gte: new Date(query.createdFrom) }),
        ...(query.createdTo && { lte: new Date(query.createdTo) })
      };
    }

    if (query.lastLoginFrom || query.lastLoginTo) {
      where.lastLoginAt = {
        ...(query.lastLoginFrom && { gte: new Date(query.lastLoginFrom) }),
        ...(query.lastLoginTo && { lte: new Date(query.lastLoginTo) })
      };
    }

    // Provider filter
    if (query.provider?.length) {
      where.oauthAccounts = {
        some: {
          provider: { in: query.provider as any }
        }
      };
    }

    return where;
  }

  private buildAdminOrderBy(query: AdminUserQuery): Prisma.UserOrderByWithRelationInput {
    const sortBy = query.sortBy || 'createdAt';
    const sortDir = query.sortDir || 'desc';

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    orderBy[sortBy] = sortDir;
    orderBy.id = 'asc'; // Stable sort

    return orderBy;
  }

  /**
   * Finds user by ID with optional includes
   * @param id - User ID
   * @param includes - Optional includes for related data
   * @returns User with includes or null
   */
  async findByIdWithIncludes(
    id: UserId,
    includes: AdminIncludeField[] = []
  ): Promise<any | null> {
    try {
      const includeOAuthAccounts = includes.includes(AdminIncludeField.IDP);

      const user = await this.prisma.user.findUnique({
        where: { id: id.toString() },
        include: {
          oauthAccounts: includeOAuthAccounts
        }
      });

      if (!user) {
        return null;
      }

      return this.mapToAdminUserItem(user);
    } catch (error) {
      throw repositoryError({
        operation: 'findByIdWithIncludes',
        userId: id.toString(),
        cause: error
      });
    }
  }

  /**
   * Updates user profile fields
   * @param userId - User ID
   * @param profileData - Profile data to update
   * @returns Updated user entity
   */
  async updateProfile(
    userId: UserId,
    profileData: {
      name?: string;
      givenName?: string;
      lastName?: string;
    }
  ): Promise<User> {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw repositoryError({
          operation: 'updateProfile',
          userId: userId.toString(),
          cause: 'User not found'
        });
      }

      // Update fields if provided
      if (profileData.name !== undefined) {
        (user as any).name = profileData.name;
      }
      if (profileData.givenName !== undefined) {
        (user as any).givenName = profileData.givenName;
      }
      if (profileData.lastName !== undefined) {
        (user as any).lastName = profileData.lastName;
      }

      // Update timestamp
      (user as any).updatedAt = new Date();

      return await this.update(userId, user);
    } catch (error) {
      throw repositoryError({
        operation: 'updateProfile',
        userId: userId.toString(),
        cause: error
      });
    }
  }

  private mapToAdminUserItem(user: any): any {
    return {
      id: user.id,
      cognitoSub: user.cognitoSub,
      email: user.email,
      name: user.name,
      givenName: user.givenName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      mfaEnabled: user.mfaEnabled,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      suspendedUntil: user.suspendedUntil?.toISOString() || null,
      deactivationReason: user.deactivationReason || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      ...(user.personalInfo && {
        personalInfo: {
          phone: user.personalInfo.phone,
          locale: user.personalInfo.locale,
          timeZone: user.personalInfo.timeZone
        }
      }),
      ...(user.oauthAccounts && {
        providers: user.oauthAccounts.map((account: any) => ({
          provider: account.provider,
          linkedAt: account.createdAt.toISOString()
        }))
      })
    };
  }
}
