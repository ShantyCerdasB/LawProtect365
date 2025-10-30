/**
 * @fileoverview TestSetUserStatusAdminUseCase - Simplified SetUserStatusAdmin use case for integration tests
 * @summary Test-specific implementation that bypasses complex service calls
 * @description This use case is designed for integration tests, focusing on database
 * interactions and business logic validation while mocking external dependencies.
 */

import { PrismaClient } from '@prisma/client';
import { AppError, ErrorCodes, rethrowAppErrorOr } from '@lawprotect/shared-ts';
import { UserRole } from '../../../src/domain/enums/UserRole';
import { UserAccountStatus } from '../../../src/domain/enums/UserAccountStatus';
import { SetUserStatusBody, SetUserStatusResponse } from '../../../src/domain/schemas/SetUserStatusSchema';

export class TestSetUserStatusAdminUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(
    userId: string,
    request: SetUserStatusBody,
    actorRole: UserRole,
    actorId: string
  ): Promise<SetUserStatusResponse> {
    try {
      // Prevent self-status change
      if (userId === actorId) {
        throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, 'Cannot change your own status');
      }

      // Find target user
      const targetUser = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!targetUser) {
        throw new AppError(ErrorCodes.COMMON_NOT_FOUND, 404, 'User not found');
      }

      // Validate actor permissions
      this.validateActorPermissions(actorRole, targetUser.role as UserRole, actorId);

      // Validate status transition
      this.validateStatusTransition(targetUser.status as UserAccountStatus, request.status);

      // Prepare update data
      const updateData: any = {
        status: request.status,
        updatedAt: new Date()
      };

      // Handle specific status fields
      if (request.status === UserAccountStatus.SUSPENDED && request.suspendUntil) {
        updateData.suspendedUntil = new Date(request.suspendUntil);
      } else if (request.status !== UserAccountStatus.SUSPENDED) {
        updateData.suspendedUntil = null;
      }

      if (request.status === UserAccountStatus.DELETED) {
        updateData.deletedAt = new Date();
      } else {
        updateData.deletedAt = null;
      }

      // Update user status
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      // Create audit event
      await this.prisma.userAuditEvent.create({
        data: {
          userId: userId,
          action: 'ACCOUNT_STATUS_CHANGED',
          metadata: {
            oldStatus: targetUser.status,
            newStatus: request.status,
            reason: request.reason || 'Status changed by admin',
            suspendUntil: request.suspendUntil,
            actorId: actorId,
            actorRole: actorRole
          }
        }
      });

      // Build response
      const response: SetUserStatusResponse = {
        id: updatedUser.id,
        status: updatedUser.status as UserAccountStatus,
        suspendedUntil: updatedUser.suspendedUntil?.toISOString(),
        deactivationReason: request.reason,
        deletedAt: updatedUser.deletedAt?.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString()
      };

      return response;
    } catch (error) {
      rethrowAppErrorOr(error, (details) => 
        new AppError(ErrorCodes.COMMON_INTERNAL_ERROR, 500, 'Failed to change user status', details)
      );
    }
  }

  private validateActorPermissions(
    actorRole: UserRole,
    targetRole: UserRole,
    _actorId: string
  ): void {
    // ADMIN cannot modify SUPER_ADMIN
    if (actorRole === UserRole.ADMIN && targetRole === UserRole.SUPER_ADMIN) {
      throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, 'ADMIN cannot modify SUPER_ADMIN users');
    }

    // Only SUPER_ADMIN can modify other ADMIN users
    if (targetRole === UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
      throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, 'Only SUPER_ADMIN can modify ADMIN users');
    }
  }

  private validateStatusTransition(currentStatus: UserAccountStatus, newStatus: UserAccountStatus): void {
    if (currentStatus === newStatus) {
      return;
    }

    // DELETED users cannot be reactivated
    if (currentStatus === UserAccountStatus.DELETED) {
      throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, 'Cannot reactivate deleted users');
    }

    // SUSPENDED users can be reactivated or deleted
    if (currentStatus === UserAccountStatus.SUSPENDED) {
      if (newStatus === UserAccountStatus.INACTIVE) {
        throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, 'Cannot deactivate suspended users');
      }
    }

    // INACTIVE users can be reactivated or deleted
    if (currentStatus === UserAccountStatus.INACTIVE) {
      if (newStatus === UserAccountStatus.SUSPENDED) {
        throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, 'Cannot suspend inactive users');
      }
    }
  }
}
