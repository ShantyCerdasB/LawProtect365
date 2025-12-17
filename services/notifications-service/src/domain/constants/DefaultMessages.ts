/**
 * @fileoverview DefaultMessages - Default message templates for notifications
 * @summary Centralized default message templates to avoid hardcoded strings
 * @description Provides default message templates for auth service events when
 * translations are not available. These serve as fallback messages.
 */

import { AuthServiceEventType } from '../enums';
import { DEFAULT_UNKNOWN_VALUE } from './DefaultValues';

/**
 * Default subject messages for auth service events
 * 
 * Used as fallback when translations are not available.
 */
export const DEFAULT_AUTH_SUBJECTS: Record<string, string> = {
  [AuthServiceEventType.USER_UPDATED]: 'Account Updated',
  [AuthServiceEventType.USER_ROLE_CHANGED]: 'Your Role Has Changed',
  [AuthServiceEventType.USER_STATUS_CHANGED]: 'Account Status Changed',
  [AuthServiceEventType.MFA_STATUS_CHANGED]: 'MFA Settings Changed',
  [AuthServiceEventType.OAUTH_ACCOUNT_LINKED]: 'OAuth Account Linked',
  [AuthServiceEventType.OAUTH_ACCOUNT_UNLINKED]: 'OAuth Account Unlinked',
  [AuthServiceEventType.USER_PROVIDER_LINKED]: 'Provider Account Linked',
  [AuthServiceEventType.USER_PROVIDER_UNLINKED]: 'Provider Account Unlinked'
} as const;

/**
 * Creates default body message for auth service events
 * 
 * @param {string} eventType - Event type
 * @param {string} firstName - User's first name
 * @param {Record<string, unknown>} payload - Event payload
 * @returns {string} Default body message
 */
export function getDefaultAuthBody(
  eventType: string,
  firstName: string,
  payload: Record<string, unknown>
): string {
  switch (eventType) {
    case AuthServiceEventType.USER_UPDATED:
      return `Hello ${firstName}, your account information has been updated.`;
    case AuthServiceEventType.USER_ROLE_CHANGED: {
      const oldRole = extractString(payload, 'oldRole') || DEFAULT_UNKNOWN_VALUE;
      const newRole = extractString(payload, 'newRole') || DEFAULT_UNKNOWN_VALUE;
      return `Hello ${firstName}, your role has been changed from ${oldRole} to ${newRole}.`;
    }
    case AuthServiceEventType.USER_STATUS_CHANGED: {
      const oldStatus = extractString(payload, 'oldStatus') || DEFAULT_UNKNOWN_VALUE;
      const newStatus = extractString(payload, 'newStatus') || DEFAULT_UNKNOWN_VALUE;
      return `Hello ${firstName}, your account status has been changed from ${oldStatus} to ${newStatus}.`;
    }
    case AuthServiceEventType.MFA_STATUS_CHANGED: {
      const mfaEnabled = payload.mfaEnabled === true;
      return `Hello ${firstName}, MFA has been ${mfaEnabled ? 'enabled' : 'disabled'} on your account.`;
    }
    case AuthServiceEventType.OAUTH_ACCOUNT_LINKED:
    case AuthServiceEventType.USER_PROVIDER_LINKED:
      return `Hello ${firstName}, an OAuth account has been linked to your account.`;
    case AuthServiceEventType.OAUTH_ACCOUNT_UNLINKED:
    case AuthServiceEventType.USER_PROVIDER_UNLINKED:
      return `Hello ${firstName}, an OAuth account has been unlinked from your account.`;
    default:
      return `Hello ${firstName}, there has been a change to your account.`;
  }
}

/**
 * Helper function to extract string from payload
 * @param {Record<string, unknown>} payload - Payload object
 * @param {string} key - Key to extract
 * @returns {string | undefined} String value or undefined
 */
function extractString(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === 'string' ? value : undefined;
}

