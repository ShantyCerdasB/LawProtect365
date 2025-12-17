/**
 * @fileoverview EventPayloadValidator Tests - Unit tests for EventPayloadValidator
 * @summary Tests for event payload validation
 * @description Comprehensive test suite for EventPayloadValidator covering
 * validation of event payloads based on event type and source.
 */

import { describe, it, expect } from '@jest/globals';
import { validateEventPayload } from '../../../../src/domain/schemas/EventPayloadValidator';
import { EventSource } from '../../../../src/domain/enums/EventSource';
import { SignatureServiceEventType } from '../../../../src/domain/enums/SignatureServiceEventType';
import { AuthServiceEventType } from '../../../../src/domain/enums/AuthServiceEventType';
import { eventValidationFailed } from '../../../../src/notification-errors';

describe('EventPayloadValidator', () => {
  describe('validateEventPayload', () => {
    it('validates signature service ENVELOPE_INVITATION event', () => {
      const payload = {
        signerEmail: 'signer@example.com',
        message: 'Please sign',
      };
      expect(() => validateEventPayload(EventSource.SIGNATURE_SERVICE, SignatureServiceEventType.ENVELOPE_INVITATION, payload)).not.toThrow();
    });

    it('validates signature service DOCUMENT_VIEW_INVITATION event', () => {
      const payload = {
        viewerEmail: 'viewer@example.com',
        message: 'Please view',
      };
      expect(() => validateEventPayload(EventSource.SIGNATURE_SERVICE, SignatureServiceEventType.DOCUMENT_VIEW_INVITATION, payload)).not.toThrow();
    });

    it('validates signature service SIGNER_DECLINED event', () => {
      const payload = {
        signerEmail: 'signer@example.com',
        declineReason: 'Not interested',
      };
      expect(() => validateEventPayload(EventSource.SIGNATURE_SERVICE, SignatureServiceEventType.SIGNER_DECLINED, payload)).not.toThrow();
    });

    it('validates signature service ENVELOPE_CANCELLED event', () => {
      const payload = {
        signerEmail: 'signer@example.com',
      };
      expect(() => validateEventPayload(EventSource.SIGNATURE_SERVICE, SignatureServiceEventType.ENVELOPE_CANCELLED, payload)).not.toThrow();
    });

    it('validates signature service REMINDER_NOTIFICATION event', () => {
      const payload = {
        message: 'Reminder',
        signerEmail: 'signer@example.com',
        reminderCount: 1,
      };
      expect(() => validateEventPayload(EventSource.SIGNATURE_SERVICE, SignatureServiceEventType.REMINDER_NOTIFICATION, payload)).not.toThrow();
    });

    it('validates auth service USER_REGISTERED event', () => {
      const payload = {
        email: 'user@example.com',
        firstName: 'John',
      };
      expect(() => validateEventPayload(EventSource.AUTH_SERVICE, AuthServiceEventType.USER_REGISTERED, payload)).not.toThrow();
    });

    it('validates auth service USER_UPDATED event', () => {
      const payload = {
        email: 'user@example.com',
      };
      expect(() => validateEventPayload(EventSource.AUTH_SERVICE, AuthServiceEventType.USER_UPDATED, payload)).not.toThrow();
    });

    it('validates auth service USER_ROLE_CHANGED event', () => {
      const payload = {
        email: 'user@example.com',
        oldRole: 'user',
        newRole: 'admin',
      };
      expect(() => validateEventPayload(EventSource.AUTH_SERVICE, AuthServiceEventType.USER_ROLE_CHANGED, payload)).not.toThrow();
    });

    it('validates auth service USER_STATUS_CHANGED event', () => {
      const payload = {
        email: 'user@example.com',
        oldStatus: 'active',
        newStatus: 'inactive',
      };
      expect(() => validateEventPayload(EventSource.AUTH_SERVICE, AuthServiceEventType.USER_STATUS_CHANGED, payload)).not.toThrow();
    });

    it('validates auth service MFA_STATUS_CHANGED event', () => {
      const payload = {
        email: 'user@example.com',
        mfaEnabled: true,
      };
      expect(() => validateEventPayload(EventSource.AUTH_SERVICE, AuthServiceEventType.MFA_STATUS_CHANGED, payload)).not.toThrow();
    });

    it('validates auth service OAUTH_ACCOUNT_LINKED event', () => {
      const payload = {
        email: 'user@example.com',
      };
      expect(() => validateEventPayload(EventSource.AUTH_SERVICE, AuthServiceEventType.OAUTH_ACCOUNT_LINKED, payload)).not.toThrow();
    });

    it('validates auth service OAUTH_ACCOUNT_UNLINKED event', () => {
      const payload = {
        email: 'user@example.com',
      };
      expect(() => validateEventPayload(EventSource.AUTH_SERVICE, AuthServiceEventType.OAUTH_ACCOUNT_UNLINKED, payload)).not.toThrow();
    });

    it('validates auth service USER_PROVIDER_LINKED event', () => {
      const payload = {
        email: 'user@example.com',
      };
      expect(() => validateEventPayload(EventSource.AUTH_SERVICE, AuthServiceEventType.USER_PROVIDER_LINKED, payload)).not.toThrow();
    });

    it('validates auth service USER_PROVIDER_UNLINKED event', () => {
      const payload = {
        email: 'user@example.com',
      };
      expect(() => validateEventPayload(EventSource.AUTH_SERVICE, AuthServiceEventType.USER_PROVIDER_UNLINKED, payload)).not.toThrow();
    });

    it('throws error for invalid payload', () => {
      const payload = {
        signerEmail: 'invalid-email',
      };
      expect(() => validateEventPayload(EventSource.SIGNATURE_SERVICE, SignatureServiceEventType.ENVELOPE_INVITATION, payload)).toThrow(eventValidationFailed);
    });

    it('returns payload as-is for unknown event type', () => {
      const payload = {
        unknownField: 'value',
      };
      const result = validateEventPayload('unknown-source', 'UNKNOWN_EVENT', payload);
      expect(result).toEqual(payload);
    });
  });
});

