/**
 * @fileoverview ClaimsInfo - Interface for JWT claims information
 * @summary Defines the structure for JWT claims information
 * @description This interface represents JWT claims information that matches
 * the PreTokenGeneration format for consistency across the system.
 */

/**
 * JWT claims information
 */
export interface ClaimsInfo {
  /** User role */
  role: string;
  /** User account status */
  account_status: string;
  /** Whether MFA is required */
  is_mfa_required: boolean;
  /** Whether MFA is enabled */
  mfa_enabled: boolean;
  /** User ID */
  user_id: string;
}
