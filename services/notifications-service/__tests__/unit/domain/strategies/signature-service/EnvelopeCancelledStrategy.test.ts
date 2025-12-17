/**
 * @fileoverview EnvelopeCancelledStrategy Tests - Unit tests for EnvelopeCancelledStrategy
 * @summary Tests for envelope cancelled strategy
 * @description Comprehensive test suite for EnvelopeCancelledStrategy covering
 * event handling, processing, and notification request creation.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { EnvelopeCancelledStrategy } from '../../../../../src/domain/strategies/signature-service/EnvelopeCancelledStrategy';
import { EventSource } from '../../../../../src/domain/enums';
import { SignatureServiceEventType } from '../../../../../src/domain/enums/SignatureServiceEventType';
import { NotificationChannel, RecipientType } from '@prisma/client';
import { TranslationKeys, DEFAULT_DOCUMENT_TITLE } from '../../../../../src/domain/constants';

describe('EnvelopeCancelledStrategy', () => {
  let strategy: EnvelopeCancelledStrategy;
  const mockTranslationService = {
    translate: jest.fn((key: string, language: string, variables?: Record<string, unknown>) => {
      if (key === TranslationKeys.envelopeCancelled.subject) {
        return `Document Cancelled: ${variables?.envelopeTitle || ''}`;
      }
      if (key === TranslationKeys.envelopeCancelled.body) {
        return `The document "${variables?.envelopeTitle || ''}" has been cancelled.`;
      }
      return key;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new EnvelopeCancelledStrategy(mockTranslationService as any);
  });

  describe('canHandle', () => {
    it('returns true for ENVELOPE_CANCELLED event and signature service source', () => {
      expect(strategy.canHandle(SignatureServiceEventType.ENVELOPE_CANCELLED, EventSource.SIGNATURE_SERVICE)).toBe(true);
    });

    it('returns false for other event types', () => {
      expect(strategy.canHandle(SignatureServiceEventType.ENVELOPE_INVITATION, EventSource.SIGNATURE_SERVICE)).toBe(false);
    });

    it('returns false for wrong source', () => {
      expect(strategy.canHandle(SignatureServiceEventType.ENVELOPE_CANCELLED, EventSource.AUTH_SERVICE)).toBe(false);
    });
  });

  describe('process', () => {
    it('processes event with valid signerEmail', async () => {
      const payload = {
        signerEmail: 'signer@example.com',
        envelopeTitle: 'Test Document',
      };

      const result = await strategy.process(payload);

      expect(result).toHaveLength(1);
      expect(result[0].channel).toBe(NotificationChannel.EMAIL);
      expect(result[0].recipient).toBe('signer@example.com');
      expect(result[0].recipientType).toBe(RecipientType.EMAIL);
    });

    it('returns empty array for invalid signerEmail', async () => {
      const payload = {
        signerEmail: 'invalid-email',
        envelopeTitle: 'Test Document',
      };

      const result = await strategy.process(payload);

      expect(result).toHaveLength(0);
    });

    it('returns empty array for missing signerEmail', async () => {
      const payload = {
        envelopeTitle: 'Test Document',
      };

      const result = await strategy.process(payload);

      expect(result).toHaveLength(0);
    });

    it('uses envelopeTitle from payload', async () => {
      const payload = {
        signerEmail: 'signer@example.com',
        envelopeTitle: 'Custom Title',
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        TranslationKeys.envelopeCancelled.subject,
        expect.any(String),
        expect.objectContaining({ envelopeTitle: 'Custom Title' })
      );
    });

    it('uses default document title when envelopeTitle not provided', async () => {
      const payload = {
        signerEmail: 'signer@example.com',
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        TranslationKeys.envelopeCancelled.subject,
        expect.any(String),
        expect.objectContaining({ envelopeTitle: DEFAULT_DOCUMENT_TITLE })
      );
    });

    it('uses fallback subject when translation returns empty string', async () => {
      mockTranslationService.translate.mockImplementation(() => '');

      const payload = {
        signerEmail: 'signer@example.com',
        envelopeTitle: 'Test Document',
      };

      const result = await strategy.process(payload);

      expect(result[0].subject).toBe(`Document Cancelled: Test Document`);
    });

    it('uses fallback body when translation returns empty string', async () => {
      mockTranslationService.translate.mockImplementation(() => '');

      const payload = {
        signerEmail: 'signer@example.com',
        envelopeTitle: 'Test Document',
      };

      const result = await strategy.process(payload);

      expect(result[0].body).toBe(`The document "Test Document" has been cancelled.`);
    });

    it('extracts language from metadata', async () => {
      const payload = {
        signerEmail: 'signer@example.com',
        envelopeTitle: 'Test Document',
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

