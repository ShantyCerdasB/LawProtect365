/**
 * @fileoverview CommonSchemas Tests - Unit tests for common schema validation
 * @summary Tests for CommonSchemas covering all shared validation scenarios
 * @description Comprehensive unit tests for CommonSchemas including signer data,
 * envelope metadata, S3 keys, content hashes, lifecycle timestamps, and audit timestamps.
 */

import {
  SignerDataSchema,
  EnvelopeMetadataSchema,
  EnvelopeTemplateFieldsSchema,
  EnvelopeS3KeysSchema,
  EnvelopeContentHashesSchema,
  EnvelopeLifecycleTimestampsSchema,
  EnvelopeAuditTimestampsSchema,
  EnvelopeCommonFieldsSchema
} from '@/domain/schemas/CommonSchemas';

describe('CommonSchemas', () => {
  describe('SignerDataSchema', () => {
    it('should validate valid signer data with all fields', () => {
      const validData = {
        email: 'signer@example.com',
        fullName: 'John Doe',
        order: 1,
        isExternal: true,
        userId: 'user-123'
      };

      const result = SignerDataSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate signer data with minimal required fields', () => {
      const minimalData = {
        email: 'signer@example.com',
        fullName: 'John Doe',
        isExternal: false
      };

      const result = SignerDataSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        fullName: 'John Doe',
        isExternal: false
      };

      expect(() => SignerDataSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty full name', () => {
      const invalidData = {
        email: 'signer@example.com',
        fullName: '',
        isExternal: false
      };

      expect(() => SignerDataSchema.parse(invalidData)).toThrow();
    });

    it('should reject full name that is too long', () => {
      const invalidData = {
        email: 'signer@example.com',
        fullName: 'a'.repeat(256),
        isExternal: false
      };

      expect(() => SignerDataSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid order number', () => {
      const invalidData = {
        email: 'signer@example.com',
        fullName: 'John Doe',
        order: 0,
        isExternal: false
      };

      expect(() => SignerDataSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => SignerDataSchema.parse({})).toThrow();
    });
  });

  describe('EnvelopeMetadataSchema', () => {
    it('should validate valid envelope metadata with all fields', () => {
      const validData = {
        title: 'Test Envelope',
        description: 'Test Description',
        expiresAt: new Date('2024-12-31'),
        customFields: { key: 'value' },
        tags: ['urgent', 'legal'],
        reminders: {
          daysBeforeExpiration: 7,
          firstReminderDays: 3,
          secondReminderDays: 1
        }
      };

      const result = EnvelopeMetadataSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate envelope metadata with minimal required fields', () => {
      const minimalData = {
        title: 'Test Envelope'
      };

      const result = EnvelopeMetadataSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject empty title', () => {
      const invalidData = {
        title: ''
      };

      expect(() => EnvelopeMetadataSchema.parse(invalidData)).toThrow();
    });

    it('should reject title that is too long', () => {
      const invalidData = {
        title: 'a'.repeat(256)
      };

      expect(() => EnvelopeMetadataSchema.parse(invalidData)).toThrow();
    });

    it('should reject description that is too long', () => {
      const invalidData = {
        title: 'Test Envelope',
        description: 'a'.repeat(1001)
      };

      expect(() => EnvelopeMetadataSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid reminder days', () => {
      const invalidData = {
        title: 'Test Envelope',
        reminders: {
          daysBeforeExpiration: 0,
          firstReminderDays: 0,
          secondReminderDays: 0
        }
      };

      expect(() => EnvelopeMetadataSchema.parse(invalidData)).toThrow();
    });

    it('should reject reminder days that are too large', () => {
      const invalidData = {
        title: 'Test Envelope',
        reminders: {
          daysBeforeExpiration: 366,
          firstReminderDays: 31,
          secondReminderDays: 31
        }
      };

      expect(() => EnvelopeMetadataSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => EnvelopeMetadataSchema.parse({})).toThrow();
    });
  });

  describe('EnvelopeTemplateFieldsSchema', () => {
    it('should validate valid template fields with all fields', () => {
      const validData = {
        templateId: 'template-123',
        templateVersion: '1.0.0'
      };

      const result = EnvelopeTemplateFieldsSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate template fields with no fields', () => {
      const emptyData = {};

      const result = EnvelopeTemplateFieldsSchema.parse(emptyData);
      expect(result).toEqual(emptyData);
    });

    it('should validate template fields with partial fields', () => {
      const partialData = {
        templateId: 'template-123'
      };

      const result = EnvelopeTemplateFieldsSchema.parse(partialData);
      expect(result).toEqual(partialData);
    });
  });

  describe('EnvelopeS3KeysSchema', () => {
    it('should validate valid S3 keys with all fields', () => {
      const validData = {
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123',
        flattenedKey: 'flattened-key-123',
        signedKey: 'signed-key-123'
      };

      const result = EnvelopeS3KeysSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate S3 keys with no fields', () => {
      const emptyData = {};

      const result = EnvelopeS3KeysSchema.parse(emptyData);
      expect(result).toEqual(emptyData);
    });

    it('should validate S3 keys with partial fields', () => {
      const partialData = {
        sourceKey: 'source-key-123'
      };

      const result = EnvelopeS3KeysSchema.parse(partialData);
      expect(result).toEqual(partialData);
    });
  });

  describe('EnvelopeContentHashesSchema', () => {
    it('should validate valid content hashes with all fields', () => {
      const validData = {
        sourceSha256: 'a'.repeat(64),
        flattenedSha256: 'b'.repeat(64),
        signedSha256: 'c'.repeat(64)
      };

      const result = EnvelopeContentHashesSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate content hashes with no fields', () => {
      const emptyData = {};

      const result = EnvelopeContentHashesSchema.parse(emptyData);
      expect(result).toEqual(emptyData);
    });

    it('should reject invalid SHA-256 hash format', () => {
      const invalidData = {
        sourceSha256: 'invalid-hash'
      };

      expect(() => EnvelopeContentHashesSchema.parse(invalidData)).toThrow();
    });

    it('should reject SHA-256 hash that is too short', () => {
      const invalidData = {
        sourceSha256: 'a'.repeat(63)
      };

      expect(() => EnvelopeContentHashesSchema.parse(invalidData)).toThrow();
    });

    it('should reject SHA-256 hash that is too long', () => {
      const invalidData = {
        sourceSha256: 'a'.repeat(65)
      };

      expect(() => EnvelopeContentHashesSchema.parse(invalidData)).toThrow();
    });

    it('should reject SHA-256 hash with invalid characters', () => {
      const invalidData = {
        sourceSha256: 'g'.repeat(64)
      };

      expect(() => EnvelopeContentHashesSchema.parse(invalidData)).toThrow();
    });
  });

  describe('EnvelopeLifecycleTimestampsSchema', () => {
    it('should validate valid lifecycle timestamps with all fields', () => {
      const validData = {
        sentAt: '2024-01-01T00:00:00Z',
        completedAt: '2024-01-02T00:00:00Z',
        cancelledAt: '2024-01-03T00:00:00Z',
        declinedAt: '2024-01-04T00:00:00Z',
        declinedBySignerId: '550e8400-e29b-41d4-a716-446655440000',
        declinedReason: 'Not interested',
        expiresAt: '2024-12-31T23:59:59Z'
      };

      const result = EnvelopeLifecycleTimestampsSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate lifecycle timestamps with no fields', () => {
      const emptyData = {};

      const result = EnvelopeLifecycleTimestampsSchema.parse(emptyData);
      expect(result).toEqual(emptyData);
    });

    it('should validate lifecycle timestamps with partial fields', () => {
      const partialData = {
        sentAt: '2024-01-01T00:00:00Z'
      };

      const result = EnvelopeLifecycleTimestampsSchema.parse(partialData);
      expect(result).toEqual(partialData);
    });

    it('should reject invalid datetime format', () => {
      const invalidData = {
        sentAt: 'invalid-datetime'
      };

      expect(() => EnvelopeLifecycleTimestampsSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid UUID format', () => {
      const invalidData = {
        declinedBySignerId: 'invalid-uuid'
      };

      expect(() => EnvelopeLifecycleTimestampsSchema.parse(invalidData)).toThrow();
    });
  });

  describe('EnvelopeAuditTimestampsSchema', () => {
    it('should validate valid audit timestamps', () => {
      const validData = {
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      const result = EnvelopeAuditTimestampsSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject missing required fields', () => {
      expect(() => EnvelopeAuditTimestampsSchema.parse({})).toThrow();
      expect(() => EnvelopeAuditTimestampsSchema.parse({ createdAt: '2024-01-01T00:00:00Z' })).toThrow();
      expect(() => EnvelopeAuditTimestampsSchema.parse({ updatedAt: '2024-01-01T00:00:00Z' })).toThrow();
    });

    it('should reject invalid datetime format', () => {
      const invalidData = {
        createdAt: 'invalid-datetime',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      expect(() => EnvelopeAuditTimestampsSchema.parse(invalidData)).toThrow();
    });
  });

  describe('EnvelopeCommonFieldsSchema', () => {
    it('should validate valid common fields with all components', () => {
      const validData = {
        templateId: 'template-123',
        templateVersion: '1.0.0',
        sourceKey: 'source-key-123',
        metaKey: 'meta-key-123',
        flattenedKey: 'flattened-key-123',
        signedKey: 'signed-key-123',
        sourceSha256: 'a'.repeat(64),
        flattenedSha256: 'b'.repeat(64),
        signedSha256: 'c'.repeat(64),
        sentAt: '2024-01-01T00:00:00Z',
        completedAt: '2024-01-02T00:00:00Z',
        cancelledAt: '2024-01-03T00:00:00Z',
        declinedAt: '2024-01-04T00:00:00Z',
        declinedBySignerId: '550e8400-e29b-41d4-a716-446655440000',
        declinedReason: 'Not interested',
        expiresAt: '2024-12-31T23:59:59Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      const result = EnvelopeCommonFieldsSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate common fields with no optional fields', () => {
      const minimalData = {
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      const result = EnvelopeCommonFieldsSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject invalid data in any component', () => {
      const invalidData = {
        sourceSha256: 'invalid-hash',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      expect(() => EnvelopeCommonFieldsSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required audit timestamps', () => {
      expect(() => EnvelopeCommonFieldsSchema.parse({})).toThrow();
    });
  });
});
