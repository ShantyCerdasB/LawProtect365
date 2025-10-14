/**
 * @fileoverview MfaClaimsData - Interface for MFA-related data in claims mapping
 * @summary Defines the structure for MFA data used in JWT claims mapping
 * @description This interface represents MFA-related data needed for building
 * JWT claims, including MFA requirement and enabled status.
 */

/**
 * MFA-related data for claims mapping
 */
export interface MfaClaimsData {
  /** Whether MFA is required by policy */
  isMfaRequired: boolean;
  /** Whether MFA is enabled in Cognito */
  isMfaEnabled: boolean;
}
