/**
 * @fileoverview MfaStatus - Interface for MFA status information
 * @summary Defines the structure for MFA status in user profile responses
 * @description This interface represents MFA status information for user profiles,
 * including requirement status and enabled status.
 */

/**
 * MFA status information for user profiles
 */
export interface MfaStatus {
  /** Whether MFA is required for this user */
  required: boolean;
  /** Whether MFA is enabled for this user */
  enabled: boolean;
}
