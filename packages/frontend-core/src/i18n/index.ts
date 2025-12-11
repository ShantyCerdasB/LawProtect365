/**
 * @fileoverview i18n Module - Internationalization module for frontend-core
 * @summary Shared i18n utilities and configuration
 * @description
 * Exports i18n configuration, hooks, utilities, and types for use in web and mobile apps.
 */

export * from './config/i18n.config';
export * from './hooks/useTranslation';
export * from './utils/translateApiError';
export * from './interfaces';
export type { SupportedLanguage } from './config/i18n.config';

