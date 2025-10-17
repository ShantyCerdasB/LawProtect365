import { UserRole } from '../enums/UserRole';
import { User } from '../entities/User';
import { insufficientPermissions } from '../../auth-errors/factories';

export class AdminVisibilityRules {
  /**
   * Determines if a user can view another user based on role hierarchy
   * @param viewerRole - Role of the user making the request
   * @param targetRole - Role of the user being viewed
   * @returns true if the viewer can see the target user
   */
  static canViewUser(viewerRole: UserRole, targetRole: UserRole): boolean {
    // SUPER_ADMIN can see everyone
    if (viewerRole === UserRole.SUPER_ADMIN) {
      return true;
    }
    
    // ADMIN can see everyone except SUPER_ADMIN
    if (viewerRole === UserRole.ADMIN) {
      return targetRole !== UserRole.SUPER_ADMIN;
    }
    
    // Other roles cannot use admin endpoints
    return false;
  }

  /**
   * Gets the roles that a viewer can see
   * @param viewerRole - Role of the user making the request
   * @returns Array of roles that can be viewed
   */
  static getVisibleRoles(viewerRole: UserRole): UserRole[] {
    if (viewerRole === UserRole.SUPER_ADMIN) {
      return Object.values(UserRole);
    }
    
    if (viewerRole === UserRole.ADMIN) {
      return Object.values(UserRole).filter(role => role !== UserRole.SUPER_ADMIN);
    }
    
    return [];
  }

  /**
   * Checks if a user has admin privileges
   * @param role - User role
   * @returns true if the role has admin privileges
   */
  static hasAdminPrivileges(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  }

  /**
   * Validates if a user can view a specific user (for admin detail endpoints)
   * @param viewerRole - Role of the user making the request
   * @param targetUser - Target user being viewed
   * @param viewerId - ID of the user making the request
   * @throws insufficientPermissions if user cannot view target
   */
  static validateUserVisibility(
    viewerRole: UserRole,
    targetUser: User,
    viewerId: string
  ): void {
    // Prevent self-lookup via admin endpoint
    if (targetUser.getId().toString() === viewerId) {
      throw insufficientPermissions({
        viewerRole,
        targetRole: targetUser.getRole(),
        message: 'Use /me endpoint for self-lookup'
      });
    }

    // Check if viewer can see target user
    if (!this.canViewUser(viewerRole, targetUser.getRole())) {
      throw insufficientPermissions({
        viewerRole,
        targetRole: targetUser.getRole(),
        message: 'Insufficient permissions to view this user'
      });
    }
  }
}
