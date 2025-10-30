import { PrismaClient } from '@prisma/client';
import { AppError, ErrorCodes, rethrowAppErrorOr } from '@lawprotect/shared-ts';
import { UserRole } from '../../../src/domain/enums/UserRole';
import { SetUserRoleRequest, SetUserRoleResponse } from '../../../src/domain/schemas/SetUserRoleSchema';

export class TestSetUserRoleAdminUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(
    userId: string,
    request: SetUserRoleRequest,
    actorRole: UserRole,
    actorId: string
  ): Promise<SetUserRoleResponse> {
    try {
      // Prevent self-role change
      if (userId === actorId) {
        throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, 'Cannot change your own role');
      }

      // Find target user
      const targetUser = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!targetUser) {
        throw new AppError(ErrorCodes.COMMON_NOT_FOUND, 404, 'User not found');
      }

      // Validate actor permissions
      this.validateActorPermissions(actorRole, targetUser.role as UserRole, request.role);

      // Validate role transition
      this.validateRoleTransition(targetUser.role as UserRole, request.role);

      // Update user role
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          role: request.role,
          updatedAt: new Date()
        }
      });

      // Create audit event
      await this.prisma.userAuditEvent.create({
        data: {
          userId: userId,
          action: 'ROLE_CHANGED',
          metadata: {
            oldRole: targetUser.role,
            newRole: request.role,
            reason: request.reason || 'Role changed by admin',
            actorId: actorId,
            actorRole: actorRole
          }
        }
      });

      // Build response
      const response: SetUserRoleResponse = {
        id: updatedUser.id,
        role: updatedUser.role as UserRole,
        mfa: {
          required: this.isMfaRequiredForRole(request.role)
        },
        meta: {
          updatedAt: updatedUser.updatedAt.toISOString()
        }
      };

      return response;
    } catch (error) {
      rethrowAppErrorOr(error, (details) => 
        new AppError(ErrorCodes.COMMON_INTERNAL_ERROR, 500, 'Failed to change user role', details)
      );
    }
  }

  private validateActorPermissions(
    actorRole: UserRole,
    targetRole: UserRole,
    newRole: UserRole
  ): void {
    // ADMIN cannot touch SUPER_ADMIN
    if (actorRole === UserRole.ADMIN && 
        (targetRole === UserRole.SUPER_ADMIN || newRole === UserRole.SUPER_ADMIN)) {
      throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, 'ADMIN cannot modify SUPER_ADMIN roles');
    }

    // ADMIN cannot modify other ADMIN
    if (actorRole === UserRole.ADMIN && targetRole === UserRole.ADMIN) {
      throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, 'ADMIN cannot modify other ADMIN roles');
    }
  }

  private validateRoleTransition(currentRole: UserRole, newRole: UserRole): void {
    if (currentRole === newRole) {
      return;
    }

    // EXTERNAL_USER can only be assigned to new users or from EXTERNAL_USER
    if (newRole === UserRole.EXTERNAL_USER && currentRole !== UserRole.UNASSIGNED) {
      throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, 'Cannot assign EXTERNAL_USER role to existing users');
    }

    // No role can transition TO EXTERNAL_USER except from UNASSIGNED
    if (newRole === UserRole.EXTERNAL_USER && currentRole !== UserRole.UNASSIGNED) {
      throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, 'Only UNASSIGNED users can become EXTERNAL_USER');
    }
  }

  private isMfaRequiredForRole(role: UserRole): boolean {
    return role === UserRole.SUPER_ADMIN;
  }
}
