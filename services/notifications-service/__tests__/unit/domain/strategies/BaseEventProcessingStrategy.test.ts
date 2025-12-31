/**
 * @fileoverview BaseEventProcessingStrategy Tests - Unit tests for BaseEventProcessingStrategy
 * @summary Tests for base event processing strategy
 * @description Comprehensive test suite for BaseEventProcessingStrategy covering
 * utility methods, extraction methods, and notification request creation.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { BaseEventProcessingStrategy } from '../../../../src/domain/strategies/BaseEventProcessingStrategy';
import { NotificationChannel, RecipientType } from '@prisma/client';
import { DEFAULT_LANGUAGE } from '../../../../src/domain/constants';

class TestStrategy extends BaseEventProcessingStrategy {
  canHandle(eventType: string, source: string): boolean {
    return false;
  }

  async process(
    payload: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<any[]> {
    return [];
  }
}

describe('BaseEventProcessingStrategy', () => {
  let strategy: TestStrategy;
  const mockTranslationService = {
    translate: jest.fn((key: string, language: string, variables?: Record<string, unknown>) => {
      return `translated:${key}`;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new TestStrategy(mockTranslationService as any);
  });

  describe('extractString', () => {
    it('extracts string value', () => {
      const obj = { key: 'value' };
      expect(strategy['extractString'](obj, 'key')).toBe('value');
    });

    it('returns undefined for missing key', () => {
      const obj = {};
      expect(strategy['extractString'](obj, 'key')).toBeUndefined();
    });

    it('returns undefined for non-string value', () => {
      const obj = { key: 123 };
      expect(strategy['extractString'](obj, 'key')).toBeUndefined();
    });
  });

  describe('extractNumber', () => {
    it('extracts number value', () => {
      const obj = { key: 123 };
      expect(strategy['extractNumber'](obj, 'key')).toBe(123);
    });

    it('returns undefined for missing key', () => {
      const obj = {};
      expect(strategy['extractNumber'](obj, 'key')).toBeUndefined();
    });

    it('returns undefined for non-number value', () => {
      const obj = { key: '123' };
      expect(strategy['extractNumber'](obj, 'key')).toBeUndefined();
    });
  });

  describe('extractEmail', () => {
    it('extracts valid email', () => {
      const payload = { email: 'test@example.com' };
      expect(strategy['extractEmail'](payload)).toBe('test@example.com');
    });

    it('returns undefined for invalid email', () => {
      const payload = { email: 'invalid-email' };
      expect(strategy['extractEmail'](payload)).toBeUndefined();
    });

    it('returns undefined for missing email', () => {
      const payload = {};
      expect(strategy['extractEmail'](payload)).toBeUndefined();
    });
  });

  describe('extractLanguage', () => {
    it('extracts language from metadata', () => {
      const payload = {};
      const metadata = { recipientLanguage: 'es' };
      expect(strategy['extractLanguage'](payload, metadata)).toBe('es');
    });

    it('extracts language from payload recipientLanguage', () => {
      const payload = { recipientLanguage: 'fr' };
      expect(strategy['extractLanguage'](payload)).toBe('fr');
    });

    it('extracts language from payload language', () => {
      const payload = { language: 'de' };
      expect(strategy['extractLanguage'](payload)).toBe('de');
    });

    it('returns default language when not found', () => {
      const payload = {};
      expect(strategy['extractLanguage'](payload)).toBe(DEFAULT_LANGUAGE);
    });
  });

  describe('extractPayloadMetadata', () => {
    it('extracts metadata from payload', () => {
      const payload = {
        metadata: {
          key: 'value',
        },
      };
      const result = strategy['extractPayloadMetadata'](payload);
      expect(result).toEqual(payload.metadata);
    });

    it('returns empty object when metadata is missing', () => {
      const payload = {};
      const result = strategy['extractPayloadMetadata'](payload);
      expect(result).toEqual({});
    });
  });

  describe('createEmailNotificationRequest', () => {
    it('creates email notification request', () => {
      const recipient = 'test@example.com';
      const subject = 'Test Subject';
      const body = 'Test Body';
      const payload = { key: 'value' };
      const language = 'en';

      const request = strategy['createEmailNotificationRequest'](
        recipient,
        subject,
        body,
        payload,
        language
      );

      expect(request).toEqual({
        channel: NotificationChannel.EMAIL,
        recipient,
        recipientType: RecipientType.EMAIL,
        subject,
        body,
        metadata: payload,
        language,
      });
    });
  });

  describe('translate', () => {
    it('calls translation service with correct parameters', () => {
      const key = 'test.key';
      const language = 'en';
      const variables = { var1: 'value1' };

      strategy['translate'](key, language, variables);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(key, language, variables);
    });

    it('returns translated string', () => {
      const result = strategy['translate']('test.key', 'en');
      expect(result).toBe('translated:test.key');
    });
  });
});











