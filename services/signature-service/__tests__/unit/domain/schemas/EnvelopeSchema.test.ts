/**
 * @fileoverview EnvelopeSchema Tests - Unit tests for envelope schema validation
 * @summary Tests for EnvelopeSchema covering all envelope validation scenarios
 * @description Comprehensive unit tests for EnvelopeSchema including envelope creation,
 * updates, status transitions, and query validation with proper error handling.
 */

import {
  CreateEnvelopeWithSignersSchema,
  CreateEnvelopeSchema,
  UpdateEnvelopeSchema,
  EnvelopeIdSchema,
  EnvelopeStatusSchema,
  EnvelopeQuerySchema
} from '@/domain/schemas/EnvelopeSchema';
import { SigningOrderType, DocumentOriginType, EnvelopeSortBy, SortOrder } from '@lawprotect/shared-ts';
import { EnvelopeStatus } from '@/domain/value-objects/EnvelopeStatus';

describe('EnvelopeSchema', () => {
  describe('CreateEnvelopeWithSignersSchema', () => {
    it('should validate valid envelope creation with signers', () => {
      const validData = {
        title: 'Test Envelope',
        description: 'Test Description',
        signingOrderType: SigningOrderType.OWNER_FIRST,
        originType: DocumentOriginType.USER_UPLOAD,
        expiresAt: new Date('2024-12-31'),
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123',
        signers: [
          {
            email: 'signer1@example.com',
            fullName: 'Signer One',
            order: 1,
            isExternal: true
          }
        ]
      };

      const result = CreateEnvelopeWithSignersSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate envelope creation with minimal required fields', () => {
      const minimalData = {
        title: 'Test Envelope',
        signingOrderType: SigningOrderType.OWNER_FIRST,
        originType: DocumentOriginType.USER_UPLOAD,
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123'
      };

      const result = CreateEnvelopeWithSignersSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        signingOrderType: SigningOrderType.OWNER_FIRST,
        originType: DocumentOriginType.USER_UPLOAD,
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123'
      };

      expect(() => CreateEnvelopeWithSignersSchema.parse(invalidData)).toThrow();
    });

    it('should reject title that is too long', () => {
      const invalidData = {
        title: 'a'.repeat(256),
        signingOrderType: SigningOrderType.OWNER_FIRST,
        originType: DocumentOriginType.USER_UPLOAD,
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123'
      };

      expect(() => CreateEnvelopeWithSignersSchema.parse(invalidData)).toThrow();
    });

    it('should reject description that is too long', () => {
      const invalidData = {
        title: 'Test Envelope',
        description: 'a'.repeat(1001),
        signingOrderType: SigningOrderType.OWNER_FIRST,
        originType: DocumentOriginType.USER_UPLOAD,
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123'
      };

      expect(() => CreateEnvelopeWithSignersSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid signing order type', () => {
      const invalidData = {
        title: 'Test Envelope',
        signingOrderType: 'INVALID_TYPE',
        originType: DocumentOriginType.USER_UPLOAD,
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123'
      };

      expect(() => CreateEnvelopeWithSignersSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid origin type', () => {
      const invalidData = {
        title: 'Test Envelope',
        signingOrderType: SigningOrderType.OWNER_FIRST,
        originType: 'INVALID_TYPE',
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123'
      };

      expect(() => CreateEnvelopeWithSignersSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty source key', () => {
      const invalidData = {
        title: 'Test Envelope',
        signingOrderType: SigningOrderType.OWNER_FIRST,
        originType: DocumentOriginType.USER_UPLOAD,
        sourceKey: '',
        metaKey: 'meta-key-123'
      };

      expect(() => CreateEnvelopeWithSignersSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty meta key', () => {
      const invalidData = {
        title: 'Test Envelope',
        signingOrderType: SigningOrderType.OWNER_FIRST,
        originType: DocumentOriginType.USER_UPLOAD,
        sourceKey: 'source-key-123',
        metaKey: ''
      };

      expect(() => CreateEnvelopeWithSignersSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid signer data', () => {
      const invalidData = {
        title: 'Test Envelope',
        signingOrderType: SigningOrderType.OWNER_FIRST,
        originType: DocumentOriginType.USER_UPLOAD,
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123',
        signers: [
          {
            email: 'invalid-email',
            fullName: 'Signer One',
            order: 1,
            isExternal: true
          }
        ]
      };

      expect(() => CreateEnvelopeWithSignersSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => CreateEnvelopeWithSignersSchema.parse({})).toThrow();
    });
  });

  describe('CreateEnvelopeSchema', () => {
    it('should validate valid envelope creation', () => {
      const validData = {
        title: 'Test Envelope',
        description: 'Test Description',
        signingOrderType: SigningOrderType.OWNER_FIRST,
        originType: DocumentOriginType.USER_UPLOAD,
        expiresAt: new Date('2024-12-31'),
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123'
      };

      const result = CreateEnvelopeSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should apply default signing order type', () => {
      const data = {
        title: 'Test Envelope',
        originType: DocumentOriginType.USER_UPLOAD,
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123'
      };

      const result = CreateEnvelopeSchema.parse(data);
      expect(result.signingOrderType).toBeUndefined();
    });

    it('should validate template origin with required fields', () => {
      const validData = {
        title: 'Test Envelope',
        originType: DocumentOriginType.TEMPLATE,
        templateId: 'template-123',
        templateVersion: '1.0.0',
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123'
      };

      const result = CreateEnvelopeSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject template origin without required fields', () => {
      const invalidData = {
        title: 'Test Envelope',
        originType: DocumentOriginType.TEMPLATE,
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123'
      };

      expect(() => CreateEnvelopeSchema.parse(invalidData)).toThrow();
    });

    it('should reject template origin with missing templateId', () => {
      const invalidData = {
        title: 'Test Envelope',
        originType: DocumentOriginType.TEMPLATE,
        templateVersion: '1.0.0',
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123'
      };

      expect(() => CreateEnvelopeSchema.parse(invalidData)).toThrow();
    });

    it('should reject template origin with missing templateVersion', () => {
      const invalidData = {
        title: 'Test Envelope',
        originType: DocumentOriginType.TEMPLATE,
        templateId: 'template-123',
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123'
      };

      expect(() => CreateEnvelopeSchema.parse(invalidData)).toThrow();
    });
  });

  describe('UpdateEnvelopeSchema', () => {
    it('should validate valid envelope update', () => {
      const validData = {
        title: 'Updated Envelope',
        description: 'Updated Description',
        expiresAt: '2024-12-31T00:00:00Z',
        signingOrderType: SigningOrderType.INVITEES_FIRST,
        sourceKey: 'updated-source-key',
        metaKey: 'updated-meta-key'
      };

      const result = UpdateEnvelopeSchema.parse(validData);
      expect(result.title).toBe(validData.title);
      expect(result.description).toBe(validData.description);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.signingOrderType).toBe(validData.signingOrderType);
      expect(result.sourceKey).toBe(validData.sourceKey);
      expect(result.metaKey).toBe(validData.metaKey);
    });

    it('should validate envelope update with minimal fields', () => {
      const minimalData = {
        title: 'Updated Envelope'
      };

      const result = UpdateEnvelopeSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject empty title', () => {
      const invalidData = {
        title: ''
      };

      expect(() => UpdateEnvelopeSchema.parse(invalidData)).toThrow();
    });

    it('should reject title that is too long', () => {
      const invalidData = {
        title: 'a'.repeat(256)
      };

      expect(() => UpdateEnvelopeSchema.parse(invalidData)).toThrow();
    });

    it('should reject description that is too long', () => {
      const invalidData = {
        description: 'a'.repeat(1001)
      };

      expect(() => UpdateEnvelopeSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid signing order type', () => {
      const invalidData = {
        signingOrderType: 'INVALID_TYPE'
      };

      expect(() => UpdateEnvelopeSchema.parse(invalidData)).toThrow();
    });

    it('should accept empty source key in update', () => {
      const validData = {
        sourceKey: ''
      };

      const result = UpdateEnvelopeSchema.parse(validData);
      expect(result.sourceKey).toBe('');
    });

    it('should accept empty meta key in update', () => {
      const validData = {
        metaKey: ''
      };

      const result = UpdateEnvelopeSchema.parse(validData);
      expect(result.metaKey).toBe('');
    });
  });

  describe('EnvelopeIdSchema', () => {
    it('should validate valid envelope ID', () => {
      const validData = {
        id: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = EnvelopeIdSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid envelope ID', () => {
      const invalidData = {
        envelopeId: 'invalid-uuid'
      };

      expect(() => EnvelopeIdSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing envelope ID', () => {
      expect(() => EnvelopeIdSchema.parse({})).toThrow();
    });
  });

  describe('EnvelopeStatusSchema', () => {
    it('should validate valid envelope status', () => {
      expect(EnvelopeStatusSchema.parse('DRAFT')).toStrictEqual(EnvelopeStatus.draft());
      expect(EnvelopeStatusSchema.parse('READY_FOR_SIGNATURE')).toStrictEqual(EnvelopeStatus.readyForSignature());
      expect(EnvelopeStatusSchema.parse('COMPLETED')).toStrictEqual(EnvelopeStatus.completed());
      expect(EnvelopeStatusSchema.parse('CANCELLED')).toStrictEqual(EnvelopeStatus.cancelled());
      expect(EnvelopeStatusSchema.parse('DECLINED')).toStrictEqual(EnvelopeStatus.declined());
      expect(EnvelopeStatusSchema.parse('EXPIRED')).toStrictEqual(EnvelopeStatus.expired());
    });

    it('should reject invalid envelope status', () => {
      expect(() => EnvelopeStatusSchema.parse('INVALID_STATUS')).toThrow();
      expect(() => EnvelopeStatusSchema.parse('')).toThrow();
      expect(() => EnvelopeStatusSchema.parse(null)).toThrow();
      expect(() => EnvelopeStatusSchema.parse(undefined)).toThrow();
    });
  });

  describe('EnvelopeQuerySchema', () => {
    it('should validate valid envelope query with all fields', () => {
      const validData = {
        createdBy: 'user-123',
        status: 'DRAFT',
        limit: 50,
        offset: 10,
        sortBy: EnvelopeSortBy.CREATED_AT,
        sortOrder: 'DESC'
      };

      const result = EnvelopeQuerySchema.parse(validData);
      expect(result.createdBy).toBe(validData.createdBy);
      expect(result.status).toStrictEqual(EnvelopeStatus.draft());
      expect(result.limit).toBe(validData.limit);
      expect(result.offset).toBe(validData.offset);
      expect(result.sortBy).toBe(validData.sortBy);
      expect(result.sortOrder).toBe(validData.sortOrder);
    });

    it('should validate envelope query with minimal fields', () => {
      const minimalData = {};

      const result = EnvelopeQuerySchema.parse(minimalData);
      expect(result.limit).toBe(20); // Default value
      expect(result.offset).toBe(0); // Default value
      expect(result.sortBy).toBe(EnvelopeSortBy.CREATED_AT); // Default value
      expect(result.sortOrder).toBe(SortOrder.DESC); // Default value
    });

    it('should apply default values', () => {
      const data = {
        createdBy: 'user-123'
      };

      const result = EnvelopeQuerySchema.parse(data);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
      expect(result.sortBy).toBe(EnvelopeSortBy.CREATED_AT);
      expect(result.sortOrder).toBe(SortOrder.DESC);
    });

    it('should reject limit that is too small', () => {
      const invalidData = {
        limit: 0
      };

      expect(() => EnvelopeQuerySchema.parse(invalidData)).toThrow();
    });

    it('should reject limit that is too large', () => {
      const invalidData = {
        limit: 101
      };

      expect(() => EnvelopeQuerySchema.parse(invalidData)).toThrow();
    });

    it('should reject offset that is negative', () => {
      const invalidData = {
        offset: -1
      };

      expect(() => EnvelopeQuerySchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid sort by value', () => {
      const invalidData = {
        sortBy: 'INVALID_SORT'
      };

      expect(() => EnvelopeQuerySchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid sort order value', () => {
      const invalidData = {
        sortOrder: 'INVALID_ORDER'
      };

      expect(() => EnvelopeQuerySchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid envelope status', () => {
      const invalidData = {
        status: 'INVALID_STATUS'
      };

      expect(() => EnvelopeQuerySchema.parse(invalidData)).toThrow();
    });
  });
});
