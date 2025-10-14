/**
 * @fileoverview ProviderIdentity - Interface for provider identity data
 * @summary Defines the structure for OAuth provider identity information
 * @description Interface representing the identity data extracted from OAuth providers
 */

import { OAuthProvider } from '../../enums';

export interface ProviderIdentity {
  /** The OAuth provider */
  provider: OAuthProvider;
  /** The provider account ID */
  providerAccountId: string;
  /** Email from the provider (optional) */
  email?: string;
  /** Name from the provider (optional) */
  name?: string;
}
