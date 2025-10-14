/**
 * @fileoverview LinkProviderResult - Interface for provider linking results
 * @summary Defines the structure for provider linking operation results
 * @description Interface representing the result of provider linking operations
 */

import { OAuthProvider, ProviderLinkingStatus } from '../../enums';

export interface LinkProviderResult {
  /** The linking status */
  status: ProviderLinkingStatus;
  /** The provider that was linked */
  provider: OAuthProvider;
  /** The provider account ID */
  providerAccountId: string;
  /** When the provider was linked */
  linkedAt: string;
  /** Error message if linking failed */
  error?: string;
}
