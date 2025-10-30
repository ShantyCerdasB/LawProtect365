/**
 * @fileoverview PatchMeUseCase - Orchestrates user profile updates
 * @summary Use case for PATCH /me endpoint
 * @description Handles the complete flow of user profile updates including validation,
 * business rules, and response building for the authenticated user.
 */

import { Logger } from '@lawprotect/shared-ts';
import { missingRequiredFields } from '../../auth-errors/factories';
import { UserId } from '../../domain/value-objects/UserId';
import { UserService } from '../../services/UserService';
import { AuditService } from '../../services/AuditService';
import { UserProfileRules } from '../../domain/rules/UserProfileRules';
import { PatchMeRequest, PatchMeResponse } from '../../domain/schemas/PatchMeSchema';

/**
 * Use case for updating user profile
 * 
 * Orchestrates the complete user profile update flow including:
 * - Input validation
 * - Business rules validation
 * - Profile update execution
 * - Audit logging
 */
export class PatchMeUseCase {
  constructor(
    private readonly userService: UserService,
    private readonly auditService: AuditService,
    private readonly logger: Logger
  ) {}

  /**
   * Executes the user profile update use case
   * @param userId - Authenticated user ID
   * @param request - Profile update request
   * @returns Updated profile response
   * @throws Error if validation fails or update fails
   */
  async execute(
    userId: string,
    request: PatchMeRequest
  ): Promise<PatchMeResponse> {
    this.logger.info('Executing PatchMeUseCase', {
      userId,
      requestFields: Object.keys(request)
    });

    try {
      // Sanitize first to normalize inputs before validation
      const sanitizedRequest = this.sanitizeRequest(request);

      // Ensure at least one field provided after sanitization
      const hasAnyField = (
        sanitizedRequest.name !== undefined ||
        sanitizedRequest.givenName !== undefined ||
        sanitizedRequest.lastName !== undefined ||
        (sanitizedRequest.personalInfo !== undefined &&
          Object.keys(sanitizedRequest.personalInfo).length > 0)
      );
      if (!hasAnyField) {
        throw missingRequiredFields({ message: 'No updatable fields provided' });
      }

      // Validate sanitized request against domain rules
      UserProfileRules.validateProfileUpdate(sanitizedRequest);

      // Execute profile update
      const response = await this.userService.updateUserProfile(
        new UserId(userId),
        sanitizedRequest
      );

      // Log audit event if changes were made
      if (response.meta.changed) {
        await this.createAuditEvent(userId, request, response);
      }

      this.logger.info('User profile updated successfully', {
        userId,
        changed: response.meta.changed,
        updatedAt: response.meta.updatedAt
      });

      return response;
    } catch (error) {
      this.logger.error('Error in PatchMeUseCase', {
        userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Sanitizes request data
   * @param request - Original request
   * @returns Sanitized request
   */
  private sanitizeRequest(request: PatchMeRequest): PatchMeRequest {
    const sanitized: PatchMeRequest = {};

    if (request.name !== undefined) {
      const sanitizedName = UserProfileRules.sanitizeString(request.name);
      if (sanitizedName.length > 0) {
        sanitized.name = sanitizedName;
      }
    }
    
    if (request.givenName !== undefined) {
      const sanitizedGivenName = UserProfileRules.sanitizeString(request.givenName);
      if (sanitizedGivenName.length > 0) {
        sanitized.givenName = sanitizedGivenName;
      }
    }
    
    if (request.lastName !== undefined) {
      const sanitizedLastName = UserProfileRules.sanitizeString(request.lastName);
      if (sanitizedLastName.length > 0) {
        sanitized.lastName = sanitizedLastName;
      }
    }

    if (request.personalInfo) {
      sanitized.personalInfo = {};
      
      if (request.personalInfo.phone !== undefined) {
        const trimmedPhone = request.personalInfo.phone.trim();
        if (trimmedPhone.length > 0) {
          sanitized.personalInfo.phone = trimmedPhone;
        }
      }
      
      if (request.personalInfo.locale !== undefined) {
        const trimmedLocale = request.personalInfo.locale.trim();
        if (trimmedLocale.length > 0) {
          sanitized.personalInfo.locale = trimmedLocale;
        }
      }
      
      if (request.personalInfo.timeZone !== undefined) {
        const trimmedTimeZone = request.personalInfo.timeZone.trim();
        if (trimmedTimeZone.length > 0) {
          sanitized.personalInfo.timeZone = trimmedTimeZone;
        }
      }
    }

    return sanitized;
  }

  /**
   * Creates audit event for profile update
   * @param userId - User ID
   * @param request - Update request
   * @param response - Update response
   */
  private async createAuditEvent(
    userId: string,
    request: PatchMeRequest,
    response: PatchMeResponse
  ): Promise<void> {
    try {
      const changedFields: string[] = [];
      
      if (request.name !== undefined) {
        changedFields.push('name');
      }
      if (request.givenName !== undefined) {
        changedFields.push('givenName');
      }
      if (request.lastName !== undefined) {
        changedFields.push('lastName');
      }
      if (request.personalInfo) {
        if (request.personalInfo.phone !== undefined) {
          changedFields.push('phone');
        }
        if (request.personalInfo.locale !== undefined) {
          changedFields.push('locale');
        }
        if (request.personalInfo.timeZone !== undefined) {
          changedFields.push('timeZone');
        }
      }

      // Only create audit event if there were actual changes
      if (changedFields.length > 0 && response.meta.changed) {
        await this.auditService.userProfileUpdated(userId, changedFields, {
          source: 'PatchMeUseCase',
          updatedAt: response.meta.updatedAt,
          requestFields: Object.keys(request).filter(key => request[key as keyof PatchMeRequest] !== undefined)
        });
      }
    } catch (error) {
      // Don't fail the main operation if audit fails
      this.logger.warn('Failed to create audit event for profile update', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
