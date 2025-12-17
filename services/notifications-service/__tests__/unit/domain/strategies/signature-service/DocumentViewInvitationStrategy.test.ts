/**
 * @fileoverview DocumentViewInvitationStrategy Tests - Unit tests for DocumentViewInvitationStrategy
 * @summary Tests for document view invitation strategy
 * @description Comprehensive test suite for DocumentViewInvitationStrategy covering
 * event handling, processing, and notification request creation.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { DocumentViewInvitationStrategy } from '../../../../../src/domain/strategies/signature-service/DocumentViewInvitationStrategy';
import { EventSource } from '../../../../../src/domain/enums';
import { SignatureServiceEventType } from '../../../../../src/domain/enums/SignatureServiceEventType';
import { NotificationChannel, RecipientType } from '@prisma/client';
import { TranslationKeys, DEFAULT_DOCUMENT_TITLE } from '../../../../../src/domain/constants';
import { BadRequestError } from '@lawprotect/shared-ts';

describe('DocumentViewInvitationStrategy', () => {
  let strategy: DocumentViewInvitationStrategy;
  const mockTranslationService = {
    translate: jest.fn((key: string, language: string, variables?: Record<string, unknown>) => {
      if (key === TranslationKeys.documentViewInvitation.subject) {
        return `View Document: ${variables?.envelopeTitle || ''}`;
      }
      return key;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new DocumentViewInvitationStrategy(mockTranslationService as any);
  });

  describe('canHandle', () => {
    it('returns true for DOCUMENT_VIEW_INVITATION event and signature service source', () => {
      expect(strategy.canHandle(SignatureServiceEventType.DOCUMENT_VIEW_INVITATION, EventSource.SIGNATURE_SERVICE)).toBe(true);
    });

    it('returns false for other event types', () => {
      expect(strategy.canHandle(SignatureServiceEventType.ENVELOPE_INVITATION, EventSource.SIGNATURE_SERVICE)).toBe(false);
    });

    it('returns false for wrong source', () => {
      expect(strategy.canHandle(SignatureServiceEventType.DOCUMENT_VIEW_INVITATION, EventSource.AUTH_SERVICE)).toBe(false);
    });
  });

  describe('process', () => {
    it('processes event with valid viewerEmail and message', async () => {
      const payload = {
        viewerEmail: 'viewer@example.com',
        message: 'Please view this document',
        metadata: {
          envelopeTitle: 'Test Document',
        },
      };

      const result = await strategy.process(payload);

      expect(result).toHaveLength(1);
      expect(result[0].channel).toBe(NotificationChannel.EMAIL);
      expect(result[0].recipient).toBe('viewer@example.com');
      expect(result[0].recipientType).toBe(RecipientType.EMAIL);
      expect(result[0].body).toBe('Please view this document');
    });

    it('throws error for invalid viewerEmail', async () => {
      const payload = {
        viewerEmail: 'invalid-email',
        message: 'Please view',
      };

      await expect(strategy.process(payload)).rejects.toThrow(BadRequestError);
    });

    it('throws error for missing viewerEmail', async () => {
      const payload = {
        message: 'Please view',
      };

      await expect(strategy.process(payload)).rejects.toThrow(BadRequestError);
    });

    it('throws error for missing message', async () => {
      const payload = {
        viewerEmail: 'viewer@example.com',
      };

      await expect(strategy.process(payload)).rejects.toThrow(BadRequestError);
    });

    it('uses envelopeTitle from metadata', async () => {
      const payload = {
        viewerEmail: 'viewer@example.com',
        message: 'Please view',
        metadata: {
          envelopeTitle: 'Custom Title',
        },
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        TranslationKeys.documentViewInvitation.subject,
        expect.any(String),
        expect.objectContaining({ envelopeTitle: 'Custom Title' })
      );
    });

    it('uses default document title when envelopeTitle not provided', async () => {
      const payload = {
        viewerEmail: 'viewer@example.com',
        message: 'Please view',
      };

      await strategy.process(payload);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        TranslationKeys.documentViewInvitation.subject,
        expect.any(String),
        expect.objectContaining({ envelopeTitle: DEFAULT_DOCUMENT_TITLE })
      );
    });

    it('uses fallback subject when translation returns empty string', async () => {
      mockTranslationService.translate.mockImplementation(() => '');

      const payload = {
        viewerEmail: 'viewer@example.com',
        message: 'Please view',
        metadata: {
          envelopeTitle: 'Test Document',
        },
      };

      const result = await strategy.process(payload);

      expect(result[0].subject).toBe(`View Document: Test Document`);
    });
  });
});

