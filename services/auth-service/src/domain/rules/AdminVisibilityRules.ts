import { UserRole } from '../enums/UserRole';

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
}
