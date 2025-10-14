/**
 * @fileoverview MfaDecision - Enum for MFA policy decisions
 * @summary Defines MFA policy decision outcomes
 * @description This enum provides type-safe MFA policy decision values for
 * authentication validation and access control.
 */

export enum MfaDecision {
  /** MFA policy allows authentication */
  ALLOW = 'ALLOW',
  /** MFA policy denies authentication */
  DENY = 'DENY'
}
