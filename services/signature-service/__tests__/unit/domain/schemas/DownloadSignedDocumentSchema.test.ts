/**
 * @fileoverview DownloadSignedDocumentSchema Tests - Unit tests for download document schema validation
 * @summary Tests for DownloadSignedDocumentSchema covering all download document validation scenarios
 * @description Comprehensive unit tests for DownloadSignedDocumentSchema including path parameters,
 * query parameters, and response validation with proper error handling.
 */

import {
  DownloadDocumentPathSchema,
  DownloadDocumentQuerySchema,
  DownloadDocumentResponseSchema
} from '@/domain/schemas/DownloadSignedDocumentSchema';

// Mock the loadConfig function
jest.mock('../../../../src/config/AppConfig', () => ({
  loadConfig: jest.fn(() => ({
    documentDownload: {
      minExpirationSeconds: 60,
      maxExpirationSeconds: 3600
    }
  }))
}));

describe('DownloadSignedDocumentSchema', () => {
  describe('DownloadDocumentPathSchema', () => {
    it('should validate valid envelope ID path', () => {
      const validData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = DownloadDocumentPathSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid envelope ID', () => {
      const invalidData = {
        envelopeId: 'invalid-uuid'
      };

      expect(() => DownloadDocumentPathSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing envelope ID', () => {
      expect(() => DownloadDocumentPathSchema.parse({})).toThrow();
    });
  });

  describe('DownloadDocumentQuerySchema', () => {
    it('should validate valid query parameters with all fields', () => {
      const validData = {
        expiresIn: '3600',
        invitationToken: 'valid-token-123'
      };

      const result = DownloadDocumentQuerySchema.parse(validData);
      expect(result).toEqual({
        expiresIn: 3600,
        invitationToken: 'valid-token-123'
      });
    });

    it('should validate query parameters with minimal fields', () => {
      const minimalData = {};

      const result = DownloadDocumentQuerySchema.parse(minimalData);
      expect(result).toEqual({});
    });

    it('should validate query parameters with only invitation token', () => {
      const data = {
        invitationToken: 'valid-token-123'
      };

      const result = DownloadDocumentQuerySchema.parse(data);
      expect(result).toEqual(data);
    });

    it('should validate query parameters with only expires in', () => {
      const data = {
        expiresIn: '1800'
      };

      const result = DownloadDocumentQuerySchema.parse(data);
      expect(result).toEqual({
        expiresIn: 1800
      });
    });

    it('should transform string expiresIn to number', () => {
      const data = {
        expiresIn: '1200'
      };

      const result = DownloadDocumentQuerySchema.parse(data);
      expect(result.expiresIn).toBe(1200);
    });

    it('should handle undefined expiresIn', () => {
      const data = {
        invitationToken: 'valid-token-123'
      };

      const result = DownloadDocumentQuerySchema.parse(data);
      expect(result.expiresIn).toBeUndefined();
    });

    it('should reject invalid expiresIn format', () => {
      const invalidData = {
        expiresIn: 'not-a-number'
      };

      expect(() => DownloadDocumentQuerySchema.parse(invalidData)).toThrow();
    });

    it('should reject expiresIn that is too small', () => {
      const invalidData = {
        expiresIn: '30' // Less than minExpirationSeconds (60)
      };

      expect(() => DownloadDocumentQuerySchema.parse(invalidData)).toThrow();
    });

    it('should reject expiresIn that is too large', () => {
      const invalidData = {
        expiresIn: '7200' // More than maxExpirationSeconds (3600)
      };

      expect(() => DownloadDocumentQuerySchema.parse(invalidData)).toThrow();
    });

    it('should accept expiresIn at minimum boundary', () => {
      const data = {
        expiresIn: '60' // Exactly minExpirationSeconds
      };

      const result = DownloadDocumentQuerySchema.parse(data);
      expect(result.expiresIn).toBe(60);
    });

    it('should accept expiresIn at maximum boundary', () => {
      const data = {
        expiresIn: '3600' // Exactly maxExpirationSeconds
      };

      const result = DownloadDocumentQuerySchema.parse(data);
      expect(result.expiresIn).toBe(3600);
    });

    it('should accept empty invitation token', () => {
      const validData = {
        invitationToken: ''
      };

      const result = DownloadDocumentQuerySchema.parse(validData);
      expect(result.invitationToken).toBe('');
    });

    it('should accept long invitation token', () => {
      const validData = {
        invitationToken: 'a'.repeat(1001)
      };

      const result = DownloadDocumentQuerySchema.parse(validData);
      expect(result.invitationToken).toBe('a'.repeat(1001));
    });
  });

  describe('DownloadDocumentResponseSchema', () => {
    it('should validate valid download document response with all fields', () => {
      const validData = {
        success: true,
        message: 'Document download URL generated successfully',
        downloadUrl: 'https://example.com/download/550e8400-e29b-41d4-a716-446655440000',
        expiresIn: 3600,
        expiresAt: '2024-01-02T00:00:00Z'
      };

      const result = DownloadDocumentResponseSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate download document response with minimal required fields', () => {
      const minimalData = {
        success: true,
        message: 'Document download URL generated successfully',
        downloadUrl: 'https://example.com/download/550e8400-e29b-41d4-a716-446655440000',
        expiresIn: 3600,
        expiresAt: '2024-01-02T00:00:00Z'
      };

      const result = DownloadDocumentResponseSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject invalid success field', () => {
      const invalidData = {
        success: 'not-a-boolean',
        message: 'Document download URL generated successfully',
        downloadUrl: 'https://example.com/download/550e8400-e29b-41d4-a716-446655440000',
        expiresIn: 3600,
        expiresAt: '2024-01-02T00:00:00Z'
      };

      expect(() => DownloadDocumentResponseSchema.parse(invalidData)).toThrow();
    });

    it('should accept empty message', () => {
      const validData = {
        success: true,
        message: '',
        downloadUrl: 'https://example.com/download/550e8400-e29b-41d4-a716-446655440000',
        expiresIn: 3600,
        expiresAt: '2024-01-02T00:00:00Z'
      };

      const result = DownloadDocumentResponseSchema.parse(validData);
      expect(result.message).toBe('');
    });

    it('should accept long message', () => {
      const validData = {
        success: true,
        message: 'a'.repeat(1001),
        downloadUrl: 'https://example.com/download/550e8400-e29b-41d4-a716-446655440000',
        expiresIn: 3600,
        expiresAt: '2024-01-02T00:00:00Z'
      };

      const result = DownloadDocumentResponseSchema.parse(validData);
      expect(result.message).toBe('a'.repeat(1001));
    });

    it('should reject invalid download URL', () => {
      const invalidData = {
        success: true,
        message: 'Document download URL generated successfully',
        downloadUrl: 'invalid-url',
        expiresIn: 3600,
        expiresAt: '2024-01-02T00:00:00Z'
      };

      expect(() => DownloadDocumentResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject download URL that is not a URL', () => {
      const invalidData = {
        success: true,
        message: 'Document download URL generated successfully',
        downloadUrl: 'not-a-url',
        expiresIn: 3600,
        expiresAt: '2024-01-02T00:00:00Z'
      };

      expect(() => DownloadDocumentResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject expiresIn that is not a number', () => {
      const invalidData = {
        success: true,
        message: 'Document download URL generated successfully',
        downloadUrl: 'https://example.com/download/550e8400-e29b-41d4-a716-446655440000',
        expiresIn: 'not-a-number',
        expiresAt: '2024-01-02T00:00:00Z'
      };

      expect(() => DownloadDocumentResponseSchema.parse(invalidData)).toThrow();
    });

    it('should accept negative expiresIn', () => {
      const validData = {
        success: true,
        message: 'Document download URL generated successfully',
        downloadUrl: 'https://example.com/download/550e8400-e29b-41d4-a716-446655440000',
        expiresIn: -1,
        expiresAt: '2024-01-02T00:00:00Z'
      };

      const result = DownloadDocumentResponseSchema.parse(validData);
      expect(result.expiresIn).toBe(-1);
    });

    it('should reject invalid datetime format for expiresAt', () => {
      const invalidData = {
        success: true,
        message: 'Document download URL generated successfully',
        downloadUrl: 'https://example.com/download/550e8400-e29b-41d4-a716-446655440000',
        expiresIn: 3600,
        expiresAt: 'invalid-datetime'
      };

      expect(() => DownloadDocumentResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => DownloadDocumentResponseSchema.parse({})).toThrow();
    });

    it('should reject missing success field', () => {
      const invalidData = {
        message: 'Document download URL generated successfully',
        downloadUrl: 'https://example.com/download/550e8400-e29b-41d4-a716-446655440000',
        expiresIn: 3600,
        expiresAt: '2024-01-02T00:00:00Z'
      };

      expect(() => DownloadDocumentResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing message field', () => {
      const invalidData = {
        success: true,
        downloadUrl: 'https://example.com/download/550e8400-e29b-41d4-a716-446655440000',
        expiresIn: 3600,
        expiresAt: '2024-01-02T00:00:00Z'
      };

      expect(() => DownloadDocumentResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing downloadUrl field', () => {
      const invalidData = {
        success: true,
        message: 'Document download URL generated successfully',
        expiresIn: 3600,
        expiresAt: '2024-01-02T00:00:00Z'
      };

      expect(() => DownloadDocumentResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing expiresIn field', () => {
      const invalidData = {
        success: true,
        message: 'Document download URL generated successfully',
        downloadUrl: 'https://example.com/download/550e8400-e29b-41d4-a716-446655440000',
        expiresAt: '2024-01-02T00:00:00Z'
      };

      expect(() => DownloadDocumentResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing expiresAt field', () => {
      const invalidData = {
        success: true,
        message: 'Document download URL generated successfully',
        downloadUrl: 'https://example.com/download/550e8400-e29b-41d4-a716-446655440000',
        expiresIn: 3600
      };

      expect(() => DownloadDocumentResponseSchema.parse(invalidData)).toThrow();
    });
  });
});
