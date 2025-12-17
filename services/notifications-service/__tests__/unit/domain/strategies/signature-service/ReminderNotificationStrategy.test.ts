/**
 * @fileoverview ReminderNotificationStrategy Tests - Unit tests for ReminderNotificationStrategy
 * @summary Tests for reminder notification strategy
 * @description Comprehensive test suite for ReminderNotificationStrategy covering
 * event handling, processing, and notification request creation.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ReminderNotificationStrategy } from '../../../../../src/domain/strategies/signature-service/ReminderNotificationStrategy';
import { EventSource } from '../../../../../src/domain/enums';
import { SignatureServiceEventType } from '../../../../../src/domain/enums/SignatureServiceEventType';
import { NotificationChannel, RecipientType } from '@prisma/client';
import { TranslationKeys, DEFAULT_REMINDER_COUNT } from '../../../../../src/domain/constants';
import { BadRequestError } from '@lawprotect/shared-ts';

describe('ReminderNotificationStrategy', () => {
  let strategy: ReminderNotificationStrategy;
  const mockTranslationService = {
    translate: jest.fn((key: string, language: string, variables?: Record<string, unknown>) => {
      if (key === TranslationKeys.reminderNotification.subject) {
        return `Reminder: Please Sign Document (Reminder #${variables?.reminderCount || ''})`;
      }
      return key;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new ReminderNotificationStrategy(mockTranslationService as any);
  });

  describe('canHandle', () => {
    it('returns true for REMINDER_NOTIFICATION event and signature service source', () => {
      expect(strategy.canHandle(SignatureServiceEventType.REMINDER_NOTIFICATION, EventSource.SIGNATURE_SERVICE)).toBe(true);
    });

    it('returns false for other event types', () => {
      expect(strategy.canHandle(SignatureServiceEventType.ENVELOPE_INVITATION, EventSource.SIGNATURE_SERVICE)).toBe(false);
    });

    it('returns false for wrong source', () => {
      expect(strategy.canHandle(SignatureServiceEventType.REMINDER_NOTIFICATION, EventSource.AUTH_SERVICE)).toBe(false);
    });
  });

  describe('process', () => {
    it('processes event with valid message and signerEmail', async () => {
      const payload = {
        message: 'Please sign this document',
        signerEmail: 'signer@example.com',
        reminderCount: 2,
      };

      const result = await strategy.process(payload);

      expect(result).toHaveLength(1);
      expect(result[0].channel).toBe(NotificationChannel.EMAIL);
      expect(result[0].recipient).toBe('signer@example.com');
      expect(result[0].recipientType).toBe(RecipientType.EMAIL);
      expect(result[0].body).toBe('Please sign this document');
    });

    it('throws error for missing message', async () => {
      const payload = {
        signerEmail: 'signer@example.com',
        reminderCount: 2,
      };

      await expect(strategy.process(payload)).rejects.toThrow(BadRequestError);
    });

    it('returns empty array for missing signerEmail', async () => {
      const payload = {
        message: 'Please sign',
        reminderCount: 2,
      };

      const result = await strategy.process(payload);

      expect(result).toHaveLength(0);
    });

    it('uses reminderCount from payload', async () => {
      const payload = {
        message: 'Please sign',
        signerEmail: 'signer@example.com',
        reminderCount: 3,
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        TranslationKeys.reminderNotification.subject,
        expect.any(String),
        expect.objectContaining({ reminderCount: 3 })
      );
    });

    it('uses default reminder count when not provided', async () => {
      const payload = {
        message: 'Please sign',
        signerEmail: 'signer@example.com',
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        TranslationKeys.reminderNotification.subject,
        expect.any(String),
        expect.objectContaining({ reminderCount: DEFAULT_REMINDER_COUNT })
      );
    });

    it('uses fallback subject when translation returns empty string', async () => {
      mockTranslationService.translate.mockImplementation(() => '');

      const payload = {
        message: 'Please sign',
        signerEmail: 'signer@example.com',
        reminderCount: 2,
      };

      const result = await strategy.process(payload);

      expect(result[0].subject).toBe(`Reminder: Please Sign Document (Reminder #2)`);
    });

    it('extracts language from metadata', async () => {
      const payload = {
        message: 'Please sign',
        signerEmail: 'signer@example.com',
        reminderCount: 2,
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

