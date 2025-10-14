/**
 * @fileoverview ProviderInfo - Interface for OAuth provider information
 * @summary Defines the structure for OAuth provider information
 * @description This interface represents OAuth provider information including
 * provider type and linking timestamp.
 */

/**
 * OAuth provider information
 */
export interface ProviderInfo {
  /** OAuth provider type */
  provider: string;
  /** When the provider was linked */
  linkedAt: string;
}
