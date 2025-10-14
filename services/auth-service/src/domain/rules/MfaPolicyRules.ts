/**
 * @fileoverview MfaPolicyRules - MFA policy evaluation rules
 * @summary Defines MFA policy rules and evaluation logic
 * @description Provides business rules for MFA policy evaluation, including
 * MFA requirement determination and policy compliance checking.
 */

import { UserRole } from '../enums/UserRole';

/**
 * MFA policy rules for determining MFA requirements
 * 
 * Provides business rules for MFA policy evaluation and compliance.
 */
export class MfaPolicyRules {
  /**
   * Roles that require MFA
   */
  private static readonly MFA_REQUIRED_ROLES = [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN
  ];

  /**
   * Determines if MFA is enabled from Cognito data
   * @param userMFASettingList - List of MFA settings from Cognito
   * @param preferredMfaSetting - Preferred MFA setting from Cognito
   * @returns True if MFA is enabled
   */
  static isMfaEnabledFromCognito(
    userMFASettingList?: string[], 
    preferredMfaSetting?: string
  ): boolean {
    return Boolean(
      userMFASettingList?.includes('SOFTWARE_TOKEN_MFA') || 
      preferredMfaSetting
    );
  }

  /**
   * Determines if MFA is required for a specific role
   * @param role - User role to check
   * @returns True if MFA is required for this role
   */
  static isMfaRequiredForRole(role: UserRole): boolean {
    return this.MFA_REQUIRED_ROLES.includes(role);
  }

  /**
   * Evaluates MFA policy compliance
   * @param role - User role
   * @param mfaEnabled - Current MFA status
   * @returns True if MFA policy is compliant
   */
  static evaluateMfaCompliance(role: UserRole, mfaEnabled: boolean): boolean {
    const mfaRequired = this.isMfaRequiredForRole(role);
    return !mfaRequired || mfaEnabled;
  }

  /**
   * Gets roles that require MFA
   * @returns Array of roles that require MFA
   */
  static getMfaRequiredRoles(): UserRole[] {
    return [...this.MFA_REQUIRED_ROLES];
  }

  /**
   * Checks if a role change requires MFA status update
   * @param oldRole - Previous role
   * @param newRole - New role
   * @returns True if MFA status should be updated
   */
  static requiresMfaStatusUpdate(oldRole: UserRole, newRole: UserRole): boolean {
    const oldRoleRequiresMfa = this.isMfaRequiredForRole(oldRole);
    const newRoleRequiresMfa = this.isMfaRequiredForRole(newRole);
    
    return oldRoleRequiresMfa !== newRoleRequiresMfa;
  }
}