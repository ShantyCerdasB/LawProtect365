/**
 * @fileoverview TranslationService - Service for i18n translations
 * @summary Provides translation functionality for notification messages
 * @description This service loads translation files and provides translation
 * functionality for notification messages. It reads from frontend-core locales
 * or local translation files.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Translation service for i18n support
 * 
 * Loads translations from JSON files and provides translation functionality.
 * Supports fallback to English if translation is not available.
 */
export class TranslationService {
  private readonly translationsBasePath: string;
  private translations: Map<string, Record<string, string>> = new Map();

  constructor(translationsBasePath?: string) {
    this.translationsBasePath = translationsBasePath || path.join(__dirname, '../../../translations');
  }

  /**
   * @description Translates a key with optional variables
   * @param {string} key - Translation key (e.g., 'notifications.envelope_invitation.subject')
   * @param {string} language - Language code (e.g., 'en', 'es')
   * @param {Record<string, unknown>} [variables] - Optional variables for interpolation
   * @returns {string} Translated string
   */
  translate(
    key: string,
    language: string = 'en',
    variables?: Record<string, unknown>
  ): string {
    const translations = this.loadTranslations(language);
    const translation = this.getNestedValue(translations, key) || key;

    if (variables) {
      return this.interpolate(translation, variables);
    }

    return translation;
  }

  /**
   * @description Loads translations for a language
   * @param {string} language - Language code
   * @returns {Record<string, string>} Translations object
   */
  private loadTranslations(language: string): Record<string, string> {
    if (this.translations.has(language)) {
      return this.translations.get(language)!;
    }

    const translationPath = path.join(this.translationsBasePath, `${language}.json`);
    
    try {
      if (fs.existsSync(translationPath)) {
        const content = fs.readFileSync(translationPath, 'utf-8');
        const translations = JSON.parse(content);
        this.translations.set(language, translations);
        return translations;
      }
    } catch (error) {
      // Fallback to empty object if file doesn't exist or is invalid
    }

    // Fallback to English if language not found
    if (language !== 'en') {
      return this.loadTranslations('en');
    }

    return {};
  }

  /**
   * @description Gets nested value from object using dot notation
   * @param {Record<string, unknown>} obj - Object to search
   * @param {string} path - Dot notation path (e.g., 'notifications.envelope_invitation.subject')
   * @returns {string | undefined} Value or undefined
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  }

  /**
   * @description Interpolates variables in translation string
   * @param {string} template - Translation string with {{variable}} placeholders
   * @param {Record<string, unknown>} variables - Variables to interpolate
   * @returns {string} Interpolated string
   */
  private interpolate(template: string, variables: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = variables[key];
      return value !== undefined && value !== null ? String(value) : match;
    });
  }
}

