/**
 * @fileoverview TestGetUserByIdAdminUseCase - Simplified GetUserByIdAdmin use case for integration tests
 * @summary Test-specific implementation that bypasses complex service calls
 * @description This use case is designed for integration tests, focusing on database
 * interactions and business logic validation while mocking external dependencies.
 */

import { PrismaClient } from '@prisma/client';
import { AppError, ErrorCodes, rethrowAppErrorOr } from '@lawprotect/shared-ts';
import { UserRole } from '../../../src/domain/enums/UserRole';
import { AdminIncludeField } from '../../../src/domain/enums/AdminIncludeField';

export class TestGetUserByIdAdminUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(
    userId: string,
    includes: AdminIncludeField[],
    viewerRole: UserRole,
    viewerId: string
  ): Promise<any> {
    try {
      // Prevent self-lookup via admin endpoint
      if (userId === viewerId) {
        throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, 'Use /me endpoint for self-lookup');
      }

      // Find user with optional includes
      const includeOAuthAccounts = includes.includes(AdminIncludeField.IDP);
      const includePersonalInfo = includes.includes(AdminIncludeField.PROFILE);
      
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          personalInfo: includePersonalInfo,
          oauthAccounts: includeOAuthAccounts
        }
      });

      if (!user) {
        throw new AppError(ErrorCodes.COMMON_NOT_FOUND, 404, 'User not found');
      }

      // Validate visibility based on role hierarchy
      this.validateUserVisibility(viewerRole, user.role as UserRole, viewerId);

      // Build response
      const response: any = {
        id: user.id,
        email: user.email,
        name: user.name,
        givenName: user.givenName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        mfaEnabled: user.mfaEnabled,
        cognitoSub: user.cognitoSub,
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      };

      // Add personal info if requested
      if (includes.includes(AdminIncludeField.PROFILE) && user.personalInfo) {
        response.personalInfo = {
          phone: user.personalInfo.phone,
          locale: user.personalInfo.locale,
          timeZone: user.personalInfo.timeZone
        };
      }

      // Add OAuth accounts if requested
      if (includes.includes(AdminIncludeField.IDP)) {
        if (user.oauthAccounts && user.oauthAccounts.length > 0) {
          response.providers = user.oauthAccounts.map(account => ({
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            linkedAt: account.createdAt.toISOString()
          }));
        } else {
          response.providers = undefined;
        }
      }

      return response;
    } catch (error) {
      rethrowAppErrorOr(error, (details) => 
        new AppError(ErrorCodes.COMMON_INTERNAL_ERROR, 500, 'Failed to retrieve user details', details)
      );
    }
  }

  private validateUserVisibility(viewerRole: UserRole, targetRole: UserRole, _viewerId: string): void {
    // SUPER_ADMIN can see everyone
    if (viewerRole === UserRole.SUPER_ADMIN) {
      return;
    }
    
    // ADMIN can see everyone except SUPER_ADMIN
    if (viewerRole === UserRole.ADMIN) {
      if (targetRole === UserRole.SUPER_ADMIN) {
        throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, 'Insufficient permissions to view this user');
      }
      return;
    }
    
    // Other roles cannot use admin endpoints (should be caught earlier)
    throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, 'Admin privileges required');
  }
}
