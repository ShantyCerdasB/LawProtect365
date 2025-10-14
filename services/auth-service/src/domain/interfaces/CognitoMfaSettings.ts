/**
 * @fileoverview CognitoMfaSettings - Interface for Cognito MFA settings
 * @summary Defines the structure for MFA settings from Cognito AdminGetUser response
 * @description This interface represents MFA settings retrieved from Cognito,
 * including enabled status, custom requirements, and available MFA methods.
 */

/**
 * Cognito MFA settings from AdminGetUser response
 */
export interface CognitoMfaSettings {
  /** Whether MFA is enabled in Cognito */
  mfaEnabled: boolean;
  /** Whether MFA is required by custom attribute */
  isMfaRequiredAttr: boolean;
  /** Preferred MFA setting */
  preferredMfaSetting?: string;
  /** Available MFA settings */
  userMfaSettingList?: string[];
}
