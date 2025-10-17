/**
 * @fileoverview GetUserByIdAdminUseCase - Orchestrates user detail retrieval
 * @summary Use case for getting user details with admin permissions
 * @description Handles the complete flow of user detail retrieval including validation,
 * visibility checks, and optional data loading (personal info, OAuth accounts).
 */

import { Logger } from '@lawprotect/shared-ts';
import { UserRole } from '../../domain/enums/UserRole';
import { AdminIncludeField } from '../../domain/enums/AdminIncludeField';
import { UserId } from '../../domain/value-objects/UserId';
import { UserRepository } from '../../repositories/UserRepository';
import { AdminVisibilityRules } from '../../domain/rules/AdminVisibilityRules';
import { GetUserByIdResponse } from '../../domain/schemas/GetUserByIdSchema';
import { userNotFound } from '../../auth-errors/factories';

/**
 * Use case for getting user details with admin permissions
 * 
 * Orchestrates the complete user detail retrieval flow including:
 * - Permission validation
 * - Visibility validation
 * - User data loading
 * - Optional includes (personal info, OAuth accounts)
 */
export class GetUserByIdAdminUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: Logger
  ) {}

  /**
   * Executes the user detail retrieval use case
   * @param userId - Target user ID
   * @param includes - Optional includes for related data
   * @param viewerRole - Role of the admin making the request
   * @param viewerId - ID of the admin making the request
   * @returns User detail response
   * @throws Error if user not found or insufficient permissions
   */
  async execute(
    userId: string,
    includes: AdminIncludeField[],
    viewerRole: UserRole,
    viewerId: string
  ): Promise<GetUserByIdResponse> {
    this.logger.info('Executing GetUserByIdAdminUseCase', {
      userId,
      includes,
      viewerRole,
      viewerId
    });

    try {
      // Get user with includes
      const user = await this.userRepository.findByIdWithIncludes(
        new UserId(userId),
        includes
      );

      if (!user) {
        throw userNotFound({ userId });
      }

      // Validate visibility (this will throw if user cannot be viewed)
      AdminVisibilityRules.validateUserVisibility(
        viewerRole,
        user,
        viewerId
      );

      // Load additional data if requested
      const response = await this.buildResponse(user, includes);

      this.logger.info('User detail retrieved successfully', {
        userId,
        viewerRole,
        viewerId,
        includes
      });

      return response;
    } catch (error) {
      this.logger.error('Error in GetUserByIdAdminUseCase', {
        userId,
        viewerRole,
        viewerId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Builds the response with optional includes
   * @param user - User data from repository
   * @param includes - Requested includes
   * @returns Complete user detail response
   */
  private async buildResponse(
    user: any,
    includes: AdminIncludeField[]
  ): Promise<GetUserByIdResponse> {
    const response: GetUserByIdResponse = {
      id: user.id,
      cognitoSub: user.cognitoSub,
      email: user.email,
      name: user.name,
      givenName: user.givenName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      mfaEnabled: user.mfaEnabled,
      lastLoginAt: user.lastLoginAt,
      suspendedUntil: user.suspendedUntil,
      deactivationReason: user.deactivationReason,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Add personal info if requested and available
    if (includes.includes(AdminIncludeField.PROFILE) && user.personalInfo) {
      response.personalInfo = {
        phone: user.personalInfo.phone,
        locale: user.personalInfo.locale,
        timeZone: user.personalInfo.timeZone
      };
    }

    // Add OAuth providers if requested and available
    if (includes.includes(AdminIncludeField.IDP) && user.providers) {
      response.providers = user.providers;
    }

    return response;
  }
}
