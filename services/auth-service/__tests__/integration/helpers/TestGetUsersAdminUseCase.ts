/**
 * @fileoverview TestGetUsersAdminUseCase - Simplified GetUsersAdmin use case for integration tests
 * @summary Test-specific implementation that bypasses complex service calls
 * @description This use case is designed for integration tests, focusing on database
 * interactions and business logic validation while mocking external dependencies.
 */

import { PrismaClient } from '@prisma/client';
import { AppError, ErrorCodes, rethrowAppErrorOr } from '@lawprotect/shared-ts';
import { UserRole } from '../../../src/domain/enums/UserRole';
import { AdminIncludeField } from '../../../src/domain/enums/AdminIncludeField';
import { AdminUserQuery, AdminUserResponse, AdminUserItem, AdminUserPageInfo, AdminUserSummary } from '../../../src/domain/interfaces/admin';

export class TestGetUsersAdminUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(query: AdminUserQuery, viewerRole: UserRole): Promise<AdminUserResponse> {
    try {
      // Validate admin permissions
      if (!this.hasAdminPrivileges(viewerRole)) {
        throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, 'Admin privileges required');
      }

      // Validate query parameters
      this.validateQuery(query);

      // Build Prisma query
      const whereClause = this.buildWhereClause(query, viewerRole);
      const orderBy = this.buildOrderBy(query);
      const limit = Math.min(query.limit || 50, 200);

      // Execute query
      const users = await this.prisma.user.findMany({
        where: whereClause,
        orderBy: orderBy,
        take: limit + 1, // Take one extra to check if there are more
        include: {
          personalInfo: query.include?.includes(AdminIncludeField.PROFILE),
          oauthAccounts: query.include?.includes(AdminIncludeField.IDP)
        }
      });

      // Check if there are more results
      const hasMore = users.length > limit;
      const items = hasMore ? users.slice(0, limit) : users;

      // Transform to response format
      const adminItems: AdminUserItem[] = items.map(user => ({
        id: user.id,
        cognitoSub: user.cognitoSub || '',
        email: user.email,
        name: user.name || '',
        givenName: user.givenName,
        lastName: user.lastName,
        role: user.role as UserRole,
        status: user.status as any,
        mfaEnabled: user.mfaEnabled,
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        personalInfo: query.include?.includes(AdminIncludeField.PROFILE) && user.personalInfo ? {
          phone: user.personalInfo.phone,
          locale: user.personalInfo.locale,
          timeZone: user.personalInfo.timeZone
        } : undefined,
        providers: query.include?.includes(AdminIncludeField.IDP) && user.oauthAccounts ? 
          user.oauthAccounts.map(account => ({
            provider: account.provider as any,
            linkedAt: account.createdAt.toISOString()
          })) : undefined
      }));

      // Build page info
      const pageInfo: AdminUserPageInfo = {
        nextCursor: hasMore ? items[items.length - 1].id : null,
        limit: limit,
        hasMore: hasMore
      };

      // Build summary
      const summary: AdminUserSummary = {
        count: items.length
      };

      return {
        items: adminItems,
        pageInfo: pageInfo,
        summary: summary
      };
    } catch (error) {
      rethrowAppErrorOr(error, (details) => 
        new AppError(ErrorCodes.COMMON_INTERNAL_ERROR, 500, 'Failed to retrieve users', details)
      );
    }
  }

  private hasAdminPrivileges(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  }

  private validateQuery(query: AdminUserQuery): void {
    // Validate date ranges
    if (query.createdFrom && query.createdTo) {
      const fromDate = new Date(query.createdFrom);
      const toDate = new Date(query.createdTo);
      if (fromDate >= toDate) {
        throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, 'createdFrom must be before createdTo');
      }
    }

    if (query.lastLoginFrom && query.lastLoginTo) {
      const fromDate = new Date(query.lastLoginFrom);
      const toDate = new Date(query.lastLoginTo);
      if (fromDate >= toDate) {
        throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, 'lastLoginFrom must be before lastLoginTo');
      }
    }

    // Validate limit
    if (query.limit && (query.limit < 10 || query.limit > 200)) {
      throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, 'limit must be between 10 and 200');
    }
  }

  private buildWhereClause(query: AdminUserQuery, viewerRole: UserRole): any {
    const where: any = {};

    // Role-based visibility
    if (viewerRole === UserRole.ADMIN) {
      // ADMIN cannot see SUPER_ADMIN users
      where.role = { not: UserRole.SUPER_ADMIN };
    }

    // Search query
    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { name: { contains: query.q, mode: 'insensitive' } },
        { givenName: { contains: query.q, mode: 'insensitive' } },
        { lastName: { contains: query.q, mode: 'insensitive' } }
      ];
    }

    // Role filter
    if (query.role && query.role.length > 0) {
      where.role = { in: query.role };
    }

    // Status filter
    if (query.status && query.status.length > 0) {
      where.status = { in: query.status };
    }

    // MFA filter
    if (query.mfa) {
      where.mfaEnabled = query.mfa === 'enabled';
    }

    // Date filters
    if (query.createdFrom) {
      where.createdAt = { gte: new Date(query.createdFrom) };
    }
    if (query.createdTo) {
      where.createdAt = { ...where.createdAt, lte: new Date(query.createdTo) };
    }
    if (query.lastLoginFrom) {
      where.lastLoginAt = { gte: new Date(query.lastLoginFrom) };
    }
    if (query.lastLoginTo) {
      where.lastLoginAt = { ...where.lastLoginAt, lte: new Date(query.lastLoginTo) };
    }

    return where;
  }

  private buildOrderBy(query: AdminUserQuery): any {
    const sortBy = query.sortBy || 'createdAt';
    const sortDir = query.sortDir || 'desc';

    return {
      [sortBy]: sortDir
    };
  }
}
