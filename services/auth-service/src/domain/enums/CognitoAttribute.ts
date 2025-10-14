/**
 * @fileoverview CognitoAttribute - Enum for Cognito user attributes
 * @summary Defines standard Cognito user attribute names
 * @description This enum provides type-safe Cognito user attribute names for
 * user data extraction and validation.
 */

export enum CognitoAttribute {
  /** User sub (unique identifier) */
  SUB = 'sub',
  /** User email */
  EMAIL = 'email',
  /** Email verification status */
  EMAIL_VERIFIED = 'email_verified',
  /** Phone number */
  PHONE_NUMBER = 'phone_number',
  /** Phone number verification status */
  PHONE_NUMBER_VERIFIED = 'phone_number_verified',
  /** Given name */
  GIVEN_NAME = 'given_name',
  /** Family name */
  FAMILY_NAME = 'family_name',
  /** Custom role attribute */
  CUSTOM_ROLE = 'custom:role',
  /** Custom MFA required attribute */
  CUSTOM_MFA_REQUIRED = 'custom:is_mfa_required',
  /** Preferred MFA setting */
  PREFERRED_MFA_SETTING = 'preferred_mfa_setting',
  /** User identities */
  IDENTITIES = 'identities'
}
