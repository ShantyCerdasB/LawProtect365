/**
 * @fileoverview TestGetMeUseCase - Simplified GetMe use case for integration tests
 * @summary Test-specific implementation that bypasses complex Cognito operations
 * @description This use case is designed for integration tests, focusing on database
 * interactions and business logic validation while mocking external dependencies.
 */

import { GetMeInput, GetMeResult } from '../../../src/types/users/UserProfileResponseDto';
import { PrismaClient } from '@prisma/client';
import { AppError, ErrorCodes, rethrowAppErrorOr } from '@lawprotect/shared-ts';
import { UserRole } from '../../../src/domain/enums/UserRole';
import { UserAccountStatus } from '../../../src/domain/enums/UserAccountStatus';
import { OAuthProvider } from '../../../src/domain/enums/OAuthProvider';

export class TestGetMeUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(input: GetMeInput): Promise<GetMeResult> {
    try {
      const { cognitoSub, includeFlags } = input;

      // Parse include flags
      const flags = includeFlags ? includeFlags.split(',').map(f => f.trim()) : [];

      // Find user by cognitoSub
      const user = await this.prisma.user.findFirst({
        where: { cognitoSub: cognitoSub },
        include: {
          personalInfo: flags.includes('profile'),
          oauthAccounts: flags.includes('idp')
        }
      });

      if (!user) {
        throw new AppError(ErrorCodes.COMMON_NOT_FOUND, 404, 'User not found');
      }

      // Build response
      const response: GetMeResult = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          givenName: user.givenName,
          lastName: user.lastName,
          role: user.role as UserRole,
          status: user.status as UserAccountStatus,
          mfa: {
            required: false, // MFA is not required by default
            enabled: user.mfaEnabled
          },
          identity: {
            cognitoSub: user.cognitoSub
          },
          meta: {
            lastLoginAt: user.lastLoginAt?.toISOString() || null,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString()
          }
        },
        headers: {}
      };

      // Add providers if requested
      if (flags.includes('idp') && user.oauthAccounts) {
        response.user.providers = user.oauthAccounts.map(account => ({
          provider: account.provider as OAuthProvider,
          linkedAt: account.createdAt.toISOString()
        }));
      }

      // Add personal info if requested
      if (flags.includes('profile') && user.personalInfo) {
        response.user.personalInfo = {
          phone: user.personalInfo.phone,
          locale: user.personalInfo.locale,
          timeZone: user.personalInfo.timeZone
        };
      }

      // Add claims if requested
      if (flags.includes('claims')) {
        response.user.claims = {
          role: user.role,
          account_status: user.status,
          is_mfa_required: false, // MFA is not required by default
          mfa_enabled: user.mfaEnabled,
          user_id: user.id
        };
      }

      return response;
    } catch (error) {
      rethrowAppErrorOr(error, (details) => 
        new AppError(ErrorCodes.COMMON_INTERNAL_ERROR, 500, 'GetMe operation failed', details)
      );
    }
  }
}
