/**
 * @fileoverview MfaPolicyRules - Domain rules for MFA policy evaluation
 * @summary Validates MFA requirements and satisfaction for authentication
 * @description This domain rule encapsulates all business validation logic for MFA policies,
 * ensuring proper MFA enforcement and compliance with security requirements.
 */

import { UserRole } from '../enums/UserRole';
import { MfaDecision, MfaReason, MfaSetting } from '../enums';
import { MfaPolicyResult, CognitoMfaSettings } from '../interfaces';
import { mfaRequired } from '../../auth-errors';

/**
 * MfaPolicyRules - Domain rule for MFA policy validation
 * 
 * Encapsulates business validation logic for MFA policies including:
 * - MFA requirement evaluation
 * - MFA satisfaction checking
 * - Policy decision making
 */
export class MfaPolicyRules {
  /**
   * Evaluates MFA policy for a user
   * @param userRole - User's role
   * @param cognitoMfaSettings - MFA settings from Cognito
   * @param customMfaRequired - Custom MFA requirement from attributes
   * @returns MFA policy evaluation result
   */
  static evaluateMfaPolicy(
    userRole: UserRole,
    cognitoMfaSettings: CognitoMfaSettings,
    customMfaRequired?: boolean
  ): MfaPolicyResult {
    const required = this.isMfaRequired(userRole, customMfaRequired);
    const satisfied = this.isMfaSatisfied(cognitoMfaSettings);
    
    const decision = this.evaluateMfaDecision(required, satisfied);
    
    return {
      required,
      satisfied,
      decision,
      reason: decision === MfaDecision.DENY ? MfaReason.MFA_REQUIRED : undefined
    };
  }

  /**
   * Determines if MFA is required for a user
   * @param userRole - User's role
   * @param customMfaRequired - Custom MFA requirement from attributes
   * @returns True if MFA is required
   */
  static isMfaRequired(userRole: UserRole, customMfaRequired?: boolean): boolean {
    // Primary source: custom attribute
    if (customMfaRequired !== undefined) {
      return customMfaRequired;
    }
    
    // Fallback: role-based requirement
    return userRole === UserRole.SUPER_ADMIN;
  }

  /**
   * Determines if MFA is satisfied (user has MFA enabled)
   * @param cognitoMfaSettings - MFA settings from Cognito
   * @returns True if MFA is satisfied
   */
  static isMfaSatisfied(cognitoMfaSettings: CognitoMfaSettings): boolean {
    const { mfaEnabled, preferredMfaSetting, userMfaSettingList } = cognitoMfaSettings;
    
    // Check if MFA is enabled
    if (!mfaEnabled) {
      return false;
    }
    
    // Check for preferred MFA setting
    if (preferredMfaSetting && preferredMfaSetting !== MfaSetting.NOMFA) {
      return true;
    }
    
    // Check for available MFA settings
    if (userMfaSettingList && userMfaSettingList.length > 0) {
      return userMfaSettingList.some(setting => 
        setting === MfaSetting.SOFTWARE_TOKEN_MFA || setting === MfaSetting.SMS_MFA
      );
    }
    
    return false;
  }

  /**
   * Evaluates the final MFA decision
   * @param required - Whether MFA is required
   * @param satisfied - Whether MFA is satisfied
   * @returns Final decision
   */
  static evaluateMfaDecision(required: boolean, satisfied: boolean): MfaDecision {
    if (required && !satisfied) {
      return MfaDecision.DENY;
    }
    
    return MfaDecision.ALLOW;
  }

  /**
   * Validates MFA policy and throws error if violated
   * @param userRole - User's role
   * @param cognitoMfaSettings - MFA settings from Cognito
   * @param customMfaRequired - Custom MFA requirement from attributes
   * @throws mfaRequired when MFA is required but not satisfied
   */
  static validateMfaPolicy(
    userRole: UserRole,
    cognitoMfaSettings: CognitoMfaSettings,
    customMfaRequired?: boolean
  ): void {
    const result = this.evaluateMfaPolicy(userRole, cognitoMfaSettings, customMfaRequired);
    
    if (result.decision === MfaDecision.DENY) {
      throw mfaRequired({
        userRole,
        required: result.required,
        satisfied: result.satisfied,
        reason: result.reason
      });
    }
  }

  /**
   * Gets MFA requirement reason for logging
   * @param userRole - User's role
   * @param customMfaRequired - Custom MFA requirement from attributes
   * @returns Human-readable reason
   */
  static getMfaRequirementReason(userRole: UserRole, customMfaRequired?: boolean): string {
    if (customMfaRequired !== undefined) {
      return customMfaRequired ? 'Custom attribute requires MFA' : 'Custom attribute allows no MFA';
    }
    
    if (userRole === UserRole.SUPER_ADMIN) {
      return 'SUPER_ADMIN role requires MFA';
    }
    
    return 'MFA not required for this role';
  }

  /**
   * Gets MFA satisfaction status for logging
   * @param cognitoMfaSettings - MFA settings from Cognito
   * @returns Human-readable status
   */
  static getMfaSatisfactionStatus(cognitoMfaSettings: CognitoMfaSettings): string {
    const { mfaEnabled, preferredMfaSetting, userMfaSettingList } = cognitoMfaSettings;
    
    if (!mfaEnabled) {
      return 'MFA not enabled';
    }
    
    if (preferredMfaSetting && preferredMfaSetting !== MfaSetting.NOMFA) {
      return `MFA enabled with ${preferredMfaSetting}`;
    }
    
    if (userMfaSettingList && userMfaSettingList.length > 0) {
      return `MFA enabled with settings: ${userMfaSettingList.join(', ')}`;
    }
    
    return 'MFA enabled but no specific settings found';
  }
}