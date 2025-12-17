/**
 * @fileoverview AuthServiceEventStrategy Tests - Unit tests for AuthServiceEventStrategy
 * @summary Tests for auth service event strategy
 * @description Comprehensive test suite for AuthServiceEventStrategy covering
 * event handling, processing, and notification request creation.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuthServiceEventStrategy } from '../../../../../src/domain/strategies/auth-service/AuthServiceEventStrategy';
import { EventSource } from '../../../../../src/domain/enums';
import { AuthServiceEventType } from '../../../../../src/domain/enums/AuthServiceEventType';
import { NotificationChannel, RecipientType } from '@prisma/client';
import { DEFAULT_EVENT_TYPE, DEFAULT_USER_NAME, DEFAULT_ACCOUNT_NOTIFICATION_SUBJECT, DEFAULT_AUTH_SUBJECTS } from '../../../../../src/domain/constants';

describe('AuthServiceEventStrategy', () => {
  let strategy: AuthServiceEventStrategy;
  const mockTranslationService = {
    translate: jest.fn((key: string, language: string, variables?: Record<string, unknown>) => {
      if (key.includes('subject')) {
        return 'Translated Subject';
      }
      if (key.includes('body')) {
        return 'Translated Body';
      }
      return key;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new AuthServiceEventStrategy(
      mockTranslationService as any,
      [AuthServiceEventType.USER_UPDATED, AuthServiceEventType.USER_ROLE_CHANGED]
    );
  });

  describe('canHandle', () => {
    it('returns true for supported event type and auth service source', () => {
      expect(strategy.canHandle(AuthServiceEventType.USER_UPDATED, EventSource.AUTH_SERVICE)).toBe(true);
    });

    it('returns false for unsupported event type', () => {
      expect(strategy.canHandle(AuthServiceEventType.USER_REGISTERED, EventSource.AUTH_SERVICE)).toBe(false);
    });

    it('returns false for wrong source', () => {
      expect(strategy.canHandle(AuthServiceEventType.USER_UPDATED, EventSource.SIGNATURE_SERVICE)).toBe(false);
    });
  });

  describe('process', () => {
    it('processes event with valid email', async () => {
      const payload = {
        email: 'test@example.com',
        firstName: 'John',
      };
      const metadata = { eventType: AuthServiceEventType.USER_UPDATED };

      const result = await strategy.process(payload, metadata);

      expect(result).toHaveLength(1);
      expect(result[0].channel).toBe(NotificationChannel.EMAIL);
      expect(result[0].recipient).toBe('test@example.com');
      expect(result[0].recipientType).toBe(RecipientType.EMAIL);
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

    it('uses eventType from metadata', async () => {
      const payload = {
        email: 'test@example.com',
        firstName: 'John',
      };
      const metadata = { eventType: AuthServiceEventType.USER_ROLE_CHANGED };

      await strategy.process(payload, metadata);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        'notifications.userrolechanged.subject',
        expect.any(String),
        undefined
      );
    });

    it('uses eventType from payload type field', async () => {
      const payload = {
        email: 'test@example.com',
        firstName: 'John',
        type: AuthServiceEventType.USER_UPDATED,
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        'notifications.userupdated.subject',
        expect.any(String),
        undefined
      );
    });

    it('uses default event type when not provided', async () => {
      const payload = {
        email: 'test@example.com',
        firstName: 'John',
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        `notifications.${DEFAULT_EVENT_TYPE.toLowerCase()}.subject`,
        expect.any(String),
        undefined
      );
    });

    it('uses default user name when firstName is missing', async () => {
      const payload = {
        email: 'test@example.com',
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ firstName: DEFAULT_USER_NAME })
      );
    });

    it('uses default subject when translation not found', async () => {
      mockTranslationService.translate.mockImplementation((key: string) => key);

      const payload = {
        email: 'test@example.com',
        firstName: 'John',
      };
      const metadata = { eventType: AuthServiceEventType.USER_UPDATED };

      const result = await strategy.process(payload, metadata);

      expect(result[0].subject).toBe(DEFAULT_AUTH_SUBJECTS[AuthServiceEventType.USER_UPDATED] || DEFAULT_ACCOUNT_NOTIFICATION_SUBJECT);
    });

    it('extracts language from metadata', async () => {
      const payload = {
        email: 'test@example.com',
        firstName: 'John',
      };
      const metadata = {
        eventType: AuthServiceEventType.USER_UPDATED,
        recipientLanguage: 'es',
      };

      await strategy.process(payload, metadata);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        expect.any(String),
        'es',
        expect.any(Object)
      );
    });

    it('extracts language from payload', async () => {
      const payload = {
        email: 'test@example.com',
        firstName: 'John',
        recipientLanguage: 'fr',
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        expect.any(String),
        'fr',
        expect.any(Object)
      );
    });
  });
});

