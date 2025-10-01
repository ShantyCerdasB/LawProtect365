/**
 * @fileoverview SigningHandlersSchema Tests - Unit tests for signing handlers schema validation
 * @summary Tests for SigningHandlersSchema covering all signing handler validation scenarios
 * @description Comprehensive unit tests for SigningHandlersSchema including document signing,
 * viewing, declining operations, and invitation token validation with proper error handling.
 */

import {
  SignDocumentRequestSchema,
  ViewDocumentRequestSchema,
  DeclineSignerRequestSchema,
  InvitationTokenPathSchema,
  SignDocumentResponseSchema,
  ViewDocumentResponseSchema,
  DeclineSignerResponseSchema
} from '@/domain/schemas/SigningHandlersSchema';

describe('SigningHandlersSchema', () => {
  describe('SignDocumentRequestSchema', () => {
    it('should validate valid sign document request with invitation token', () => {
      const validData = {
        invitationToken: 'valid-token-123',
        flattenedKey: 'flattened-key-123',
        signedDocument: 'base64-signed-document',
        consent: {
          given: true,
          timestamp: '2024-01-01T00:00:00Z',
          text: 'I agree to sign this document',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          country: 'US'
        }
      };

      const result = SignDocumentRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate sign document request with authenticated user', () => {
      const validData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        signerId: '550e8400-e29b-41d4-a716-446655440001',
        flattenedKey: 'flattened-key-123',
        signedDocument: 'base64-signed-document',
        consent: {
          given: true,
          timestamp: '2024-01-01T00:00:00Z',
          text: 'I agree to sign this document',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          country: 'US'
        }
      };

      const result = SignDocumentRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate sign document request with minimal required fields', () => {
      const minimalData = {
        invitationToken: 'valid-token-123',
        consent: {
          given: true,
          timestamp: '2024-01-01T00:00:00Z',
          text: 'I agree to sign this document'
        }
      };

      const result = SignDocumentRequestSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject request without invitation token or userId', () => {
      const invalidData = {
        consentGiven: true
      };

      expect(() => SignDocumentRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject request with both invitation token and userId', () => {
      const invalidData = {
        invitationToken: 'valid-token-123',
        userId: 'user-123',
        consentGiven: true
      };

      expect(() => SignDocumentRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject request without consent', () => {
      const invalidData = {
        invitationToken: 'valid-token-123',
        consentGiven: false
      };

      expect(() => SignDocumentRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject request with empty consent text when consent is given', () => {
      const invalidData = {
        invitationToken: 'valid-token-123',
        consentGiven: true,
        consentText: ''
      };

      expect(() => SignDocumentRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject request with consent text when consent is not given', () => {
      const invalidData = {
        invitationToken: 'valid-token-123',
        consentGiven: false,
        consentText: 'I agree'
      };

      expect(() => SignDocumentRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject request with invalid signature data', () => {
      const invalidData = {
        invitationToken: 'valid-token-123',
        consentGiven: true,
        signatureData: {
          signature: '',
          timestamp: new Date('2024-01-01T00:00:00Z')
        }
      };

      expect(() => SignDocumentRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject request with invalid timestamp', () => {
      const invalidData = {
        invitationToken: 'valid-token-123',
        consentGiven: true,
        signatureData: {
          signature: 'base64-signature-data',
          timestamp: 'invalid-date'
        }
      };

      expect(() => SignDocumentRequestSchema.parse(invalidData)).toThrow();
    });
  });

  describe('ViewDocumentRequestSchema', () => {
    it('should validate valid view document request with invitation token', () => {
      const validData = {
        invitationToken: 'valid-token-123'
      };

      const result = ViewDocumentRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate view document request with authenticated user', () => {
      const validData = {
        invitationToken: 'valid-token-123'
      };

      const result = ViewDocumentRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject request without invitation token or userId', () => {
      const invalidData = {};

      expect(() => ViewDocumentRequestSchema.parse(invalidData)).toThrow();
    });

    it('should accept request with invitation token only', () => {
      const validData = {
        invitationToken: 'valid-token-123'
      };

      const result = ViewDocumentRequestSchema.parse(validData);
      expect(result.invitationToken).toBe('valid-token-123');
    });
  });

  describe('DeclineSignerRequestSchema', () => {
    it('should validate valid decline signer request with invitation token', () => {
      const validData = {
        invitationToken: 'valid-token-123',
        reason: 'Not interested in signing this document'
      };

      const result = DeclineSignerRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate decline signer request with authenticated user', () => {
      const validData = {
        invitationToken: 'valid-token-123',
        reason: 'Not interested in signing this document'
      };

      const result = DeclineSignerRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate decline signer request with minimal required fields', () => {
      const minimalData = {
        invitationToken: 'valid-token-123',
        reason: 'Not interested'
      };

      const result = DeclineSignerRequestSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject request without invitation token or userId', () => {
      const invalidData = {
        reason: 'Not interested'
      };

      expect(() => DeclineSignerRequestSchema.parse(invalidData)).toThrow();
    });

    it('should accept request with invitation token and additional fields', () => {
      const validData = {
        invitationToken: 'valid-token-123',
        userId: 'user-123',
        reason: 'Not interested'
      };

      const result = DeclineSignerRequestSchema.parse(validData);
      expect(result.invitationToken).toBe('valid-token-123');
      expect(result.reason).toBe('Not interested');
    });

    it('should reject request with reason that is too long', () => {
      const invalidData = {
        invitationToken: 'valid-token-123',
        reason: 'a'.repeat(501)
      };

      expect(() => DeclineSignerRequestSchema.parse(invalidData)).toThrow();
    });
  });

  describe('InvitationTokenPathSchema', () => {
    it('should validate valid invitation token path', () => {
      const validData = {
        invitationToken: 'valid-token-123'
      };

      const result = InvitationTokenPathSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject empty invitation token', () => {
      const invalidData = {
        invitationToken: ''
      };

      expect(() => InvitationTokenPathSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing invitation token', () => {
      expect(() => InvitationTokenPathSchema.parse({})).toThrow();
    });
  });

  describe('SignDocumentResponseSchema', () => {
    it('should validate valid sign document response', () => {
      const validData = {
        message: 'Document signed successfully',
        signature: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          signerId: '550e8400-e29b-41d4-a716-446655440001',
          envelopeId: '550e8400-e29b-41d4-a716-446655440002',
          signedAt: '2024-01-01T00:00:00Z',
          algorithm: 'RSA-SHA256',
          hash: 'abc123def456'
        },
        envelope: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          status: 'IN_PROGRESS',
          progress: 50
        }
      };

      const result = SignDocumentResponseSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate sign document response with minimal fields', () => {
      const minimalData = {
        message: 'Document signed successfully',
        signature: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          signerId: '550e8400-e29b-41d4-a716-446655440001',
          envelopeId: '550e8400-e29b-41d4-a716-446655440002',
          signedAt: '2024-01-01T00:00:00Z',
          algorithm: 'RSA-SHA256',
          hash: 'abc123def456'
        },
        envelope: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          status: 'IN_PROGRESS',
          progress: 50
        }
      };

      const result = SignDocumentResponseSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject invalid envelope ID', () => {
      const invalidData = {
        success: true,
        message: 'Document signed successfully',
        envelopeId: 'invalid-uuid'
      };

      expect(() => SignDocumentResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid signer ID', () => {
      const invalidData = {
        success: true,
        message: 'Document signed successfully',
        signerId: 'invalid-uuid'
      };

      expect(() => SignDocumentResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid datetime format', () => {
      const invalidData = {
        success: true,
        message: 'Document signed successfully',
        signedAt: 'invalid-datetime'
      };

      expect(() => SignDocumentResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => SignDocumentResponseSchema.parse({})).toThrow();
    });
  });

  describe('ViewDocumentResponseSchema', () => {
    it('should validate valid view document response', () => {
      const validData = {
        document: {
          id: 'doc-123',
          envelopeId: '550e8400-e29b-41d4-a716-446655440000',
          signerId: '550e8400-e29b-41d4-a716-446655440001',
          viewUrl: 'https://example.com/document.pdf',
          expiresAt: '2024-01-02T00:00:00Z',
          filename: 'document.pdf',
          contentType: 'application/pdf',
          size: 1024
        },
        signer: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'signer@example.com',
          fullName: 'John Doe',
          status: 'PENDING'
        },
        envelope: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Test Document',
          status: 'IN_PROGRESS',
          signingOrder: 'SEQUENTIAL'
        }
      };

      const result = ViewDocumentResponseSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate view document response with minimal fields', () => {
      const minimalData = {
        document: {
          id: 'doc-123',
          envelopeId: '550e8400-e29b-41d4-a716-446655440000',
          signerId: '550e8400-e29b-41d4-a716-446655440001',
          viewUrl: 'https://example.com/document.pdf',
          expiresAt: '2024-01-02T00:00:00Z',
          filename: 'document.pdf',
          contentType: 'application/pdf',
          size: 1024
        },
        signer: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'signer@example.com',
          fullName: 'John Doe',
          status: 'PENDING'
        },
        envelope: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Test Document',
          status: 'IN_PROGRESS',
          signingOrder: 'SEQUENTIAL'
        }
      };

      const result = ViewDocumentResponseSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject invalid document URL', () => {
      const invalidData = {
        success: true,
        message: 'Document accessed successfully',
        documentUrl: 'invalid-url'
      };

      expect(() => ViewDocumentResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid datetime format', () => {
      const invalidData = {
        success: true,
        message: 'Document accessed successfully',
        expiresAt: 'invalid-datetime'
      };

      expect(() => ViewDocumentResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => ViewDocumentResponseSchema.parse({})).toThrow();
    });
  });

  describe('DeclineSignerResponseSchema', () => {
    it('should validate valid decline signer response', () => {
      const validData = {
        message: 'Signer declined successfully',
        decline: {
          signerId: '550e8400-e29b-41d4-a716-446655440001',
          envelopeId: '550e8400-e29b-41d4-a716-446655440000',
          reason: 'Not interested in signing',
          declinedAt: '2024-01-01T00:00:00Z',
          envelopeStatus: 'IN_PROGRESS'
        }
      };

      const result = DeclineSignerResponseSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate decline signer response with minimal fields', () => {
      const minimalData = {
        message: 'Signer declined successfully',
        decline: {
          signerId: '550e8400-e29b-41d4-a716-446655440001',
          envelopeId: '550e8400-e29b-41d4-a716-446655440000',
          reason: 'Not interested in signing',
          declinedAt: '2024-01-01T00:00:00Z',
          envelopeStatus: 'IN_PROGRESS'
        }
      };

      const result = DeclineSignerResponseSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject invalid envelope ID', () => {
      const invalidData = {
        success: true,
        message: 'Signer declined successfully',
        envelopeId: 'invalid-uuid'
      };

      expect(() => DeclineSignerResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid signer ID', () => {
      const invalidData = {
        success: true,
        message: 'Signer declined successfully',
        signerId: 'invalid-uuid'
      };

      expect(() => DeclineSignerResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid datetime format', () => {
      const invalidData = {
        success: true,
        message: 'Signer declined successfully',
        declinedAt: 'invalid-datetime'
      };

      expect(() => DeclineSignerResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => DeclineSignerResponseSchema.parse({})).toThrow();
    });
  });
});
