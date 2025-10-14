/**
 * @fileoverview OAuthProvider - Enum for OAuth providers
 * @summary Defines all supported OAuth providers
 * @description This enum provides type-safe OAuth provider values for
 * social login and OAuth account linking functionality.
 */

export enum OAuthProvider {
  /** Google OAuth provider */
  GOOGLE = 'GOOGLE',
  /** Microsoft 365 OAuth provider */
  MICROSOFT_365 = 'MICROSOFT_365',
  /** Apple OAuth provider */
  APPLE = 'APPLE',
  /** AWS Cognito OAuth provider */
  COGNITO = 'COGNITO'
}
