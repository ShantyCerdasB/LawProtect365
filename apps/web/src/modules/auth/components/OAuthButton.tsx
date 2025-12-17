/**
 * @fileoverview OAuth Button - Reusable button component for OAuth authentication
 * @summary Button component for initiating OAuth flows with different providers
 * @description
 * Provides a consistent button component for OAuth authentication with Google, Outlook, and Apple.
 * Displays provider-specific icons and handles click events to initiate OAuth flows.
 */

import type { ReactElement } from 'react';
import { useTranslation } from '@lawprotect/frontend-core';
import { GoogleIcon, OutlookIcon, AppleIcon } from '../../../ui-kit/icons';
import type { OAuthButtonProps } from './interfaces';
import type { OAuthProvider } from '@lawprotect/frontend-core';

/**
 * @description Provider-specific icon configuration for OAuth buttons.
 * @property {ReactElement} icon - Icon component for the provider
 */
const providerIcons: Record<OAuthProvider, ReactElement> = {
  google: <GoogleIcon className="w-5 h-5" />,
  outlook: <OutlookIcon className="w-5 h-5" />,
  apple: <AppleIcon className="w-5 h-5" />,
} as const;

/**
 * @description Renders an OAuth authentication button for a specific provider.
 * @param {OAuthButtonProps} props - Button configuration
 * @param {OAuthProvider} props.provider - OAuth provider identifier
 * @param {Function} props.onClick - Click handler to initiate OAuth flow
 * @param {string} [props.className] - Optional additional CSS classes
 * @param {string} [props.label] - Optional custom button label
 * @returns {ReactElement} OAuth button component with provider icon and label
 */
export function OAuthButton({
  provider,
  onClick,
  className = '',
  label,
}: OAuthButtonProps): ReactElement {
  const { t } = useTranslation('auth');
  
  const labelMap: Record<OAuthProvider, string> = {
    google: t('login.signInWithGoogle'),
    outlook: t('login.signInWithOutlook'),
    apple: t('login.signInWithApple'),
  };

  const displayLabel = label || labelMap[provider];
  const icon = providerIcons[provider];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-3 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 ${className}`}
    >
      {icon}
      <span>{displayLabel}</span>
    </button>
  );
}

