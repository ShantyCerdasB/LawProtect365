/**
 * @fileoverview SendNotificationSchema Tests - Unit tests for send notification schema validation
 * @summary Tests for SendNotificationSchema covering all notification validation scenarios
 * @description Comprehensive unit tests for SendNotificationSchema including path parameters
 * and request validation with proper error handling.
 */

import {
  SendNotificationPathSchema,
  SendNotificationRequestSchema
} from '@/domain/schemas/SendNotificationSchema';

describe('SendNotificationSchema', () => {
  describe('SendNotificationPathSchema', () => {
    it('should validate valid envelope ID path', () => {
      const validData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = SendNotificationPathSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid envelope ID', () => {
      const invalidData = {
        envelopeId: 'invalid-uuid'
      };

      expect(() => SendNotificationPathSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing envelope ID', () => {
      expect(() => SendNotificationPathSchema.parse({})).toThrow();
    });
  });

  describe('SendNotificationRequestSchema', () => {
    it('should validate valid send notification request with all fields', () => {
      const validData = {
        type: 'reminder',
        signerIds: ['550e8400-e29b-41d4-a716-446655440001'],
        message: 'This is a reminder to sign the document'
      };

      const result = SendNotificationRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate send notification request with minimal required fields', () => {
      const minimalData = {
        type: 'reminder'
      };

      const result = SendNotificationRequestSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject invalid envelope ID', () => {
      const invalidData = {
        envelopeId: 'invalid-uuid',
        notificationType: 'REMINDER',
        message: 'This is a reminder to sign the document',
        recipients: [
          {
            email: 'signer@example.com',
            fullName: 'John Doe'
          }
        ]
      };

      expect(() => SendNotificationRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid notification type', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        notificationType: 'INVALID_TYPE',
        message: 'This is a reminder to sign the document',
        recipients: [
          {
            email: 'signer@example.com',
            fullName: 'John Doe'
          }
        ]
      };

      expect(() => SendNotificationRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty message', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        notificationType: 'REMINDER',
        message: '',
        recipients: [
          {
            email: 'signer@example.com',
            fullName: 'John Doe'
          }
        ]
      };

      expect(() => SendNotificationRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject message that is too long', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        notificationType: 'REMINDER',
        message: 'a'.repeat(1001),
        recipients: [
          {
            email: 'signer@example.com',
            fullName: 'John Doe'
          }
        ]
      };

      expect(() => SendNotificationRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject subject that is too long', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        notificationType: 'REMINDER',
        message: 'This is a reminder to sign the document',
        subject: 'a'.repeat(256),
        recipients: [
          {
            email: 'signer@example.com',
            fullName: 'John Doe'
          }
        ]
      };

      expect(() => SendNotificationRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty recipients array', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        notificationType: 'REMINDER',
        message: 'This is a reminder to sign the document',
        recipients: []
      };

      expect(() => SendNotificationRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid recipient email', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        notificationType: 'REMINDER',
        message: 'This is a reminder to sign the document',
        recipients: [
          {
            email: 'invalid-email',
            fullName: 'John Doe'
          }
        ]
      };

      expect(() => SendNotificationRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty recipient full name', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        notificationType: 'REMINDER',
        message: 'This is a reminder to sign the document',
        recipients: [
          {
            email: 'signer@example.com',
            fullName: ''
          }
        ]
      };

      expect(() => SendNotificationRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject recipient full name that is too long', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        notificationType: 'REMINDER',
        message: 'This is a reminder to sign the document',
        recipients: [
          {
            email: 'signer@example.com',
            fullName: 'a'.repeat(256)
          }
        ]
      };

      expect(() => SendNotificationRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid datetime format for scheduledFor', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        notificationType: 'REMINDER',
        message: 'This is a reminder to sign the document',
        recipients: [
          {
            email: 'signer@example.com',
            fullName: 'John Doe'
          }
        ],
        scheduledFor: 'invalid-datetime'
      };

      expect(() => SendNotificationRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid priority', () => {
      const invalidData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        notificationType: 'REMINDER',
        message: 'This is a reminder to sign the document',
        recipients: [
          {
            email: 'signer@example.com',
            fullName: 'John Doe'
          }
        ],
        priority: 'INVALID_PRIORITY'
      };

      expect(() => SendNotificationRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => SendNotificationRequestSchema.parse({})).toThrow();
    });
  });
});
