/**
 * @fileoverview UserRegistrationRules - Domain rules for user registration
 * @summary Defines business rules for user registration and role assignment
 * @description This domain rule encapsulates the business logic for determining
 * initial user roles and statuses during registration.
 */

import { UserRole, UserAccountStatus } from '../enums';

/**
 * UserRegistrationRules - Domain rule for user registration
 * 
 * Encapsulates business logic for user registration including:
 * - Initial role determination
 * - Initial status determination
 * - Registration validation
 */
export class UserRegistrationRules {
  /**
   * Determines the initial role for a new user
   * @param intendedRole - Intended role from signup (optional)
   * @param defaultRole - Default role from configuration
   * @returns Initial role for the user
   */
  static determineInitialRole(
    intendedRole?: UserRole,
    defaultRole: UserRole = UserRole.CUSTOMER
  ): UserRole {
    // If intended role is provided and valid, use it
    if (intendedRole && this.isValidInitialRole(intendedRole)) {
      return intendedRole;
    }
    
    // Otherwise, use default role
    return defaultRole;
  }

  /**
   * Determines the initial status for a new user based on their role
   * @param role - User role
   * @returns Initial account status
   */
  static determineInitialStatus(role: UserRole): UserAccountStatus {
    switch (role) {
      case UserRole.LAWYER:
        return UserAccountStatus.PENDING_VERIFICATION;
      
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return UserAccountStatus.ACTIVE; // Admins are auto-approved
      
      case UserRole.CUSTOMER:
      case UserRole.UNASSIGNED:
      default:
        return UserAccountStatus.ACTIVE;
    }
  }

  /**
   * Validates if a role can be assigned during initial registration
   * @param role - Role to validate
   * @returns True if role is valid for initial assignment
   */
  static isValidInitialRole(role: UserRole): boolean {
    // All roles except UNASSIGNED can be assigned during registration
    return role !== UserRole.UNASSIGNED;
  }

  /**
   * Gets the registration flow description for a role
   * @param role - User role
   * @returns Description of the registration flow
   */
  static getRegistrationFlowDescription(role: UserRole): string {
    switch (role) {
      case UserRole.LAWYER:
        return 'Lawyer registration requires verification';
      
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return 'Admin registration requires approval';
      
      case UserRole.CUSTOMER:
        return 'Customer registration is immediate';
      
      case UserRole.UNASSIGNED:
        return 'Unassigned role requires role selection';
      
      default:
        return 'Unknown registration flow';
    }
  }

  /**
   * Determines if a user needs verification based on their role
   * @param role - User role
   * @returns True if user needs verification
   */
  static requiresVerification(role: UserRole): boolean {
    return role === UserRole.LAWYER;
  }

  /**
   * Determines if a user can be immediately active based on their role
   * @param role - User role
   * @returns True if user can be immediately active
   */
  static canBeImmediatelyActive(role: UserRole): boolean {
    return role === UserRole.CUSTOMER || role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  }

  /**
   * Gets the next steps for a user after registration
   * @param role - User role
   * @param status - User status
   * @returns Array of next steps
   */
  static getNextSteps(role: UserRole, status: UserAccountStatus): string[] {
    const steps: string[] = [];
    
    if (role === UserRole.UNASSIGNED) {
      steps.push('Select a role to continue');
    }
    
    if (status === UserAccountStatus.PENDING_VERIFICATION) {
      steps.push('Complete verification process');
    }
    
    if (role === UserRole.LAWYER && status === UserAccountStatus.ACTIVE) {
      steps.push('Complete lawyer profile setup');
    }
    
    return steps;
  }
}
