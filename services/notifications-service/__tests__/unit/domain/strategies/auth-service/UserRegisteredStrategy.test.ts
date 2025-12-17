/**
 * @fileoverview UserRegisteredStrategy Tests - Unit tests for UserRegisteredStrategy
 * @summary Tests for user registered strategy
 * @description Comprehensive test suite for UserRegisteredStrategy covering
 * event handling, processing, and notification request creation.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { UserRegisteredStrategy } from '../../../../../src/domain/strategies/auth-service/UserRegisteredStrategy';
import { EventSource } from '../../../../../src/domain/enums';
import { AuthServiceEventType } from '../../../../../src/domain/enums/AuthServiceEventType';
import { NotificationChannel, RecipientType } from '@prisma/client';
import { DEFAULT_USER_NAME, TranslationKeys } from '../../../../../src/domain/constants';

describe('UserRegisteredStrategy', () => {
  let strategy: UserRegisteredStrategy;
  const mockTranslationService = {
    translate: jest.fn((key: string, language: string, variables?: Record<string, unknown>) => {
      if (key === TranslationKeys.userRegistered.subject) {
        return 'Welcome to LawProtect365';
      }
      if (key === TranslationKeys.userRegistered.body) {
        return `Welcome ${variables?.firstName}${variables?.lastName || ''}!`;
      }
      return key;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new UserRegisteredStrategy(mockTranslationService as any);
  });

  describe('canHandle', () => {
    it('returns true for USER_REGISTERED event and auth service source', () => {
      expect(strategy.canHandle(AuthServiceEventType.USER_REGISTERED, EventSource.AUTH_SERVICE)).toBe(true);
    });

    it('returns false for other event types', () => {
      expect(strategy.canHandle(AuthServiceEventType.USER_UPDATED, EventSource.AUTH_SERVICE)).toBe(false);
    });

    it('returns false for wrong source', () => {
      expect(strategy.canHandle(AuthServiceEventType.USER_REGISTERED, EventSource.SIGNATURE_SERVICE)).toBe(false);
    });
  });

  describe('process', () => {
    it('processes event with valid email and firstName', async () => {
      const payload = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = await strategy.process(payload);

      expect(result).toHaveLength(1);
      expect(result[0].channel).toBe(NotificationChannel.EMAIL);
      expect(result[0].recipient).toBe('test@example.com');
      expect(result[0].recipientType).toBe(RecipientType.EMAIL);
      expect(result[0].subject).toBe('Welcome to LawProtect365');
    });

    it('returns empty array for invalid email', async () => {
      const payload = {
        email: 'invalid-email',
        firstName: 'John',
      };

      const result = await strategy.process(payload);

      expect(result).toHaveLength(0);
    });

    it('returns empty array for missing email', async () => {
      const payload = {
        firstName: 'John',
      };

      const result = await strategy.process(payload);

      expect(result).toHaveLength(0);
    });

    it('uses default user name when firstName is missing', async () => {
      const payload = {
        email: 'test@example.com',
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        TranslationKeys.userRegistered.body,
        expect.any(String),
        expect.objectContaining({ firstName: DEFAULT_USER_NAME })
      );
    });

    it('includes lastName in body when provided', async () => {
      const payload = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        TranslationKeys.userRegistered.body,
        expect.any(String),
        expect.objectContaining({ lastName: ' Doe' })
      );
    });

    it('uses empty string for lastName when not provided', async () => {
      const payload = {
        email: 'test@example.com',
        firstName: 'John',
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        TranslationKeys.userRegistered.body,
        expect.any(String),
        expect.objectContaining({ lastName: '' })
      );
    });

    it('uses fallback subject when translation returns empty string', async () => {
      mockTranslationService.translate.mockImplementation(() => '');

      const payload = {
        email: 'test@example.com',
        firstName: 'John',
      };

      const result = await strategy.process(payload);

      expect(result[0].subject).toBe('Welcome to LawProtect365');
    });

    it('uses fallback body when translation returns empty string', async () => {
      mockTranslationService.translate.mockImplementation(() => '');

      const payload = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = await strategy.process(payload);

      expect(result[0].body).toContain('Welcome John Doe!');
    });

    it('extracts language from metadata', async () => {
      const payload = {
        email: 'test@example.com',
        firstName: 'John',
      };
      const metadata = { recipientLanguage: 'es' };

      await strategy.process(payload, metadata);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        expect.any(String),
        'es',
        expect.any(Object)
      );
    });
  });
});

