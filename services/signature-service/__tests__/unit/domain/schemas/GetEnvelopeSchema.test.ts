/**
 * @fileoverview GetEnvelopeSchema Tests - Unit tests for get envelope schema validation
 * @summary Tests for GetEnvelopeSchema covering all get envelope validation scenarios
 * @description Comprehensive unit tests for GetEnvelopeSchema including path parameters,
 * query parameters, signer progress, and response validation with proper error handling.
 */

import {
  GetEnvelopePathSchema,
  GetEnvelopeQuerySchema,
  SignerProgressSchema,
  GetEnvelopeResponseSchema
} from '@/domain/schemas/GetEnvelopeSchema';

describe('GetEnvelopeSchema', () => {
  describe('GetEnvelopePathSchema', () => {
    it('should validate valid envelope ID path', () => {
      const validData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = GetEnvelopePathSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid envelope ID', () => {
      const invalidData = {
        envelopeId: 'invalid-uuid'
      };

      expect(() => GetEnvelopePathSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing envelope ID', () => {
      expect(() => GetEnvelopePathSchema.parse({})).toThrow();
    });
  });

  describe('GetEnvelopeQuerySchema', () => {
    it('should validate valid query parameters with all fields', () => {
      const validData = {
        includeSigners: true,
        includeProgress: true,
        includeMetadata: true
      };

      const result = GetEnvelopeQuerySchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate query parameters with minimal fields', () => {
      const minimalData = {};

      const result = GetEnvelopeQuerySchema.parse(minimalData);
      expect(result.includeSigners).toBe(true); // Default value
      expect(result.includeProgress).toBe(true); // Default value
      expect(result.includeMetadata).toBe(true); // Default value
    });

    it('should apply default values', () => {
      const data = {
        includeSigners: true
      };

      const result = GetEnvelopeQuerySchema.parse(data);
      expect(result.includeSigners).toBe(true);
      expect(result.includeProgress).toBe(true);
      expect(result.includeMetadata).toBe(true);
    });

    it('should reject invalid boolean values', () => {
      const invalidData = {
        includeSigners: 'not-a-boolean'
      };

      expect(() => GetEnvelopeQuerySchema.parse(invalidData)).toThrow();
    });
  });

  describe('SignerProgressSchema', () => {
    it('should validate valid signer progress with all fields', () => {
      const validData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        envelopeId: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        isExternal: true,
        email: 'signer@example.com',
        fullName: 'John Doe',
        invitedByUserId: '550e8400-e29b-41d4-a716-446655440003',
        participantRole: 'SIGNER',
        order: 1,
        status: 'PENDING',
        signedAt: '2024-01-01T00:00:00Z',
        declinedAt: '2024-01-02T00:00:00Z',
        declineReason: 'Not interested',
        consentGiven: true,
        consentTimestamp: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      const result = SignerProgressSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate signer progress with minimal required fields', () => {
      const minimalData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        envelopeId: '550e8400-e29b-41d4-a716-446655440001',
        isExternal: false,
        participantRole: 'SIGNER',
        order: 1,
        status: 'PENDING',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      const result = SignerProgressSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject invalid signer ID', () => {
      const invalidData = {
        id: 'invalid-uuid',
        envelopeId: '550e8400-e29b-41d4-a716-446655440001',
        isExternal: false,
        participantRole: 'SIGNER',
        order: 1,
        status: 'PENDING',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      expect(() => SignerProgressSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid envelope ID', () => {
      const invalidData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        envelopeId: 'invalid-uuid',
        isExternal: false,
        participantRole: 'SIGNER',
        order: 1,
        status: 'PENDING',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      expect(() => SignerProgressSchema.parse(invalidData)).toThrow();
    });

    it('should accept any participant role string', () => {
      const validData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        envelopeId: '550e8400-e29b-41d4-a716-446655440001',
        isExternal: false,
        participantRole: 'CUSTOM_ROLE',
        order: 1,
        status: 'PENDING',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      const result = SignerProgressSchema.parse(validData);
      expect(result.participantRole).toBe('CUSTOM_ROLE');
    });

    it('should reject invalid status', () => {
      const invalidData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        envelopeId: '550e8400-e29b-41d4-a716-446655440001',
        isExternal: false,
        participantRole: 'SIGNER',
        order: 1,
        status: 'INVALID_STATUS',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      expect(() => SignerProgressSchema.parse(invalidData)).toThrow();
    });

    it('should accept any order number', () => {
      const validData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        envelopeId: '550e8400-e29b-41d4-a716-446655440001',
        isExternal: false,
        participantRole: 'SIGNER',
        order: -1,
        status: 'PENDING',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      const result = SignerProgressSchema.parse(validData);
      expect(result.order).toBe(-1);
    });

    it('should reject invalid boolean values', () => {
      const invalidData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        envelopeId: '550e8400-e29b-41d4-a716-446655440001',
        isExternal: 'not-a-boolean',
        participantRole: 'SIGNER',
        order: 1,
        status: 'PENDING',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      expect(() => SignerProgressSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid datetime format', () => {
      const invalidData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        envelopeId: '550e8400-e29b-41d4-a716-446655440001',
        isExternal: false,
        participantRole: 'SIGNER',
        order: 1,
        status: 'PENDING',
        createdAt: 'invalid-datetime',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      expect(() => SignerProgressSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => SignerProgressSchema.parse({})).toThrow();
    });
  });

  describe('GetEnvelopeResponseSchema', () => {
    it('should validate valid get envelope response with all fields', () => {
      const validData = {
        envelope: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Test Envelope',
          description: 'Test Description',
          status: 'DRAFT',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          createdBy: '550e8400-e29b-41d4-a716-446655440003',
          signingOrderType: 'INVITEES_FIRST',
          originType: 'USER_UPLOAD'
        }
      };

      const result = GetEnvelopeResponseSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate get envelope response with minimal fields', () => {
      const minimalData = {
        envelope: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Test Envelope',
          status: 'DRAFT',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          createdBy: '550e8400-e29b-41d4-a716-446655440003',
          signingOrderType: 'INVITEES_FIRST',
          originType: 'USER_UPLOAD'
        }
      };

      const result = GetEnvelopeResponseSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject invalid envelope ID', () => {
      const invalidData = {
        envelope: {
          id: 'invalid-uuid',
          title: 'Test Envelope',
          status: 'DRAFT',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          createdBy: '550e8400-e29b-41d4-a716-446655440003',
          signingOrderType: 'INVITEES_FIRST',
          originType: 'USER_UPLOAD'
        }
      };

      expect(() => GetEnvelopeResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => GetEnvelopeResponseSchema.parse({})).toThrow();
    });
  });
});
