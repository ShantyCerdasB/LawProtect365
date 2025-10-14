/**
 * @fileoverview AccessErrorCode - Enum for user access error codes
 * @summary Defines user access denial error codes
 * @description This enum provides type-safe user access error codes for
 * authentication validation and error handling.
 */

export enum AccessErrorCode {
  /** Account is inactive */
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  /** Account is suspended */
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  /** Account is deleted */
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
  /** Account is pending verification and blocked */
  PENDING_VERIFICATION_BLOCKED = 'PENDING_VERIFICATION_BLOCKED',
  /** Unknown account status */
  UNKNOWN_STATUS = 'UNKNOWN_STATUS'
}
