/**
 * @fileoverview SetUserRoleAdminUseCase - Orchestrates role change operations
 * @summary Use case for changing user roles with admin permissions
 * @description Handles the complete flow of role changes including validation,
 * Cognito updates, database persistence, auditing, and event publishing.
 */

import { Logger } from '@lawprotect/shared-ts';
import { UserRole } from '../../domain/enums/UserRole';
import { UserId } from '../../domain/value-objects/UserId';
import { User } from '../../domain/entities/User';
import { UserRepository } from '../../repositories/UserRepository';
import { UserService } from '../../services/UserService';
import { CognitoService } from '../../services/CognitoService';
import { AuditService } from '../../services/AuditService';
import { EventPublishingService } from '../../services/EventPublishingService';
import { RoleChangeRules } from '../../domain/rules/RoleChangeRules';
import { SetUserRoleRequest, SetUserRoleResponse } from '../../domain/schemas/SetUserRoleSchema';
import { userNotFound, roleAssignmentFailed } from '../../auth-errors/factories';

/**
 * Use case for changing user roles with admin permissions
 * 
 * Orchestrates the complete role change flow including:
 * - Permission validation
 * - Role change validation
 * - Cognito attribute updates
 * - Database updates
 * - Audit logging
 * - Event publishing
 */
export class SetUserRoleAdminUseCase {
  constructor(
    private readonly userService: UserService,
    private readonly cognitoService: CognitoService,
    private readonly auditService: AuditService,
    private readonly eventPublishingService: EventPublishingService,
    private readonly userRepository: UserRepository,
    private readonly logger: Logger
  ) {}

  /**
   * Executes the user role change use case
   * @param userId - Target user ID
   * @param request - Role change request
   * @param actorRole - Role of the admin making the change
   * @param actorId - ID of the admin making the change
   * @returns Role change response
   * @throws Error if role change fails
   */
  async execute(
    userId: string,
    request: SetUserRoleRequest,
    actorRole: UserRole,
    actorId: string
  ): Promise<SetUserRoleResponse> {
    this.logger.info('Executing SetUserRoleAdminUseCase', {
      userId,
      newRole: request.role,
      actorRole,
      actorId
    });

    try {
      // Get target user
      const targetUser = await this.userRepository.findById(new UserId(userId));
      if (!targetUser) {
        throw userNotFound({ userId });
      }

      // Validate role change permissions
      RoleChangeRules.validateRoleChange(actorRole, targetUser, request.role, actorId);

      // Check if role change is needed (idempotency)
      if (targetUser.getRole() === request.role) {
        this.logger.info('Role already set, returning current state', {
          userId,
          currentRole: targetUser.getRole()
        });
        return this.buildResponse(targetUser);
      }

      // Validate role transition
      RoleChangeRules.validateRoleTransition(targetUser.getRole(), request.role);

      // Get role change effects
      const effects = RoleChangeRules.getRoleChangeEffects(request.role);

      // Execute Cognito actions
      await this.executeCognitoActions(targetUser.getCognitoSub().toString(), request.role, effects);

      // Update user role in database
      const updatedUser = await this.userService.changeUserRole(
        new UserId(userId),
        request.role
      );

      // Create audit event
      await this.createAuditEvent(targetUser, updatedUser, request, actorId);

      // Publish integration event
      await this.publishIntegrationEvent(targetUser, updatedUser, request, actorId);

      this.logger.info('User role changed successfully', {
        userId,
        fromRole: targetUser.getRole(),
        toRole: request.role,
        actorId
      });

      return this.buildResponse(updatedUser);
    } catch (error) {
      this.logger.error('Error in SetUserRoleAdminUseCase', {
        userId,
        newRole: request.role,
        actorRole,
        actorId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Executes Cognito actions for role change
   * @param cognitoSub - Cognito user sub
   * @param newRole - New role being assigned
   * @param effects - Role change effects
   */
  private async executeCognitoActions(
    cognitoSub: string,
    newRole: UserRole,
    effects: { mfaRequired: boolean; globalSignOut: boolean }
  ): Promise<void> {
    try {
      // Update Cognito attributes
      const attributes: { [key: string]: string } = {
        'custom:role': newRole
      };

      if (effects.mfaRequired) {
        attributes['custom:is_mfa_required'] = 'true';
      } else {
        attributes['custom:is_mfa_required'] = 'false';
      }

      await this.cognitoService.adminUpdateUserAttributes(cognitoSub, attributes);

      // Force global sign out
      if (effects.globalSignOut) {
        await this.cognitoService.adminUserGlobalSignOut(cognitoSub);
      }
    } catch (error) {
      this.logger.error('Failed to execute Cognito actions for role change', {
        cognitoSub,
        newRole,
        error: error instanceof Error ? error.message : String(error)
      });
      throw roleAssignmentFailed({
        cause: `Failed to update Cognito attributes: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Creates audit event for role change
   * @param originalUser - Original user state
   * @param updatedUser - Updated user state
   * @param request - Role change request
   * @param actorId - Admin making the change
   */
  private async createAuditEvent(
    originalUser: User,
    updatedUser: User,
    request: SetUserRoleRequest,
    actorId: string
  ): Promise<void> {
    try {
      await this.auditService.userRoleChanged(
        updatedUser.getId().toString(),
        originalUser.getRole(),
        request.role,
        actorId,
        {
          reason: request.reason,
          source: 'AdminRoleChange'
        }
      );
    } catch (error) {
      this.logger.warn('Failed to create audit event for role change', {
        userId: updatedUser.getId().toString(),
        fromRole: originalUser.getRole(),
        toRole: request.role,
        actorId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Publishes integration event for role change
   * @param originalUser - Original user state
   * @param updatedUser - Updated user state
   * @param request - Role change request
   * @param actorId - Admin making the change
   */
  private async publishIntegrationEvent(
    originalUser: User,
    updatedUser: User,
    request: SetUserRoleRequest,
    actorId: string
  ): Promise<void> {
    try {
      await this.eventPublishingService.publishUserRoleChanged(
        updatedUser,
        originalUser.getRole(),
        request.role,
        {
          actorId,
          reason: request.reason,
          source: 'AdminRoleChange'
        }
      );
    } catch (error) {
      this.logger.warn('Failed to publish integration event for role change', {
        userId: updatedUser.getId().toString(),
        fromRole: originalUser.getRole(),
        toRole: request.role,
        actorId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Builds response from updated user
   * @param user - Updated user entity
   * @returns Role change response
   */
  private buildResponse(user: User): SetUserRoleResponse {
    const mfaRequired = RoleChangeRules.isMfaRequiredForRole(user.getRole());
    
    return {
      id: user.getId().toString(),
      role: user.getRole(),
      mfa: {
        required: mfaRequired
      },
      meta: {
        updatedAt: user.getUpdatedAt().toISOString()
      }
    };
  }
}
