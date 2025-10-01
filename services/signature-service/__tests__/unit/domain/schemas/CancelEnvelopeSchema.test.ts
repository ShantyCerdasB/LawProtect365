/**
 * @fileoverview CancelEnvelopeSchema Tests - Unit tests for cancel envelope schema validation
 * @summary Tests for CancelEnvelopeSchema covering all cancel envelope validation scenarios
 * @description Comprehensive unit tests for CancelEnvelopeSchema including request and response
 * validation with proper error handling.
 */

import {
  CancelEnvelopeRequestSchema,
  CancelEnvelopeResponseSchema
} from '@/domain/schemas/CancelEnvelopeSchema';

describe('CancelEnvelopeSchema', () => {
  describe('CancelEnvelopeRequestSchema', () => {
    it('should validate valid cancel envelope request', () => {
      const validData = {};

      const result = CancelEnvelopeRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate cancel envelope request with additional fields', () => {
      const dataWithExtraFields = {
        reason: 'No longer needed',
        notifySigners: true
      };

      // The schema should strip additional fields since it's an empty object
      const result = CancelEnvelopeRequestSchema.parse(dataWithExtraFields);
      expect(result).toEqual({});
    });

    it('should validate cancel envelope request with null values', () => {
      const dataWithNulls = {
        reason: null,
        notifySigners: null
      };

      const result = CancelEnvelopeRequestSchema.parse(dataWithNulls);
      expect(result).toEqual({});
    });

    it('should validate cancel envelope request with undefined values', () => {
      const dataWithUndefined = {
        reason: undefined,
        notifySigners: undefined
      };

      const result = CancelEnvelopeRequestSchema.parse(dataWithUndefined);
      expect(result).toEqual({});
    });
  });

  describe('CancelEnvelopeResponseSchema', () => {
    it('should validate valid cancel envelope response with all fields', () => {
      const validData = {
        success: true,
        message: 'Envelope cancelled successfully',
        envelope: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'CANCELLED',
          title: 'Test Envelope',
          cancelledAt: '2024-01-01T00:00:00Z'
        }
      };

      const result = CancelEnvelopeResponseSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate cancel envelope response with minimal required fields', () => {
      const minimalData = {
        success: true,
        message: 'Envelope cancelled successfully',
        envelope: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'CANCELLED',
          title: 'Test Envelope'
        }
      };

      const result = CancelEnvelopeResponseSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject invalid success field', () => {
      const invalidData = {
        success: 'not-a-boolean',
        message: 'Envelope cancelled successfully',
        envelope: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'CANCELLED',
          title: 'Test Envelope'
        }
      };

      expect(() => CancelEnvelopeResponseSchema.parse(invalidData)).toThrow();
    });

    it('should accept empty message', () => {
      const validData = {
        success: true,
        message: '',
        envelope: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'CANCELLED',
          title: 'Test Envelope'
        }
      };

      const result = CancelEnvelopeResponseSchema.parse(validData);
      expect(result.message).toBe('');
    });

    it('should accept long message', () => {
      const validData = {
        success: true,
        message: 'a'.repeat(1001),
        envelope: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'CANCELLED',
          title: 'Test Envelope'
        }
      };

      const result = CancelEnvelopeResponseSchema.parse(validData);
      expect(result.message).toBe('a'.repeat(1001));
    });

    it('should accept any envelope ID', () => {
      const validData = {
        success: true,
        message: 'Envelope cancelled successfully',
        envelope: {
          id: 'invalid-uuid',
          status: 'CANCELLED',
          title: 'Test Envelope'
        }
      };

      const result = CancelEnvelopeResponseSchema.parse(validData);
      expect(result.envelope.id).toBe('invalid-uuid');
    });

    it('should accept empty envelope title', () => {
      const validData = {
        success: true,
        message: 'Envelope cancelled successfully',
        envelope: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'CANCELLED',
          title: ''
        }
      };

      const result = CancelEnvelopeResponseSchema.parse(validData);
      expect(result.envelope.title).toBe('');
    });

    it('should accept long envelope title', () => {
      const validData = {
        success: true,
        message: 'Envelope cancelled successfully',
        envelope: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'CANCELLED',
          title: 'a'.repeat(256)
        }
      };

      const result = CancelEnvelopeResponseSchema.parse(validData);
      expect(result.envelope.title).toBe('a'.repeat(256));
    });

    it('should accept any envelope status', () => {
      const validData = {
        success: true,
        message: 'Envelope cancelled successfully',
        envelope: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'INVALID_STATUS',
          title: 'Test Envelope'
        }
      };

      const result = CancelEnvelopeResponseSchema.parse(validData);
      expect(result.envelope.status).toBe('INVALID_STATUS');
    });

    it('should accept any datetime format for cancelledAt', () => {
      const validData = {
        success: true,
        message: 'Envelope cancelled successfully',
        envelope: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'CANCELLED',
          title: 'Test Envelope',
          cancelledAt: 'invalid-datetime'
        }
      };

      const result = CancelEnvelopeResponseSchema.parse(validData);
      expect(result.envelope.cancelledAt).toBe('invalid-datetime');
    });

    it('should reject missing required fields', () => {
      expect(() => CancelEnvelopeResponseSchema.parse({})).toThrow();
    });

    it('should reject missing envelope object', () => {
      const invalidData = {
        success: true,
        message: 'Envelope cancelled successfully'
      };

      expect(() => CancelEnvelopeResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject envelope object with missing required fields', () => {
      const invalidData = {
        success: true,
        message: 'Envelope cancelled successfully',
        envelope: {
          id: '550e8400-e29b-41d4-a716-446655440000'
        }
      };

      expect(() => CancelEnvelopeResponseSchema.parse(invalidData)).toThrow();
    });
  });
});
