/**
 * @fileoverview Language Selector Interfaces - Types for language selection
 * @summary Defines interfaces for language configuration
 */

import type { SupportedLanguage } from '@lawprotect/frontend-core';
import { CountryCode } from '../enums/CountryCode';

export interface LanguageConfig {
  code: SupportedLanguage;
  countryCode: CountryCode;
}

