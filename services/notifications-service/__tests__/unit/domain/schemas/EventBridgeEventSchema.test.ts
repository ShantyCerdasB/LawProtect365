/**
 * @fileoverview EventBridgeEventSchema Tests - Unit tests for EventBridge event schemas
 * @summary Tests for Zod validation schemas for EventBridge events
 * @description Comprehensive test suite for EventBridgeEventSchema covering
 * validation of EventBridge event structure and event detail payloads.
 */

import { describe, it, expect } from '@jest/globals';
import {
  EventBridgeEventSchema,
  EventDetailSchema,
  SignatureServiceEventDetailSchema,
  AuthServiceEventDetailSchema,
} from '../../../../src/domain/schemas/EventBridgeEventSchema';

describe('EventBridgeEventSchema', () => {
  describe('EventBridgeEventSchema', () => {
    it('validates valid EventBridge event', () => {
      const event = {
        version: '0',
        id: 'event-123',
        'detail-type': 'ENVELOPE_INVITATION',
        source: 'signature-service',
        account: '123456789012',
        time: '2024-01-01T00:00:00Z',
        region: 'us-east-1',
        detail: {
          envelopeId: 'env-123',
        },
        resources: [],
      };
      expect(() => EventBridgeEventSchema.parse(event)).not.toThrow();
    });

    it('rejects missing version', () => {
      const event = {
        id: 'event-123',
        'detail-type': 'ENVELOPE_INVITATION',
        source: 'signature-service',
        account: '123456789012',
        time: '2024-01-01T00:00:00Z',
        region: 'us-east-1',
        detail: {},
      };
      expect(() => EventBridgeEventSchema.parse(event)).toThrow();
    });

    it('rejects empty version', () => {
      const event = {
        version: '',
        id: 'event-123',
        'detail-type': 'ENVELOPE_INVITATION',
        source: 'signature-service',
        account: '123456789012',
        time: '2024-01-01T00:00:00Z',
        region: 'us-east-1',
        detail: {},
      };
      expect(() => EventBridgeEventSchema.parse(event)).toThrow();
    });

    it('rejects missing id', () => {
      const event = {
        version: '0',
        'detail-type': 'ENVELOPE_INVITATION',
        source: 'signature-service',
        account: '123456789012',
        time: '2024-01-01T00:00:00Z',
        region: 'us-east-1',
        detail: {},
      };
      expect(() => EventBridgeEventSchema.parse(event)).toThrow();
    });

    it('rejects empty detail', () => {
      const event = {
        version: '0',
        id: 'event-123',
        'detail-type': 'ENVELOPE_INVITATION',
        source: 'signature-service',
        account: '123456789012',
        time: '2024-01-01T00:00:00Z',
        region: 'us-east-1',
        detail: {},
      };
      expect(() => EventBridgeEventSchema.parse(event)).toThrow();
    });

    it('validates with optional resources', () => {
      const event = {
        version: '0',
        id: 'event-123',
        'detail-type': 'ENVELOPE_INVITATION',
        source: 'signature-service',
        account: '123456789012',
        time: '2024-01-01T00:00:00Z',
        region: 'us-east-1',
        detail: {
          envelopeId: 'env-123',
        },
      };
      expect(() => EventBridgeEventSchema.parse(event)).not.toThrow();
    });
  });

  describe('EventDetailSchema', () => {
    it('validates valid event detail', () => {
      const detail = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        envelopeId: '123e4567-e89b-12d3-a456-426614174001',
        email: 'test@example.com',
      };
      expect(() => EventDetailSchema.parse(detail)).not.toThrow();
    });

    it('validates with optional fields missing', () => {
      const detail = {};
      expect(() => EventDetailSchema.parse(detail)).not.toThrow();
    });

    it('allows additional fields', () => {
      const detail = {
        extraField: 'value',
      };
      expect(() => EventDetailSchema.parse(detail)).not.toThrow();
    });
  });

  describe('SignatureServiceEventDetailSchema', () => {
    it('validates valid signature service event detail', () => {
      const detail = {
        signerEmail: 'signer@example.com',
        message: 'Please sign',
      };
      expect(() => SignatureServiceEventDetailSchema.parse(detail)).not.toThrow();
    });

    it('validates with optional fields', () => {
      const detail = {
        envelopeTitle: 'Document Title',
        reminderCount: 1,
      };
      expect(() => SignatureServiceEventDetailSchema.parse(detail)).not.toThrow();
    });
  });

  describe('AuthServiceEventDetailSchema', () => {
    it('validates valid auth service event detail', () => {
      const detail = {
        firstName: 'John',
        lastName: 'Doe',
        oldRole: 'user',
        newRole: 'admin',
      };
      expect(() => AuthServiceEventDetailSchema.parse(detail)).not.toThrow();
    });

    it('validates with optional fields missing', () => {
      const detail = {};
      expect(() => AuthServiceEventDetailSchema.parse(detail)).not.toThrow();
    });
  });
});



