/**
 * @fileoverview SetUserStatusAdminUseCase - Application service for admin user status changes
 * @summary Orchestrates user status changes with business rules and Cognito integration
 * @description Handles the business logic for changing user status in admin operations,
 * including validation, authorization, Cognito effects, and audit trail creation.
 */

import { UserService } from '../../services/UserService';
import { CognitoService } from '../../services/CognitoService';
import { AuditService } from '../../services/AuditService';
import { EventPublishingService } from '../../services/EventPublishingService';
import { UserRepository } from '../../repositories/UserRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { UserRole, UserAccountStatus } from '../../domain/enums';
import { SetUserStatusRequest, SetUserStatusResponse } from '../../domain/interfaces/admin';
import { UserLifecycleRules, AdminStatusChangeRules } from '../../domain/rules';
import { Logger } from '@lawprotect/shared-ts';
import { 
  userNotFound
} from '../../auth-errors/factories';

export class SetUserStatusAdminUseCase {
  constructor(
    private readonly userService: UserService,
    private readonly cognitoService: CognitoService,
    private readonly _auditService: AuditService,
    private readonly _eventPublishingService: EventPublishingService,
    private readonly userRepository: UserRepository,
    private readonly logger: Logger
  ) {}

  /**
   * Executes the user status change use case
   * @param userId - Target user ID
   * @param request - Status change request
   * @param actorRole - Role of the admin making the change
   * @param actorId - ID of the admin making the change
   * @returns Status change response
   * @throws Error if status change fails
   */
  async execute(
    userId: string,
    request: SetUserStatusRequest,
    actorRole: UserRole,
    actorId: string
  ): Promise<SetUserStatusResponse> {
    this.logger.info('Executing SetUserStatusAdminUseCase', {
      userId,
      newStatus: request.status,
      actorRole,
      actorId
    });

    try {
      // Get target user
      const targetUser = await this.userRepository.findById(new UserId(userId));
      if (!targetUser) {
        throw userNotFound({ userId });
      }

      // Validate admin permissions
      AdminStatusChangeRules.validateAdminPermissions(actorRole, targetUser, actorId);

      // Check if status change is needed (idempotency)
      if (targetUser.getStatus() === request.status) {
        this.logger.info('Status already set, returning current state', {
          userId,
          currentStatus: targetUser.getStatus()
        });
        return this.buildResponse(targetUser);
      }

      // Validate status transition
      UserLifecycleRules.validateTransition(targetUser.getStatus(), request.status);
      UserLifecycleRules.validatePendingVerificationTransition(targetUser, request.status);

      // Get status effects
      const effects = UserLifecycleRules.getStatusEffects(request.status);

      // Execute Cognito actions
      await this.executeCognitoActions(targetUser.getCognitoSub().toString(), effects);

      // Update user status in database
      const suspendedUntil = request.suspendUntil ? new Date(request.suspendUntil) : undefined;
      const updatedUser = await this.userService.changeUserStatus(
        new UserId(userId),
        request.status,
        new UserId(actorId),
        request.reason,
        suspendedUntil
      );

      // Create audit event
      await this.createAuditEvent(targetUser, updatedUser, request, actorId);

      // Publish integration event
      await this.publishIntegrationEvent(targetUser, updatedUser, request, actorId);

      this.logger.info('User status changed successfully', {
        userId,
        fromStatus: targetUser.getStatus(),
        toStatus: request.status,
        actorId
      });

      return this.buildResponse(updatedUser);
    } catch (error) {
      this.logger.error('Error in SetUserStatusAdminUseCase', {
        userId,
        newStatus: request.status,
        actorRole,
        actorId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Executes Cognito actions based on status effects
   * @param cognitoSub - Cognito user sub
   * @param effects - Status effects to apply
   */
  private async executeCognitoActions(
    cognitoSub: string,
    effects: { enableUser: boolean; disableUser: boolean; globalSignOut: boolean }
  ): Promise<void> {
    const { enableUser, disableUser, globalSignOut } = effects;

    if (enableUser) {
      await this.cognitoService.adminEnableUser(cognitoSub);
    }

    if (disableUser) {
      await this.cognitoService.adminDisableUser(cognitoSub);
    }

    if (globalSignOut) {
      await this.cognitoService.adminUserGlobalSignOut(cognitoSub);
    }
  }

  /**
   * Creates audit event for status change
   * @param originalUser - Original user state
   * @param updatedUser - Updated user state
   * @param request - Status change request
   * @param actorId - Admin making the change
   */
  private async createAuditEvent(
    originalUser: any,
    updatedUser: any,
    request: SetUserStatusRequest,
    actorId: string
  ): Promise<void> {
    try {
      await this._auditService.userStatusChanged(
        updatedUser.getId().toString(),
        originalUser.getStatus(),
        request.status,
        actorId,
        {
          reason: request.reason,
          suspendedUntil: request.suspendUntil,
          source: 'AdminStatusChange'
        }
      );
    } catch (error) {
      this.logger.warn('Failed to create audit event for status change', {
        userId: updatedUser.getId().toString(),
        fromStatus: originalUser.getStatus(),
        toStatus: request.status,
        actorId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Publishes integration event for status change
   * @param originalUser - Original user state
   * @param updatedUser - Updated user state
   * @param request - Status change request
   * @param actorId - Admin making the change
   */
  private async publishIntegrationEvent(
    originalUser: any,
    updatedUser: any,
    request: SetUserStatusRequest,
    actorId: string
  ): Promise<void> {
    try {
      await this._eventPublishingService.publishUserStatusChanged(
        updatedUser,
        originalUser.getStatus(),
        request.status,
        {
          actorId,
          reason: request.reason,
          suspendedUntil: request.suspendUntil,
          source: 'AdminStatusChange'
        }
      );
    } catch (error) {
      this.logger.warn('Failed to publish integration event for status change', {
        userId: updatedUser.getId().toString(),
        fromStatus: originalUser.getStatus(),
        toStatus: request.status,
        actorId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Builds response from updated user
   * @param user - Updated user entity
   * @returns Status change response
   */
  private buildResponse(user: any): SetUserStatusResponse {
    const response: SetUserStatusResponse = {
      id: user.getId().toString(),
      status: user.getStatus(),
      updatedAt: user.getUpdatedAt().toISOString()
    };

    // Add optional fields based on status
    if (user.getStatus() === UserAccountStatus.SUSPENDED && user.getSuspendedUntil()) {
      response.suspendedUntil = user.getSuspendedUntil()!.toISOString();
    }

    if (user.getDeactivationReason()) {
      response.deactivationReason = user.getDeactivationReason();
    }

    if (user.getStatus() === UserAccountStatus.DELETED && user.getDeletedAt()) {
      response.deletedAt = user.getDeletedAt()!.toISOString();
    }

    return response;
  }
}
