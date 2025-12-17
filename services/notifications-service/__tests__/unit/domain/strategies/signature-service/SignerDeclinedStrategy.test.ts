/**
 * @fileoverview SignerDeclinedStrategy Tests - Unit tests for SignerDeclinedStrategy
 * @summary Tests for signer declined strategy
 * @description Comprehensive test suite for SignerDeclinedStrategy covering
 * event handling, processing, and notification request creation.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { SignerDeclinedStrategy } from '../../../../../src/domain/strategies/signature-service/SignerDeclinedStrategy';
import { EventSource } from '../../../../../src/domain/enums';
import { SignatureServiceEventType } from '../../../../../src/domain/enums/SignatureServiceEventType';
import { NotificationChannel, RecipientType } from '@prisma/client';
import { TranslationKeys, DEFAULT_DOCUMENT_TITLE } from '../../../../../src/domain/constants';
import { BadRequestError } from '@lawprotect/shared-ts';

describe('SignerDeclinedStrategy', () => {
  let strategy: SignerDeclinedStrategy;
  const mockTranslationService = {
    translate: jest.fn((key: string, language: string, variables?: Record<string, unknown>) => {
      if (key === TranslationKeys.signerDeclined.subject) {
        return `Document Signing Declined: ${variables?.envelopeTitle || ''}`;
      }
      if (key === TranslationKeys.signerDeclined.body) {
        return `The document "${variables?.envelopeTitle || ''}" was declined. Reason: ${variables?.declineReason || ''}`;
      }
      return key;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new SignerDeclinedStrategy(mockTranslationService as any);
  });

  describe('canHandle', () => {
    it('returns true for SIGNER_DECLINED event and signature service source', () => {
      expect(strategy.canHandle(SignatureServiceEventType.SIGNER_DECLINED, EventSource.SIGNATURE_SERVICE)).toBe(true);
    });

    it('returns false for other event types', () => {
      expect(strategy.canHandle(SignatureServiceEventType.ENVELOPE_INVITATION, EventSource.SIGNATURE_SERVICE)).toBe(false);
    });

    it('returns false for wrong source', () => {
      expect(strategy.canHandle(SignatureServiceEventType.SIGNER_DECLINED, EventSource.AUTH_SERVICE)).toBe(false);
    });
  });

  describe('process', () => {
    it('processes event with valid signerEmail and declineReason', async () => {
      const payload = {
        signerEmail: 'signer@example.com',
        declineReason: 'Not interested',
        metadata: {
          envelopeTitle: 'Test Document',
        },
      };

      const result = await strategy.process(payload);

      expect(result).toHaveLength(1);
      expect(result[0].channel).toBe(NotificationChannel.EMAIL);
      expect(result[0].recipient).toBe('signer@example.com');
      expect(result[0].recipientType).toBe(RecipientType.EMAIL);
    });

    it('throws error for missing signerEmail', async () => {
      const payload = {
        declineReason: 'Not interested',
      };

      await expect(strategy.process(payload)).rejects.toThrow(BadRequestError);
    });

    it('throws error for missing declineReason', async () => {
      const payload = {
        signerEmail: 'signer@example.com',
      };

      await expect(strategy.process(payload)).rejects.toThrow(BadRequestError);
    });

    it('uses envelopeTitle from metadata', async () => {
      const payload = {
        signerEmail: 'signer@example.com',
        declineReason: 'Not interested',
        metadata: {
          envelopeTitle: 'Custom Title',
        },
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        TranslationKeys.signerDeclined.subject,
        expect.any(String),
        expect.objectContaining({ envelopeTitle: 'Custom Title' })
      );
    });

    it('uses default document title when envelopeTitle not provided', async () => {
      const payload = {
        signerEmail: 'signer@example.com',
        declineReason: 'Not interested',
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        TranslationKeys.signerDeclined.subject,
        expect.any(String),
        expect.objectContaining({ envelopeTitle: DEFAULT_DOCUMENT_TITLE })
      );
    });

    it('includes declineReason in body translation', async () => {
      const payload = {
        signerEmail: 'signer@example.com',
        declineReason: 'Not interested',
        metadata: {
          envelopeTitle: 'Test Document',
        },
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        TranslationKeys.signerDeclined.body,
        expect.any(String),
        expect.objectContaining({ declineReason: 'Not interested' })
      );
    });

    it('uses fallback subject when translation returns empty string', async () => {
      mockTranslationService.translate.mockImplementation(() => '');

      const payload = {
        signerEmail: 'signer@example.com',
        declineReason: 'Not interested',
        metadata: {
          envelopeTitle: 'Test Document',
        },
      };

      const result = await strategy.process(payload);

      expect(result[0].subject).toBe(`Document Signing Declined: Test Document`);
    });

    it('uses fallback body when translation returns empty string', async () => {
      mockTranslationService.translate.mockImplementation(() => '');

      const payload = {
        signerEmail: 'signer@example.com',
        declineReason: 'Not interested',
        metadata: {
          envelopeTitle: 'Test Document',
        },
      };

      const result = await strategy.process(payload);

      expect(result[0].body).toBe(`The document "Test Document" was declined. Reason: Not interested`);
    });

    it('extracts language from metadata', async () => {
      const payload = {
        signerEmail: 'signer@example.com',
        declineReason: 'Not interested',
        metadata: {
          envelopeTitle: 'Test Document',
        },
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

