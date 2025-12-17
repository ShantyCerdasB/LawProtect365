/**
 * @fileoverview TranslationService Tests - Unit tests for TranslationService
 * @summary Tests for i18n translation functionality
 * @description Comprehensive test suite for TranslationService covering translation loading,
 * key resolution, variable interpolation, and fallback behavior.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TranslationService } from '../../../../src/services/i18n/TranslationService';

describe('TranslationService', () => {
  let tempDir: string;
  let service: TranslationService;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'translations-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should use default translations path when not provided', () => {
      service = new TranslationService();
      expect(service).toBeInstanceOf(TranslationService);
    });

    it('should use provided translations path', () => {
      service = new TranslationService(tempDir);
      expect(service).toBeInstanceOf(TranslationService);
    });
  });

  describe('translate', () => {
    beforeEach(() => {
      service = new TranslationService(tempDir);
    });

    it('should return translation for simple key', () => {
      const translations = {
        hello: 'Hello',
      };
      fs.writeFileSync(path.join(tempDir, 'en.json'), JSON.stringify(translations));

      const result = service.translate('hello', 'en');

      expect(result).toBe('Hello');
    });

    it('should return translation for nested key', () => {
      const translations = {
        notifications: {
          envelope_invitation: {
            subject: 'You have a document to sign',
          },
        },
      };
      fs.writeFileSync(path.join(tempDir, 'en.json'), JSON.stringify(translations));

      const result = service.translate('notifications.envelope_invitation.subject', 'en');

      expect(result).toBe('You have a document to sign');
    });

    it('should interpolate variables in translation', () => {
      const translations = {
        greeting: 'Hello, {{name}}!',
      };
      fs.writeFileSync(path.join(tempDir, 'en.json'), JSON.stringify(translations));

      const result = service.translate('greeting', 'en', { name: 'John' });

      expect(result).toBe('Hello, John!');
    });

    it('should interpolate multiple variables', () => {
      const translations = {
        message: 'Welcome {{name}}, you have {{count}} messages',
      };
      fs.writeFileSync(path.join(tempDir, 'en.json'), JSON.stringify(translations));

      const result = service.translate('message', 'en', { name: 'Alice', count: '5' });

      expect(result).toBe('Welcome Alice, you have 5 messages');
    });

    it('should return key when translation not found', () => {
      const translations = {};
      fs.writeFileSync(path.join(tempDir, 'en.json'), JSON.stringify(translations));

      const result = service.translate('nonexistent.key', 'en');

      expect(result).toBe('nonexistent.key');
    });

    it('should use default language when not specified', () => {
      const translations = {
        hello: 'Hello',
      };
      fs.writeFileSync(path.join(tempDir, 'en.json'), JSON.stringify(translations));

      const result = service.translate('hello');

      expect(result).toBe('Hello');
    });

    it('should fallback to English when language file not found', () => {
      const enTranslations = {
        hello: 'Hello',
      };
      fs.writeFileSync(path.join(tempDir, 'en.json'), JSON.stringify(enTranslations));

      const result = service.translate('hello', 'es');

      expect(result).toBe('Hello');
    });

    it('should return key when English fallback also not found', () => {
      const result = service.translate('nonexistent.key', 'es');

      expect(result).toBe('nonexistent.key');
    });

    it('should handle non-string values in translation object', () => {
      const translations = {
        number: 123,
        boolean: true,
        object: { nested: 'value' },
      };
      fs.writeFileSync(path.join(tempDir, 'en.json'), JSON.stringify(translations));

      expect(service.translate('number', 'en')).toBe('number');
      expect(service.translate('boolean', 'en')).toBe('boolean');
      expect(service.translate('object', 'en')).toBe('object');
    });

    it('should cache translations after first load', () => {
      const translations = {
        cached: 'Cached value',
      };
      fs.writeFileSync(path.join(tempDir, 'en.json'), JSON.stringify(translations));

      service.translate('cached', 'en');
      fs.writeFileSync(path.join(tempDir, 'en.json'), JSON.stringify({ cached: 'New value' }));

      const result = service.translate('cached', 'en');

      expect(result).toBe('Cached value');
    });

    it('should handle missing variable in interpolation', () => {
      const translations = {
        greeting: 'Hello, {{name}}!',
      };
      fs.writeFileSync(path.join(tempDir, 'en.json'), JSON.stringify(translations));

      const result = service.translate('greeting', 'en');

      expect(result).toBe('Hello, {{name}}!');
    });

    it('should handle null variable in interpolation', () => {
      const translations = {
        greeting: 'Hello, {{name}}!',
      };
      fs.writeFileSync(path.join(tempDir, 'en.json'), JSON.stringify(translations));

      const result = service.translate('greeting', 'en', { name: null });

      expect(result).toBe('Hello, {{name}}!');
    });

    it('should handle undefined variable in interpolation', () => {
      const translations = {
        greeting: 'Hello, {{name}}!',
      };
      fs.writeFileSync(path.join(tempDir, 'en.json'), JSON.stringify(translations));

      const result = service.translate('greeting', 'en', { name: undefined });

      expect(result).toBe('Hello, {{name}}!');
    });

    it('should handle invalid JSON gracefully', () => {
      fs.writeFileSync(path.join(tempDir, 'en.json'), 'invalid json');

      const result = service.translate('any.key', 'en');

      expect(result).toBe('any.key');
    });

    it('should handle missing translation file gracefully', () => {
      const result = service.translate('any.key', 'fr');

      expect(result).toBe('any.key');
    });
  });

  describe('getNestedValue', () => {
    beforeEach(() => {
      service = new TranslationService(tempDir);
    });

    it('should handle deeply nested keys', () => {
      const translations = {
        level1: {
          level2: {
            level3: {
              value: 'Deep value',
            },
          },
        },
      };
      fs.writeFileSync(path.join(tempDir, 'en.json'), JSON.stringify(translations));

      const result = service.translate('level1.level2.level3.value', 'en');

      expect(result).toBe('Deep value');
    });

    it('should return undefined for invalid path', () => {
      const translations = {
        valid: {
          key: 'value',
        },
      };
      fs.writeFileSync(path.join(tempDir, 'en.json'), JSON.stringify(translations));

      const result = service.translate('valid.invalid.key', 'en');

      expect(result).toBe('valid.invalid.key');
    });
  });

  describe('interpolate', () => {
    beforeEach(() => {
      service = new TranslationService(tempDir);
    });

    it('should convert numbers to strings', () => {
      const translations = {
        count: 'You have {{count}} items',
      };
      fs.writeFileSync(path.join(tempDir, 'en.json'), JSON.stringify(translations));

      const result = service.translate('count', 'en', { count: 42 });

      expect(result).toBe('You have 42 items');
    });

    it('should convert booleans to strings', () => {
      const translations = {
        status: 'Status: {{active}}',
      };
      fs.writeFileSync(path.join(tempDir, 'en.json'), JSON.stringify(translations));

      const result = service.translate('status', 'en', { active: true });

      expect(result).toBe('Status: true');
    });
  });
});

