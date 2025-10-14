/**
 * @fileoverview ProviderLinkingRules - Domain rules for provider linking
 * @summary Contains business logic for provider linking operations
 * @description Domain rules for validating and managing OAuth provider linking
 */

import { OAuthProvider, LinkingMode } from '../enums';
import { User } from '../entities/User';
import { OAuthAccount } from '../entities/OAuthAccount';
import { UserId } from '../value-objects/UserId';
import { AuthServiceConfig } from '../../config/AppConfig';

export class ProviderLinkingRules {
  /**
   * Ensures the provider is allowed for linking
   * @param provider - The OAuth provider to validate
   * @param config - Application configuration
   * @throws Error if provider is not allowed
   */
  static ensureProviderAllowed(provider: OAuthProvider, config: AuthServiceConfig): void {
    const allowedProviders = config.features.providerLinking?.allowedProviders || [];
    if (!allowedProviders.includes(provider)) {
      throw new Error(`Provider ${provider} is not allowed for linking`);
    }
  }

  /**
   * Validates provider account ID format
   * @param provider - The OAuth provider
   * @param accountId - The provider account ID
   * @returns True if valid, false otherwise
   */
  static validateProviderAccountId(provider: OAuthProvider, accountId: string): boolean {
    if (!accountId || accountId.trim().length === 0) {
      return false;
    }

    // Provider-specific validation
    switch (provider) {
      case OAuthProvider.GOOGLE:
        // Google sub is typically a numeric string
        return /^\d+$/.test(accountId);
      case OAuthProvider.MICROSOFT_365:
        // Microsoft oid is a GUID
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId);
      case OAuthProvider.APPLE:
        // Apple sub is typically a long alphanumeric string
        return /^[a-zA-Z0-9._-]+$/.test(accountId);
      case OAuthProvider.COGNITO:
        // Cognito sub is a UUID
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId);
      default:
        return true; // Allow unknown providers
    }
  }

  /**
   * Checks for conflicts when linking a provider
   * @param existingAccount - Existing OAuth account if found
   * @param currentUserId - Current user ID
   * @throws Error if conflict is detected
   */
  static checkForConflicts(existingAccount: OAuthAccount | null, currentUserId: UserId): void {
    if (!existingAccount) {
      return; // No conflict
    }

    // Check if the account is already linked to the same user (idempotent case)
    if (existingAccount.getUserId().toString() === currentUserId.toString()) {
      return; // Already linked to same user, this is idempotent
    }

    // Account is linked to a different user - conflict
    throw new Error(`OAuth account already linked to another user`);
  }

  /**
   * Determines if linking should be allowed for the user
   * @param user - The user attempting to link
   * @param provider - The provider being linked
   * @returns True if linking is allowed
   */
  static shouldAllowLinking(user: User, _provider: OAuthProvider): boolean {
    // Don't allow linking if user is deleted or suspended
    if (user.getStatus() === 'DELETED' || user.getStatus() === 'SUSPENDED') {
      return false;
    }

    // Don't allow linking if user is inactive
    if (user.getStatus() === 'INACTIVE') {
      return false;
    }

    return true;
  }

  /**
   * Determines if the linking mode is supported
   * @param mode - The linking mode
   * @param config - Application configuration
   * @returns True if mode is supported
   */
  static isModeSupported(mode: LinkingMode, config: AuthServiceConfig): boolean {
    const enabledModes = config.features.providerLinking?.enabledModes || [];
    return enabledModes.includes(mode);
  }

  /**
   * Validates state parameter for finalize mode
   * @param state - The state parameter
   * @param config - Application configuration
   * @returns True if state is valid
   */
  static validateState(state: string, _config: AuthServiceConfig): boolean {
    if (!state || state.trim().length === 0) {
      return false;
    }

    // Basic format validation (should be base64 encoded)
    try {
      const decoded = Buffer.from(state, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      
      // Check if state has required fields
      return parsed.timestamp && parsed.nonce && parsed.userId;
    } catch {
      return false;
    }
  }

  /**
   * Generates a secure state parameter
   * @param userId - The user ID
   * @param provider - The provider
   * @param config - Application configuration
   * @returns Encoded state parameter
   */
  static generateState(userId: string, provider: OAuthProvider, _config: AuthServiceConfig): string {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 15);
    
    const stateData = {
      userId,
      provider,
      timestamp,
      nonce
    };

    return Buffer.from(JSON.stringify(stateData)).toString('base64');
  }
}
