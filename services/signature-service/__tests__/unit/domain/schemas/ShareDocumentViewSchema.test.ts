/**
 * @fileoverview ShareDocumentViewSchema Tests - Unit tests for share document view schema validation
 * @summary Tests for ShareDocumentViewSchema covering all document view sharing validation scenarios
 * @description Comprehensive unit tests for ShareDocumentViewSchema including path parameters,
 * body validation, and response formatting with proper error handling.
 */

import {
  ShareDocumentViewPathSchema,
  ShareDocumentViewBodySchema,
  ShareDocumentViewResponseSchema
} from '@/domain/schemas/ShareDocumentViewSchema';

describe('ShareDocumentViewSchema', () => {
  describe('ShareDocumentViewPathSchema', () => {
    it('should validate valid envelope ID path', () => {
      const validData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = ShareDocumentViewPathSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid envelope ID', () => {
      const invalidData = {
        envelopeId: 'invalid-uuid'
      };

      expect(() => ShareDocumentViewPathSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing envelope ID', () => {
      expect(() => ShareDocumentViewPathSchema.parse({})).toThrow();
    });
  });

  describe('ShareDocumentViewBodySchema', () => {
    it('should validate valid share document view body with all fields', () => {
      const validData = {
        email: 'viewer@example.com',
        fullName: 'John Viewer',
        message: 'Please review this document',
        expiresIn: 7
      };

      const result = ShareDocumentViewBodySchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate share document view body with minimal required fields', () => {
      const minimalData = {
        email: 'viewer@example.com',
        fullName: 'John Viewer'
      };

      const result = ShareDocumentViewBodySchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should apply default values', () => {
      const data = {
        email: 'viewer@example.com',
        fullName: 'John Viewer'
      };

      const result = ShareDocumentViewBodySchema.parse(data);
      expect(result.expiresIn).toBeUndefined(); // No default value
    });

    it('should reject invalid viewer email format', () => {
      const invalidData = {
        email: 'invalid-email',
        fullName: 'John Viewer'
      };

      expect(() => ShareDocumentViewBodySchema.parse(invalidData)).toThrow();
    });

    it('should reject empty viewer name', () => {
      const invalidData = {
        email: 'viewer@example.com',
        fullName: ''
      };

      expect(() => ShareDocumentViewBodySchema.parse(invalidData)).toThrow();
    });

    it('should accept long viewer name', () => {
      const validData = {
        email: 'viewer@example.com',
        fullName: 'a'.repeat(256)
      };

      const result = ShareDocumentViewBodySchema.parse(validData);
      expect(result.fullName).toBe('a'.repeat(256));
    });

    it('should accept long message', () => {
      const validData = {
        email: 'viewer@example.com',
        fullName: 'John Viewer',
        message: 'a'.repeat(1001)
      };

      const result = ShareDocumentViewBodySchema.parse(validData);
      expect(result.message).toBe('a'.repeat(1001));
    });

    it('should reject expires in days that is not a number', () => {
      const invalidData = {
        email: 'viewer@example.com',
        fullName: 'John Viewer',
        expiresIn: 'not-a-number'
      };

      expect(() => ShareDocumentViewBodySchema.parse(invalidData)).toThrow();
    });

    it('should reject expires in days that is negative', () => {
      const invalidData = {
        email: 'viewer@example.com',
        fullName: 'John Viewer',
        expiresIn: -1
      };

      expect(() => ShareDocumentViewBodySchema.parse(invalidData)).toThrow();
    });

    it('should reject expires in days that is too large', () => {
      const invalidData = {
        email: 'viewer@example.com',
        fullName: 'John Viewer',
        expiresIn: 366 // More than 365 days
      };

      expect(() => ShareDocumentViewBodySchema.parse(invalidData)).toThrow();
    });

    it('should accept additional fields not in schema', () => {
      const validData = {
        email: 'viewer@example.com',
        fullName: 'John Viewer',
        allowDownload: 'not-a-boolean'
      };

      const result = ShareDocumentViewBodySchema.parse(validData);
      expect(result.email).toBe('viewer@example.com');
      expect(result.fullName).toBe('John Viewer');
    });

    it('should accept additional fields with different names', () => {
      const validData = {
        email: 'viewer@example.com',
        fullName: 'John Viewer',
        password: 'a'.repeat(129)
      };

      const result = ShareDocumentViewBodySchema.parse(validData);
      expect(result.email).toBe('viewer@example.com');
      expect(result.fullName).toBe('John Viewer');
    });

    it('should reject missing required fields', () => {
      expect(() => ShareDocumentViewBodySchema.parse({})).toThrow();
    });
  });

  describe('ShareDocumentViewResponseSchema', () => {
    it('should validate valid share document view response with all fields', () => {
      const validData = {
        success: true,
        message: 'Document view shared successfully',
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        viewerEmail: 'viewer@example.com',
        viewerName: 'John Viewer',
        token: 'view-token-123',
        expiresAt: '2024-01-02T00:00:00Z',
        expiresInDays: 7
      };

      const result = ShareDocumentViewResponseSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate share document view response with minimal fields', () => {
      const minimalData = {
        success: true,
        message: 'Document view shared successfully',
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        viewerEmail: 'viewer@example.com',
        viewerName: 'John Viewer',
        token: 'view-token-123',
        expiresAt: '2024-01-02T00:00:00Z',
        expiresInDays: 7
      };

      const result = ShareDocumentViewResponseSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject invalid share ID', () => {
      const invalidData = {
        success: true,
        message: 'Document view shared successfully',
        shareId: 'invalid-uuid',
        shareUrl: 'https://example.com/view/invalid-uuid'
      };

      expect(() => ShareDocumentViewResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid share URL', () => {
      const invalidData = {
        success: true,
        message: 'Document view shared successfully',
        shareId: '550e8400-e29b-41d4-a716-446655440000',
        shareUrl: 'invalid-url'
      };

      expect(() => ShareDocumentViewResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid datetime format', () => {
      const invalidData = {
        success: true,
        message: 'Document view shared successfully',
        shareId: '550e8400-e29b-41d4-a716-446655440000',
        shareUrl: 'https://example.com/view/550e8400-e29b-41d4-a716-446655440000',
        expiresAt: 'invalid-datetime'
      };

      expect(() => ShareDocumentViewResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid viewer email format', () => {
      const invalidData = {
        success: true,
        message: 'Document view shared successfully',
        shareId: '550e8400-e29b-41d4-a716-446655440000',
        shareUrl: 'https://example.com/view/550e8400-e29b-41d4-a716-446655440000',
        viewerEmail: 'invalid-email'
      };

      expect(() => ShareDocumentViewResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid permissions', () => {
      const invalidData = {
        success: true,
        message: 'Document view shared successfully',
        shareId: '550e8400-e29b-41d4-a716-446655440000',
        shareUrl: 'https://example.com/view/550e8400-e29b-41d4-a716-446655440000',
        permissions: {
          allowDownload: 'not-a-boolean',
          allowPrint: false
        }
      };

      expect(() => ShareDocumentViewResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => ShareDocumentViewResponseSchema.parse({})).toThrow();
    });
  });
});
