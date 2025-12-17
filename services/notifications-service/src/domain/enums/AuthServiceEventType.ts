/**
 * @fileoverview AuthServiceEventType - Enum for auth service event types
 * @summary Defines all auth service event types for type-safe event processing
 * @description Provides type-safe event type constants for auth service events
 * to avoid hardcoded strings and enable compile-time checking.
 */

/**
 * Event types emitted by auth-service
 */
export enum AuthServiceEventType {
  USER_REGISTERED = 'UserRegistered',
  USER_UPDATED = 'UserUpdated',
  USER_ROLE_CHANGED = 'UserRoleChanged',
  USER_STATUS_CHANGED = 'UserStatusChanged',
  MFA_STATUS_CHANGED = 'MfaStatusChanged',
  OAUTH_ACCOUNT_LINKED = 'OAuthAccountLinked',
  OAUTH_ACCOUNT_UNLINKED = 'OAuthAccountUnlinked',
  USER_PROVIDER_LINKED = 'UserProviderLinked',
  USER_PROVIDER_UNLINKED = 'UserProviderUnlinked'
}

