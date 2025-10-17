import { UserRepository } from '../../repositories/UserRepository';
import { AdminUserQuery, AdminUserResponse } from '../../domain/interfaces/admin';
import { UserRole } from '../../domain/enums';
import { AdminVisibilityRules } from '../../domain/rules/AdminVisibilityRules';
import { Logger } from '@lawprotect/shared-ts';
import { 
  insufficientAdminPermissions,
  invalidAdminQuery
} from '../../auth-errors/factories';

export class GetUsersAdminUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: Logger
  ) {}

  async execute(query: AdminUserQuery, viewerRole: UserRole): Promise<AdminUserResponse> {
    this.logger.info('Executing GetUsersAdminUseCase', { 
      viewerRole, 
      query: this.sanitizeQueryForLogging(query) 
    });

    // Validate admin permissions
    if (!AdminVisibilityRules.hasAdminPrivileges(viewerRole as UserRole)) {
      throw insufficientAdminPermissions({
        viewerRole,
        requiredRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
      });
    }

    // Validate query parameters
    this.validateQuery(query);

    // Execute admin query with role-based visibility
    const result = await this.userRepository.listForAdmin(query, viewerRole as UserRole);

    this.logger.info('Admin users query completed', {
      viewerRole,
      resultCount: result.items.length,
      hasMore: result.pageInfo.hasMore,
      totalCount: result.summary.count
    });

    return result;
  }

  private validateQuery(query: AdminUserQuery): void {
    // Validate date ranges
    if (query.createdFrom && query.createdTo) {
      const fromDate = new Date(query.createdFrom);
      const toDate = new Date(query.createdTo);
      if (fromDate > toDate) {
        throw invalidAdminQuery({
          field: 'createdFrom/createdTo',
          message: 'createdFrom must be before createdTo'
        });
      }
    }

    if (query.lastLoginFrom && query.lastLoginTo) {
      const fromDate = new Date(query.lastLoginFrom);
      const toDate = new Date(query.lastLoginTo);
      if (fromDate > toDate) {
        throw invalidAdminQuery({
          field: 'lastLoginFrom/lastLoginTo',
          message: 'lastLoginFrom must be before lastLoginTo'
        });
      }
    }

    // Validate limit
    if (query.limit && (query.limit < 10 || query.limit > 200)) {
      throw invalidAdminQuery({
        field: 'limit',
        message: 'limit must be between 10 and 200'
      });
    }

    // Validate search query length
    if (query.q && query.q.length > 100) {
      throw invalidAdminQuery({
        field: 'q',
        message: 'search query must be 100 characters or less'
      });
    }
  }

  private sanitizeQueryForLogging(query: AdminUserQuery): Partial<AdminUserQuery> {
    return {
      q: query.q ? `${query.q.substring(0, 10)}...` : undefined,
      role: query.role,
      status: query.status,
      mfa: query.mfa,
      provider: query.provider,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
      include: query.include,
      limit: query.limit,
      cursor: query.cursor ? 'present' : 'absent'
    };
  }
}
