/**
 * @fileoverview Translate API Error - Utility to translate API error codes to user-friendly messages
 * @summary Converts API error codes to localized messages
 * @description
 * Translates API error codes into user-friendly messages based on the current language.
 * Supports field-specific errors and parameter interpolation.
 */

import type { TFunction } from 'i18next';
import type { ApiError } from '../interfaces/ApiErrorInterfaces';

/**
 * @description Translates an API error code to a localized message.
 * @param t Translation function from i18next
 * @param error API error object with code, optional field, and optional params
 * @returns Localized error message
 */
export function translateApiError(t: TFunction, error: ApiError): string {
  const { code, field, params } = error;

  const errorKey = field
    ? `errors.api.${code}.${field}`
    : `errors.api.${code}`;

  const translated = t(errorKey, { defaultValue: t('errors.api.UNKNOWN_ERROR'), ...params });

  if (translated === errorKey) {
    return t('errors.api.UNKNOWN_ERROR');
  }

  return translated;
}

