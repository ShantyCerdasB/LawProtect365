/**
 * @fileoverview AuditSchema Tests - Unit tests for audit schema validation
 * @summary Tests for AuditSchema covering all validation scenarios
 * @description Comprehensive unit tests for AuditSchema including audit event creation,
 * audit trail queries, and response validation with proper error handling and edge cases.
 */

import {
  AuditEventTypeSchema,
  CreateAuditEventSchema,
  AuditEventIdSchema,
  AuditTrailQuerySchema,
  AuditEventResponseSchema,
  AuditTrailResponseSchema
} from '@/domain/schemas/AuditSchema';
import { AuditEventType } from '@/domain/enums/AuditEventType';

describe('AuditSchema', () => {
  describe('AuditEventTypeSchema', () => {
    it('should validate valid audit event types', () => {
      expect(AuditEventTypeSchema.parse(AuditEventType.ENVELOPE_CREATED)).toBe(AuditEventType.ENVELOPE_CREATED);
      expect(AuditEventTypeSchema.parse(AuditEventType.ENVELOPE_SENT)).toBe(AuditEventType.ENVELOPE_SENT);
      expect(AuditEventTypeSchema.parse(AuditEventType.ENVELOPE_SENT)).toBe(AuditEventType.ENVELOPE_SENT);
      expect(AuditEventTypeSchema.parse(AuditEventType.ENVELOPE_CANCELLED)).toBe(AuditEventType.ENVELOPE_CANCELLED);
      expect(AuditEventTypeSchema.parse(AuditEventType.DOCUMENT_ACCESSED)).toBe(AuditEventType.DOCUMENT_ACCESSED);
      expect(AuditEventTypeSchema.parse(AuditEventType.DOCUMENT_DOWNLOADED)).toBe(AuditEventType.DOCUMENT_DOWNLOADED);
      expect(AuditEventTypeSchema.parse(AuditEventType.SIGNER_INVITED)).toBe(AuditEventType.SIGNER_INVITED);
      expect(AuditEventTypeSchema.parse(AuditEventType.SIGNER_SIGNED)).toBe(AuditEventType.SIGNER_SIGNED);
      expect(AuditEventTypeSchema.parse(AuditEventType.SIGNER_DECLINED)).toBe(AuditEventType.SIGNER_DECLINED);
      expect(AuditEventTypeSchema.parse(AuditEventType.CONSENT_GIVEN)).toBe(AuditEventType.CONSENT_GIVEN);
    });

    it('should reject invalid audit event types', () => {
      expect(() => AuditEventTypeSchema.parse('INVALID_TYPE')).toThrow();
      expect(() => AuditEventTypeSchema.parse('')).toThrow();
      expect(() => AuditEventTypeSchema.parse(null)).toThrow();
      expect(() => AuditEventTypeSchema.parse(undefined)).toThrow();
    });
  });

  describe('CreateAuditEventSchema', () => {
    it('should validate valid audit event creation data', () => {
      const validData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        signerId: '550e8400-e29b-41d4-a716-446655440001',
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Envelope created successfully',
        userId: 'user-123',
        userEmail: 'user@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: { key: 'value' }
      };

      const result = CreateAuditEventSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate audit event creation with minimal required fields', () => {
      const minimalData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Envelope created',
        userId: 'user-123'
      };

      const result = CreateAuditEventSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject invalid envelope ID', () => {
      const invalidData = {
        envelopeId: 'invalid-uuid',
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Test',
        userId: 'user-123'
      };

      expect(() => CreateAuditEventSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid signer ID', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        signerId: 'invalid-uuid',
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Test',
        userId: 'user-123'
      };

      expect(() => CreateAuditEventSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Test',
        userId: 'user-123',
        userEmail: 'invalid-email'
      };

      expect(() => CreateAuditEventSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid IP address', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Test',
        userId: 'user-123',
        ipAddress: 'invalid-ip'
      };

      expect(() => CreateAuditEventSchema.parse(invalidData)).toThrow();
    });

    it('should reject description that is too long', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'a'.repeat(1001),
        userId: 'user-123'
      };

      expect(() => CreateAuditEventSchema.parse(invalidData)).toThrow();
    });

    it('should reject user agent that is too long', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Test',
        userId: 'user-123',
        userAgent: 'a'.repeat(501)
      };

      expect(() => CreateAuditEventSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => CreateAuditEventSchema.parse({})).toThrow();
      expect(() => CreateAuditEventSchema.parse({ envelopeId: '550e8400-e29b-41d4-a716-446655440000' })).toThrow();
      expect(() => CreateAuditEventSchema.parse({ eventType: AuditEventType.ENVELOPE_CREATED })).toThrow();
    });
  });

  describe('AuditEventIdSchema', () => {
    it('should validate valid audit event ID', () => {
      const validData = {
        auditEventId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = AuditEventIdSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid audit event ID', () => {
      const invalidData = {
        auditEventId: 'invalid-uuid'
      };

      expect(() => AuditEventIdSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing audit event ID', () => {
      expect(() => AuditEventIdSchema.parse({})).toThrow();
    });
  });

  describe('AuditTrailQuerySchema', () => {
    it('should validate valid audit trail query with all fields', () => {
      const validData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        limit: 50,
        cursor: 'cursor-123',
        eventType: AuditEventType.ENVELOPE_CREATED,
        userId: 'user-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      };

      const result = AuditTrailQuerySchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate audit trail query with minimal fields', () => {
      const minimalData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = AuditTrailQuerySchema.parse(minimalData);
      expect(result.limit).toBe(20); // Default value
    });

    it('should apply default limit', () => {
      const data = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = AuditTrailQuerySchema.parse(data);
      expect(result.limit).toBe(20);
    });

    it('should reject invalid envelope ID', () => {
      const invalidData = {
        envelopeId: 'invalid-uuid'
      };

      expect(() => AuditTrailQuerySchema.parse(invalidData)).toThrow();
    });

    it('should reject limit that is too small', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        limit: 0
      };

      expect(() => AuditTrailQuerySchema.parse(invalidData)).toThrow();
    });

    it('should reject limit that is too large', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        limit: 101
      };

      expect(() => AuditTrailQuerySchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid event type', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        eventType: 'INVALID_TYPE'
      };

      expect(() => AuditTrailQuerySchema.parse(invalidData)).toThrow();
    });

    it('should reject missing envelope ID', () => {
      expect(() => AuditTrailQuerySchema.parse({})).toThrow();
    });
  });

  describe('AuditEventResponseSchema', () => {
    it('should validate valid audit event response', () => {
      const validData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        envelopeId: '550e8400-e29b-41d4-a716-446655440001',
        signerId: '550e8400-e29b-41d4-a716-446655440002',
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Envelope created',
        userId: 'user-123',
        userEmail: 'user@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: { key: 'value' },
        createdAt: new Date('2024-01-01')
      };

      const result = AuditEventResponseSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate audit event response with minimal fields', () => {
      const minimalData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        envelopeId: '550e8400-e29b-41d4-a716-446655440001',
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Envelope created',
        userId: 'user-123',
        createdAt: new Date('2024-01-01')
      };

      const result = AuditEventResponseSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject invalid ID', () => {
      const invalidData = {
        id: 'invalid-uuid',
        envelopeId: '550e8400-e29b-41d4-a716-446655440001',
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Test',
        userId: 'user-123',
        createdAt: new Date('2024-01-01')
      };

      expect(() => AuditEventResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => AuditEventResponseSchema.parse({})).toThrow();
    });
  });

  describe('AuditTrailResponseSchema', () => {
    it('should validate valid audit trail response', () => {
      const validData = {
        events: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            envelopeId: '550e8400-e29b-41d4-a716-446655440001',
            eventType: AuditEventType.ENVELOPE_CREATED,
            description: 'Envelope created',
            userId: 'user-123',
            createdAt: new Date('2024-01-01')
          }
        ],
        nextCursor: 'cursor-123',
        hasMore: true
      };

      const result = AuditTrailResponseSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate audit trail response without optional fields', () => {
      const minimalData = {
        events: [],
        hasMore: false
      };

      const result = AuditTrailResponseSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject invalid events array', () => {
      const invalidData = {
        events: 'not-an-array',
        hasMore: false
      };

      expect(() => AuditTrailResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => AuditTrailResponseSchema.parse({})).toThrow();
    });
  });
});
