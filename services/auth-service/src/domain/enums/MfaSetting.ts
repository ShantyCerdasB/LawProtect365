/**
 * @fileoverview MfaSetting - Enum for MFA settings in Cognito
 * @summary Defines MFA setting types supported by Cognito
 * @description This enum provides type-safe MFA setting values for
 * Cognito integration and MFA policy evaluation.
 */

export enum MfaSetting {
  /** No MFA configured */
  NOMFA = 'NOMFA',
  /** Software token MFA (TOTP) */
  SOFTWARE_TOKEN_MFA = 'SOFTWARE_TOKEN_MFA',
  /** SMS MFA */
  SMS_MFA = 'SMS_MFA'
}
