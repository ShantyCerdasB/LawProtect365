/**
 * @fileoverview IdentityInfo - Interface for user identity information
 * @summary Defines the structure for user identity information
 * @description This interface represents user identity information including
 * Cognito subject identifier and other identity-related data.
 */

/**
 * User identity information
 */
export interface IdentityInfo {
  /** Cognito subject identifier */
  cognitoSub: string;
}
