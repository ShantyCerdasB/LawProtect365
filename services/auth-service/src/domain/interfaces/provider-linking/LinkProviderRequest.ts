/**
 * @fileoverview LinkProviderRequest - Interface for provider linking requests
 * @summary Defines the structure for provider linking request data
 * @description Interface representing the request data for linking OAuth providers to user accounts
 */

import { LinkingMode, OAuthProvider } from '../../enums';

export interface LinkProviderRequest {
  /** The linking mode to use */
  mode: LinkingMode;
  /** The OAuth provider to link */
  provider: OAuthProvider;
  /** Success URL for redirect mode */
  successUrl?: string;
  /** Failure URL for redirect mode */
  failureUrl?: string;
  /** Authorization code for direct/finalize mode */
  authorizationCode?: string;
  /** ID token for direct/finalize mode */
  idToken?: string;
  /** Code from OAuth callback for finalize mode */
  code?: string;
  /** State parameter for finalize mode */
  state?: string;
}
