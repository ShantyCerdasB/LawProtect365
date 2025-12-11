/**
 * @fileoverview Use Translation - Shared translation hook for web and mobile
 * @summary React hook for accessing translations
 * @description
 * Wrapper around react-i18next's useTranslation hook that can be used
 * in both web and mobile applications. Provides type-safe access to translations.
 */

import { useTranslation as useI18nextTranslation } from 'react-i18next';

export type { TFunction } from 'i18next';

/**
 * @description Hook to access translation function and i18n instance.
 * @param namespace Optional namespace to use (defaults to 'common')
 * @returns Translation function and i18n instance
 */
export function useTranslation(namespace?: string) {
  return useI18nextTranslation(namespace);
}

