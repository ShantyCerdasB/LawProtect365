/**
 * @fileoverview LinkProviderResponse - Interface for provider linking responses
 * @summary Defines the structure for provider linking response data
 * @description Interface representing the response data for linking OAuth providers to user accounts
 */

import { OAuthProvider } from '../../enums';

export interface LinkProviderResponse {
  /** URL for redirect mode */
  linkUrl?: string;
  /** Whether the provider was successfully linked */
  linked?: boolean;
  /** The linked provider */
  provider?: OAuthProvider;
  /** The provider account ID */
  providerAccountId?: string;
  /** When the provider was linked */
  linkedAt?: string;
}
