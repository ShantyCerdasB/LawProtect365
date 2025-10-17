/**
 * @fileoverview AdminStatusChangeRules - Domain rules for admin status changes
 * @summary Business rules for admin authorization in status changes
 * @description Defines authorization rules for admin status change operations
 */

import { UserRole } from '../enums';
import { User } from '../entities/User';
import { insufficientAdminPermissions } from '../../auth-errors/factories';

export class AdminStatusChangeRules {
  /**
   * Validates if an admin can change the status of a target user
   * @param actorRole - Role of the admin making the change
   * @param targetUser - Target user being modified
   * @param actorId - ID of the admin making the change
   * @throws insufficientAdminPermissions if not allowed
   */
  static validateAdminPermissions(
    actorRole: UserRole,
    targetUser: User,
    actorId: string
  ): void {
    // Prevent self-modification
    if (targetUser.getId().toString() === actorId) {
      throw insufficientAdminPermissions({
        actorRole,
        targetRole: targetUser.getRole(),
        message: 'Cannot change your own status'
      });
    }

    // ADMIN cannot modify SUPER_ADMIN
    if (actorRole === UserRole.ADMIN && targetUser.getRole() === UserRole.SUPER_ADMIN) {
      throw insufficientAdminPermissions({
        actorRole,
        targetRole: targetUser.getRole(),
        message: 'ADMIN cannot modify SUPER_ADMIN users'
      });
    }

    // Only SUPER_ADMIN can modify other ADMIN users
    if (targetUser.getRole() === UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
      throw insufficientAdminPermissions({
        actorRole,
        targetRole: targetUser.getRole(),
        message: 'Only SUPER_ADMIN can modify ADMIN users'
      });
    }
  }

  /**
   * Checks if an admin has permission to change user status
   * @param actorRole - Role of the admin
   * @param targetRole - Role of the target user
   * @param actorId - ID of the admin
   * @param targetId - ID of the target user
   * @returns True if permission is granted
   */
  static hasPermission(
    actorRole: UserRole,
    targetRole: UserRole,
    actorId: string,
    targetId: string
  ): boolean {
    // Prevent self-modification
    if (actorId === targetId) {
      return false;
    }

    // SUPER_ADMIN can modify anyone (except themselves)
    if (actorRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // ADMIN can modify CUSTOMER and LAWYER
    if (actorRole === UserRole.ADMIN) {
      return [UserRole.CUSTOMER, UserRole.LAWYER].includes(targetRole);
    }

    return false;
  }

  /**
   * Gets the required role to modify a target role
   * @param targetRole - Role of the target user
   * @returns Required role to modify the target
   */
  static getRequiredRole(targetRole: UserRole): UserRole {
    switch (targetRole) {
      case UserRole.SUPER_ADMIN:
        return UserRole.SUPER_ADMIN;
      case UserRole.ADMIN:
        return UserRole.SUPER_ADMIN;
      case UserRole.LAWYER:
      case UserRole.CUSTOMER:
        return UserRole.ADMIN;
      default:
        return UserRole.ADMIN;
    }
  }
}
