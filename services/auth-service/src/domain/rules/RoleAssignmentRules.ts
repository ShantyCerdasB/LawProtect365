/**
 * @fileoverview RoleAssignmentRules - Domain rules for role assignment
 * @summary Validates role assignment business rules and compliance requirements
 * @description This domain rule encapsulates all business validation logic for role assignment,
 * ensuring compliance with role hierarchy and business constraints.
 */

import { UserRole } from '../enums/UserRole';
import { UserAccountStatus } from '../enums/UserAccountStatus';
import { 
  invalidRoleAssignment,
  insufficientPermissions,
  roleAssignmentConflict
} from '../../auth-errors';

/**
 * RoleAssignmentRules - Domain rule for role assignment validation
 * 
 * Encapsulates business validation logic for role assignment including:
 * - Role hierarchy validation
 * - Permission requirements
 * - Business rule compliance
 */
export class RoleAssignmentRules {
  /**
   * Validates if a user can be assigned a specific role
   * @param currentUserRole - Role of the user making the assignment
   * @param targetUserStatus - Status of the user being assigned the role
   * @param newRole - Role being assigned
   * @param currentRoles - Current roles of the target user
   * @throws invalidRoleAssignment when role assignment is not allowed
   */
  static validateRoleAssignment(
    currentUserRole: UserRole,
    targetUserStatus: UserAccountStatus,
    newRole: UserRole,
    currentRoles: UserRole[]
  ): void {
    // Validate user status
    if (targetUserStatus === UserAccountStatus.DELETED) {
      throw invalidRoleAssignment('Cannot assign roles to deleted users');
    }

    if (targetUserStatus === UserAccountStatus.PENDING_VERIFICATION) {
      throw invalidRoleAssignment('Cannot assign roles to unverified users');
    }

    // Validate role hierarchy
    RoleAssignmentRules.validateRoleHierarchy(currentUserRole, newRole);

    // Validate role conflicts
    RoleAssignmentRules.validateRoleConflicts(newRole, currentRoles);
  }

  /**
   * Validates role hierarchy permissions
   * @param currentUserRole - Role of the user making the assignment
   * @param newRole - Role being assigned
   * @throws insufficientPermissions when user lacks permission to assign role
   */
  private static validateRoleHierarchy(
    currentUserRole: UserRole,
    newRole: UserRole
  ): void {
    const roleHierarchy = {
      [UserRole.UNASSIGNED]: 0,
      [UserRole.CUSTOMER]: 1,
      [UserRole.LAWYER]: 2,
      [UserRole.ADMIN]: 3,
      [UserRole.SUPER_ADMIN]: 4,
      [UserRole.EXTERNAL_USER]: 0
    };

    const currentLevel = roleHierarchy[currentUserRole];
    const targetLevel = roleHierarchy[newRole];

    if (currentLevel < targetLevel) {
      throw insufficientPermissions(
        `User with role ${currentUserRole} cannot assign role ${newRole}`
      );
    }
  }

  /**
   * Validates role conflicts
   * @param newRole - Role being assigned
   * @param currentRoles - Current roles of the target user
   * @throws roleAssignmentConflict when role conflicts exist
   */
  private static validateRoleConflicts(
    newRole: UserRole,
    currentRoles: UserRole[]
  ): void {
    // SUPER_ADMIN cannot have other roles
    if (newRole === UserRole.SUPER_ADMIN && currentRoles.length > 0) {
      throw roleAssignmentConflict('SUPER_ADMIN cannot have other roles');
    }

    // Cannot assign other roles if user is already SUPER_ADMIN
    if (currentRoles.includes(UserRole.SUPER_ADMIN) && newRole !== UserRole.SUPER_ADMIN) {
      throw roleAssignmentConflict('Cannot assign roles to SUPER_ADMIN users');
    }
  }

  /**
   * Validates if a user can remove a specific role
   * @param currentUserRole - Role of the user making the removal
   * @param roleToRemove - Role being removed
   * @param targetUserRoles - Current roles of the target user
   * @throws insufficientPermissions when user lacks permission to remove role
   */
  static validateRoleRemoval(
    currentUserRole: UserRole,
    roleToRemove: UserRole,
    targetUserRoles: UserRole[]
  ): void {
    // Validate role hierarchy
    RoleAssignmentRules.validateRoleHierarchy(currentUserRole, roleToRemove);

    // Cannot remove the last role
    if (targetUserRoles.length === 1 && targetUserRoles.includes(roleToRemove)) {
      throw invalidRoleAssignment('Cannot remove the last role from a user');
    }
  }

  /**
   * Gets the minimum role level required to manage a specific role
   * @param role - Role to manage
   * @returns Minimum role level required
   */
  static getMinimumRoleLevel(role: UserRole): UserRole {
    const roleRequirements = {
      [UserRole.UNASSIGNED]: UserRole.ADMIN,
      [UserRole.CUSTOMER]: UserRole.ADMIN,
      [UserRole.LAWYER]: UserRole.ADMIN,
      [UserRole.ADMIN]: UserRole.SUPER_ADMIN,
      [UserRole.SUPER_ADMIN]: UserRole.SUPER_ADMIN,
      [UserRole.EXTERNAL_USER]: UserRole.ADMIN
    };

    return roleRequirements[role];
  }
}
