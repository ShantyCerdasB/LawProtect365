/**
 * @fileoverview LinkingMode - Enum for provider linking modes
 * @summary Defines the different modes for linking OAuth providers
 * @description Enum representing the supported modes for linking OAuth providers to user accounts
 */

export enum LinkingMode {
  /** Redirect mode: Generate hosted UI URL for OAuth flow */
  REDIRECT = 'redirect',
  /** Direct mode: Handle OAuth tokens directly in backend */
  DIRECT = 'direct',
  /** Finalize mode: Complete OAuth flow after redirect */
  FINALIZE = 'finalize'
}
