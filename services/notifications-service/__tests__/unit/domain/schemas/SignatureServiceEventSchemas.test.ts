/**
 * @fileoverview SignatureServiceEventSchemas Tests - Unit tests for signature service event schemas
 * @summary Tests for Zod validation schemas for signature service events
 * @description Comprehensive test suite for SignatureServiceEventSchemas covering
 * validation of all signature service event types and their payloads.
 */

import { describe, it, expect } from '@jest/globals';
import {
  EnvelopeInvitationEventSchema,
  DocumentViewInvitationEventSchema,
  SignerDeclinedEventSchema,
  EnvelopeCancelledEventSchema,
  ReminderNotificationEventSchema,
} from '../../../../src/domain/schemas/SignatureServiceEventSchemas';

describe('SignatureServiceEventSchemas', () => {
  describe('EnvelopeInvitationEventSchema', () => {
    it('validates valid envelope invitation event', () => {
      const payload = {
        signerEmail: 'signer@example.com',
        message: 'Please sign',
      };
      expect(() => EnvelopeInvitationEventSchema.parse(payload)).not.toThrow();
    });

    it('validates with optional metadata', () => {
      const payload = {
        signerEmail: 'signer@example.com',
        message: 'Please sign',
        metadata: {
          envelopeTitle: 'Document Title',
        },
      };
      expect(() => EnvelopeInvitationEventSchema.parse(payload)).not.toThrow();
    });

    it('validates with recipientLanguage', () => {
      const payload = {
        signerEmail: 'signer@example.com',
        message: 'Please sign',
        recipientLanguage: 'es',
      };
      expect(() => EnvelopeInvitationEventSchema.parse(payload)).not.toThrow();
    });

    it('rejects invalid signerEmail', () => {
      const payload = {
        signerEmail: 'invalid-email',
        message: 'Please sign',
      };
      expect(() => EnvelopeInvitationEventSchema.parse(payload)).toThrow();
    });

    it('rejects empty message', () => {
      const payload = {
        signerEmail: 'signer@example.com',
        message: '',
      };
      expect(() => EnvelopeInvitationEventSchema.parse(payload)).toThrow();
    });

    it('allows additional fields', () => {
      const payload = {
        signerEmail: 'signer@example.com',
        message: 'Please sign',
        extraField: 'value',
      };
      expect(() => EnvelopeInvitationEventSchema.parse(payload)).not.toThrow();
    });
  });

  describe('DocumentViewInvitationEventSchema', () => {
    it('validates valid document view invitation event', () => {
      const payload = {
        viewerEmail: 'viewer@example.com',
        message: 'Please view',
      };
      expect(() => DocumentViewInvitationEventSchema.parse(payload)).not.toThrow();
    });

    it('rejects invalid viewerEmail', () => {
      const payload = {
        viewerEmail: 'invalid',
        message: 'Please view',
      };
      expect(() => DocumentViewInvitationEventSchema.parse(payload)).toThrow();
    });
  });

  describe('SignerDeclinedEventSchema', () => {
    it('validates valid signer declined event', () => {
      const payload = {
        signerEmail: 'signer@example.com',
        declineReason: 'Not interested',
      };
      expect(() => SignerDeclinedEventSchema.parse(payload)).not.toThrow();
    });

    it('rejects missing signerEmail', () => {
      const payload = {
        declineReason: 'Not interested',
      };
      expect(() => SignerDeclinedEventSchema.parse(payload)).toThrow();
    });

    it('rejects empty signerEmail', () => {
      const payload = {
        signerEmail: '',
        declineReason: 'Not interested',
      };
      expect(() => SignerDeclinedEventSchema.parse(payload)).toThrow();
    });

    it('rejects empty declineReason', () => {
      const payload = {
        signerEmail: 'signer@example.com',
        declineReason: '',
      };
      expect(() => SignerDeclinedEventSchema.parse(payload)).toThrow();
    });
  });

  describe('EnvelopeCancelledEventSchema', () => {
    it('validates valid envelope cancelled event with signerEmail', () => {
      const payload = {
        signerEmail: 'signer@example.com',
      };
      expect(() => EnvelopeCancelledEventSchema.parse(payload)).not.toThrow();
    });

    it('validates valid envelope cancelled event without signerEmail', () => {
      const payload = {
        envelopeTitle: 'Document Title',
      };
      expect(() => EnvelopeCancelledEventSchema.parse(payload)).not.toThrow();
    });

    it('rejects invalid signerEmail when provided', () => {
      const payload = {
        signerEmail: 'invalid',
      };
      expect(() => EnvelopeCancelledEventSchema.parse(payload)).toThrow();
    });
  });

  describe('ReminderNotificationEventSchema', () => {
    it('validates valid reminder notification event', () => {
      const payload = {
        message: 'Reminder',
        signerEmail: 'signer@example.com',
        reminderCount: 1,
      };
      expect(() => ReminderNotificationEventSchema.parse(payload)).not.toThrow();
    });

    it('validates without signerEmail', () => {
      const payload = {
        message: 'Reminder',
      };
      expect(() => ReminderNotificationEventSchema.parse(payload)).not.toThrow();
    });

    it('validates without reminderCount', () => {
      const payload = {
        message: 'Reminder',
      };
      expect(() => ReminderNotificationEventSchema.parse(payload)).not.toThrow();
    });

    it('rejects empty message', () => {
      const payload = {
        message: '',
      };
      expect(() => ReminderNotificationEventSchema.parse(payload)).toThrow();
    });

    it('rejects reminderCount less than 1', () => {
      const payload = {
        message: 'Reminder',
        reminderCount: 0,
      };
      expect(() => ReminderNotificationEventSchema.parse(payload)).toThrow();
    });

    it('rejects non-integer reminderCount', () => {
      const payload = {
        message: 'Reminder',
        reminderCount: 1.5,
      };
      expect(() => ReminderNotificationEventSchema.parse(payload)).toThrow();
    });
  });
});













