/**
 * @fileoverview MfaPolicyRules - Domain rules for MFA policy enforcement
 * @summary Validates MFA policy business rules and compliance requirements
 * @description This domain rule encapsulates all business validation logic for MFA policies,
 * ensuring compliance with security requirements and business constraints.
 */

import { UserRole } from '../enums/UserRole';
import { UserAccountStatus } from '../enums/UserAccountStatus';
import { 
  mfaRequired,
  mfaPolicyViolation,
  invalidMfaConfiguration
} from '../../auth-errors';

/**
 * MfaPolicyRules - Domain rule for MFA policy validation
 * 
 * Encapsulates business validation logic for MFA policies including:
 * - MFA requirement validation
 * - Policy compliance checking
 * - Security rule enforcement
 */
export class MfaPolicyRules {
  /**
   * Validates if MFA is required for a specific role
   * @param role - User role to check
   * @param isMfaEnabled - Current MFA status
   * @param isOptional - Whether MFA is optional for this role
   * @throws mfaRequired when MFA is required but not enabled
   */
  static validateMfaRequirement(
    role: UserRole,
    isMfaEnabled: boolean,
    isOptional: boolean = false
  ): void {
    const mfaRequiredRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
    
    if (mfaRequiredRoles.includes(role) && !isMfaEnabled && !isOptional) {
      throw mfaRequired(`MFA is required for role ${role}`);
    }
  }

  /**
   * Validates MFA policy compliance for user status changes
   * @param currentStatus - Current user status
   * @param newStatus - New user status
   * @param role - User role
   * @param isMfaEnabled - Current MFA status
   * @throws mfaPolicyViolation when status change violates MFA policy
   */
  static validateMfaPolicyForStatusChange(
    currentStatus: UserAccountStatus,
    newStatus: UserAccountStatus,
    role: UserRole,
    isMfaEnabled: boolean
  ): void {
    // If activating a user with MFA-required role, ensure MFA is enabled
    if (currentStatus === UserAccountStatus.PENDING_VERIFICATION && 
        newStatus === UserAccountStatus.ACTIVE) {
      MfaPolicyRules.validateMfaRequirement(role, isMfaEnabled);
    }
  }

  /**
   * Validates MFA policy compliance for role changes
   * @param currentRoles - Current user roles
   * @param newRoles - New user roles
   * @param isMfaEnabled - Current MFA status
   * @throws mfaPolicyViolation when role change violates MFA policy
   */
  static validateMfaPolicyForRoleChange(
    currentRoles: UserRole[],
    newRoles: UserRole[],
    isMfaEnabled: boolean
  ): void {
    const mfaRequiredRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
    
    // Check if user is gaining a MFA-required role
    const gainingMfaRequiredRole = newRoles.some(role => 
      mfaRequiredRoles.includes(role) && !currentRoles.includes(role)
    );

    if (gainingMfaRequiredRole && !isMfaEnabled) {
      throw mfaPolicyViolation(
        'MFA must be enabled before assigning ADMIN or SUPER_ADMIN roles'
      );
    }
  }

  /**
   * Checks if MFA is required for a specific role
   * @param role - User role to check
   * @returns True if MFA is required for the role
   */
  static isMfaRequiredForRole(role: UserRole): boolean {
    const mfaRequiredRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
    return mfaRequiredRoles.includes(role);
  }

  /**
   * Validates MFA configuration
   * @param isMfaEnabled - MFA enabled status
   * @param role - User role
   * @param isOptional - Whether MFA is optional
   * @throws invalidMfaConfiguration when MFA configuration is invalid
   */
  static validateMfaConfiguration(
    isMfaEnabled: boolean,
    role: UserRole,
    isOptional: boolean
  ): void {
    if (isOptional && MfaPolicyRules.isMfaRequiredForRole(role)) {
      throw invalidMfaConfiguration(
        `MFA cannot be optional for role ${role}`
      );
    }
  }

  /**
   * Gets MFA policy requirements for a role
   * @param role - User role
   * @returns MFA policy requirements
   */
  static getMfaPolicyRequirements(role: UserRole): {
    required: boolean;
    optional: boolean;
    description: string;
  } {
    const mfaRequiredRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
    
    if (mfaRequiredRoles.includes(role)) {
      return {
        required: true,
        optional: false,
        description: `MFA is required for ${role} role`
      };
    }

    return {
      required: false,
      optional: true,
      description: `MFA is optional for ${role} role`
    };
  }
}
