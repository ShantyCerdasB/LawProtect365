/**
 * @fileoverview ClaimsOverrideDetails - Interface for Cognito claims override structure
 * @summary Defines the structure for claims override details in Cognito
 * @description This interface represents the structure used by Cognito to override
 * or add claims to JWT tokens during the PreTokenGeneration trigger.
 */

/**
 * Claims override details structure for Cognito
 */
export interface ClaimsOverrideDetails {
  /** Claims to add or override */
  claimsToAddOrOverride?: {
    [key: string]: string | number | boolean;
  };
  /** Claims to suppress */
  claimsToSuppress?: string[];
  /** Group override details (optional) */
  groupOverrideDetails?: {
    groupsToOverride?: string[];
    iamRolesToOverride?: string[];
    preferredRole?: string;
  };
}
