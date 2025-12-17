/**
 * @fileoverview OAuth Button Interfaces - Type definitions for OAuth button component
 * @summary Defines props interfaces for OAuth authentication buttons
 * @description
 * Contains TypeScript interfaces for OAuth button components used in the login page.
 */

import type { OAuthProvider } from '@lawprotect/frontend-core';

/**
 * @description Props for the OAuthButton component.
 * @property {OAuthProvider} provider - OAuth provider identifier ('google', 'outlook', 'apple')
 * @property {Function} onClick - Callback function invoked when button is clicked
 * @property {string} [className] - Optional additional CSS classes
 * @property {string} [label] - Optional custom button label text
 */
export interface OAuthButtonProps {
  provider: OAuthProvider;
  onClick: () => void;
  className?: string;
  label?: string;
}

