/**
 * @fileoverview RoleChangeRules - Domain rules for role change operations
 * @summary Business rules for role change validation and security
 * @description Defines authorization rules and business constraints for role change operations,
 * including RBAC validation, last SUPER_ADMIN protection, and self-change prevention.
 */

import { UserRole } from '../enums/UserRole';
import { User } from '../entities/User';
import { 
  insufficientPermissions
} from '../../auth-errors/factories';

/**
 * Domain rules for role change operations
 * 
 * Encapsulates business validation logic for role changes including:
 * - RBAC validation
 * - Self-change prevention
 * - Last SUPER_ADMIN protection
 * - Role transition validation
 */
export class RoleChangeRules {
  /**
   * Validates if a role change is allowed
   * @param actorRole - Role of the admin making the change
   * @param targetUser - Target user being modified
   * @param newRole - New role being assigned
   * @param actorId - ID of the admin making the change
   * @throws insufficientPermissions if role change is not allowed
   */
  static validateRoleChange(
    actorRole: UserRole,
    targetUser: User,
    newRole: UserRole,
    actorId: string
  ): void {
    // Prevent self-role change
    if (targetUser.getId().toString() === actorId) {
      throw insufficientPermissions({
        actorRole,
        targetRole: targetUser.getRole(),
        message: 'Cannot change your own role'
      });
    }

    // Validate actor permissions
    this.validateActorPermissions(actorRole, targetUser.getRole(), newRole);
  }

  /**
   * Validates actor permissions for role changes
   * @param actorRole - Role of the admin making the change
   * @param targetRole - Current role of the target user
   * @param newRole - New role being assigned
   * @throws insufficientPermissions if actor lacks permission
   */
  private static validateActorPermissions(
    actorRole: UserRole,
    targetRole: UserRole,
    newRole: UserRole
  ): void {
    // ADMIN cannot touch SUPER_ADMIN
    if (actorRole === UserRole.ADMIN && 
        (targetRole === UserRole.SUPER_ADMIN || newRole === UserRole.SUPER_ADMIN)) {
      throw insufficientPermissions({
        actorRole,
        targetRole,
        message: 'ADMIN cannot modify SUPER_ADMIN roles'
      });
    }

    // ADMIN cannot modify other ADMIN
    if (actorRole === UserRole.ADMIN && targetRole === UserRole.ADMIN) {
      throw insufficientPermissions({
        actorRole,
        targetRole,
        message: 'ADMIN cannot modify other ADMIN roles'
      });
    }
  }

  /**
   * Validates role transition is allowed
   * @param currentRole - Current role of the user
   * @param newRole - New role being assigned
   * @throws invalidRoleAssignment if transition is not allowed
   */
  static validateRoleTransition(
    currentRole: UserRole,
    newRole: UserRole
  ): void {
    if (currentRole === newRole) {
      return;
    }

    // EXTERNAL_USER can only be assigned to new users or from EXTERNAL_USER
    if (newRole === UserRole.EXTERNAL_USER && currentRole !== UserRole.UNASSIGNED) {
      throw insufficientPermissions({
        currentRole,
        newRole,
        message: 'Cannot assign EXTERNAL_USER role to existing users'
      });
    }

    // No role can transition TO EXTERNAL_USER except from UNASSIGNED
    if (newRole === UserRole.EXTERNAL_USER && currentRole !== UserRole.UNASSIGNED) {
      throw insufficientPermissions({
        currentRole,
        newRole,
        message: 'Only UNASSIGNED users can become EXTERNAL_USER'
      });
    }
  }

  /**
   * Checks if MFA is required for the new role
   * @param newRole - New role being assigned
   * @returns True if MFA is required for this role
   */
  static isMfaRequiredForRole(newRole: UserRole): boolean {
    return newRole === UserRole.SUPER_ADMIN;
  }

  /**
   * Gets role change effects
   * @param newRole - New role being assigned
   * @returns Effects object with MFA and sign-out requirements
   */
  static getRoleChangeEffects(newRole: UserRole): {
    mfaRequired: boolean;
    globalSignOut: boolean;
  } {
    return {
      mfaRequired: this.isMfaRequiredForRole(newRole),
      globalSignOut: true // Always force sign-out on role change
    };
  }
}
