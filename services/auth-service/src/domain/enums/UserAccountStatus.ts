/**
 * @fileoverview UserAccountStatus - Enum for user account status
 * @summary Defines all possible user account statuses
 * @description This enum provides type-safe user account status values for
 * user lifecycle management and account state tracking.
 */

export enum UserAccountStatus {
  /** User account is active and can use the system */
  ACTIVE = 'ACTIVE',
  /** User account is inactive */
  INACTIVE = 'INACTIVE',
  /** User account is suspended and cannot access the system */
  SUSPENDED = 'SUSPENDED',
  /** User account is deleted and cannot be recovered */
  DELETED = 'DELETED',
  /** User account is pending KYC verification */
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}
