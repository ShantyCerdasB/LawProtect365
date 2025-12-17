/**
 * @fileoverview EnvelopeInvitationStrategy Tests - Unit tests for EnvelopeInvitationStrategy
 * @summary Tests for envelope invitation strategy
 * @description Comprehensive test suite for EnvelopeInvitationStrategy covering
 * event handling, processing, and notification request creation.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { EnvelopeInvitationStrategy } from '../../../../../src/domain/strategies/signature-service/EnvelopeInvitationStrategy';
import { EventSource } from '../../../../../src/domain/enums';
import { SignatureServiceEventType } from '../../../../../src/domain/enums/SignatureServiceEventType';
import { NotificationChannel, RecipientType } from '@prisma/client';
import { TranslationKeys, DEFAULT_DOCUMENT_TITLE } from '../../../../../src/domain/constants';
import { eventValidationFailed } from '../../../../../src/notification-errors';
import { BadRequestError } from '@lawprotect/shared-ts';

describe('EnvelopeInvitationStrategy', () => {
  let strategy: EnvelopeInvitationStrategy;
  const mockTranslationService = {
    translate: jest.fn((key: string, language: string, variables?: Record<string, unknown>) => {
      if (key === TranslationKeys.envelopeInvitation.subject) {
        return `Sign Document: ${variables?.envelopeTitle || ''}`;
      }
      return key;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new EnvelopeInvitationStrategy(mockTranslationService as any);
  });

  describe('canHandle', () => {
    it('returns true for ENVELOPE_INVITATION event and signature service source', () => {
      expect(strategy.canHandle(SignatureServiceEventType.ENVELOPE_INVITATION, EventSource.SIGNATURE_SERVICE)).toBe(true);
    });

    it('returns false for other event types', () => {
      expect(strategy.canHandle(SignatureServiceEventType.ENVELOPE_CANCELLED, EventSource.SIGNATURE_SERVICE)).toBe(false);
    });

    it('returns false for wrong source', () => {
      expect(strategy.canHandle(SignatureServiceEventType.ENVELOPE_INVITATION, EventSource.AUTH_SERVICE)).toBe(false);
    });
  });

  describe('process', () => {
    it('processes event with valid signerEmail and message', async () => {
      const payload = {
        signerEmail: 'signer@example.com',
        message: 'Please sign this document',
        metadata: {
          envelopeTitle: 'Test Document',
        },
      };

      const result = await strategy.process(payload);

      expect(result).toHaveLength(1);
      expect(result[0].channel).toBe(NotificationChannel.EMAIL);
      expect(result[0].recipient).toBe('signer@example.com');
      expect(result[0].recipientType).toBe(RecipientType.EMAIL);
      expect(result[0].body).toBe('Please sign this document');
    });

    it('throws error for invalid signerEmail', async () => {
      const payload = {
        signerEmail: 'invalid-email',
        message: 'Please sign this document',
      };

      await expect(strategy.process(payload)).rejects.toThrow(BadRequestError);
    });

    it('throws error for missing signerEmail', async () => {
      const payload = {
        message: 'Please sign this document',
      };

      await expect(strategy.process(payload)).rejects.toThrow(BadRequestError);
    });

    it('throws error for missing message', async () => {
      const payload = {
        signerEmail: 'signer@example.com',
      };

      await expect(strategy.process(payload)).rejects.toThrow(BadRequestError);
    });

    it('uses envelopeTitle from metadata', async () => {
      const payload = {
        signerEmail: 'signer@example.com',
        message: 'Please sign',
        metadata: {
          envelopeTitle: 'Custom Title',
        },
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        TranslationKeys.envelopeInvitation.subject,
        expect.any(String),
        expect.objectContaining({ envelopeTitle: 'Custom Title' })
      );
    });

    it('uses default document title when envelopeTitle not provided', async () => {
      const payload = {
        signerEmail: 'signer@example.com',
        message: 'Please sign',
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        TranslationKeys.envelopeInvitation.subject,
        expect.any(String),
        expect.objectContaining({ envelopeTitle: DEFAULT_DOCUMENT_TITLE })
      );
    });

    it('uses fallback subject when translation returns empty string', async () => {
      mockTranslationService.translate.mockImplementation(() => '');

      const payload = {
        signerEmail: 'signer@example.com',
        message: 'Please sign',
        metadata: {
          envelopeTitle: 'Test Document',
        },
      };

      const result = await strategy.process(payload);

      expect(result[0].subject).toBe(`Sign Document: Test Document`);
    });

    it('extracts language from metadata', async () => {
      const payload = {
        signerEmail: 'signer@example.com',
        message: 'Please sign',
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

