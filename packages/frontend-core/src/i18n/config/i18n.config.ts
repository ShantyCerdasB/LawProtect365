/**
 * @fileoverview i18n Configuration - Base i18next configuration for frontend-core
 * @summary Shared i18n configuration for web and mobile
 * @description
 * Base configuration for i18next that can be extended by web and mobile apps.
 * Defines common namespaces, fallback language, and interpolation settings.
 */

import type { InitOptions } from 'i18next';

export const i18nBaseConfig: InitOptions = {
  fallbackLng: 'en',
  supportedLngs: ['en', 'es', 'ja', 'it'],
  defaultNS: 'common',
  ns: [
    'common',
    'errors',
    'validation',
    'layout',
    'auth',
    'documents',
    'users',
    'payments',
    'memberships',
    'cases',
    'calendar',
    'notifications',
    'kyc',
    'admin',
  ],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
};

export type SupportedLanguage = 'en' | 'es' | 'ja' | 'it';

