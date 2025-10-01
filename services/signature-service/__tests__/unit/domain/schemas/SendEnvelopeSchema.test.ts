/**
 * @fileoverview SendEnvelopeSchema Tests - Unit tests for send envelope schema validation
 * @summary Tests for SendEnvelopeSchema covering all send envelope validation scenarios
 * @description Comprehensive unit tests for SendEnvelopeSchema including path parameters,
 * body validation, and response formatting with proper error handling.
 */

import {
  SendEnvelopePathSchema,
  SendEnvelopeBodySchema,
  SendEnvelopeRequestSchema,
  SendEnvelopeResponseSchema
} from '@/domain/schemas/SendEnvelopeSchema';

describe('SendEnvelopeSchema', () => {
  describe('SendEnvelopePathSchema', () => {
    it('should validate valid envelope ID path', () => {
      const validData = {
        envelopeId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = SendEnvelopePathSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid envelope ID', () => {
      const invalidData = {
        envelopeId: 'invalid-uuid'
      };

      expect(() => SendEnvelopePathSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing envelope ID', () => {
      expect(() => SendEnvelopePathSchema.parse({})).toThrow();
    });
  });

  describe('SendEnvelopeBodySchema', () => {
    it('should validate valid send envelope body with all fields', () => {
      const validData = {
        message: 'Please review and sign this document',
        sendToAll: true
      };

      const result = SendEnvelopeBodySchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate send envelope body with minimal required fields', () => {
      const minimalData = {
        sendToAll: true
      };

      const result = SendEnvelopeBodySchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should validate send envelope body with signers array', () => {
      const validData = {
        message: 'Please review and sign this document',
        signers: [
          {
            signerId: '550e8400-e29b-41d4-a716-446655440000',
            message: 'Custom message for signer'
          }
        ]
      };

      const result = SendEnvelopeBodySchema.parse(validData);
      expect(result.message).toBe(validData.message);
      expect(result.signers).toEqual(validData.signers);
      expect(result.sendToAll).toBe(false); // Default value applied
    });

    it('should validate send envelope body with both sendToAll and signers', () => {
      const validData = {
        message: 'Please review and sign this document',
        sendToAll: true,
        signers: [
          {
            signerId: '550e8400-e29b-41d4-a716-446655440000',
            message: 'Custom message for signer'
          }
        ]
      };

      const result = SendEnvelopeBodySchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject send envelope body with neither sendToAll nor signers', () => {
      const invalidData = {
        message: 'Please review and sign this document'
      };

      expect(() => SendEnvelopeBodySchema.parse(invalidData)).toThrow('Either sendToAll must be true or signers array must be provided');
    });

    it('should reject send envelope body with empty signers array', () => {
      const invalidData = {
        message: 'Please review and sign this document',
        signers: []
      };

      expect(() => SendEnvelopeBodySchema.parse(invalidData)).toThrow('Either sendToAll must be true or signers array must be provided');
    });

    it('should reject send envelope body with sendToAll false and no signers', () => {
      const invalidData = {
        message: 'Please review and sign this document',
        sendToAll: false
      };

      expect(() => SendEnvelopeBodySchema.parse(invalidData)).toThrow('Either sendToAll must be true or signers array must be provided');
    });

    it('should apply default values', () => {
      const data = {
        sendToAll: true
      };

      const result = SendEnvelopeBodySchema.parse(data);
      expect(result.sendToAll).toBe(true);
    });

    it('should reject empty message', () => {
      const invalidData = {
        message: ''
      };

      expect(() => SendEnvelopeBodySchema.parse(invalidData)).toThrow();
    });

    it('should reject message that is too long', () => {
      const invalidData = {
        message: 'a'.repeat(1001)
      };

      expect(() => SendEnvelopeBodySchema.parse(invalidData)).toThrow();
    });

    it('should reject subject that is too long', () => {
      const invalidData = {
        message: 'Please review and sign this document',
        subject: 'a'.repeat(256)
      };

      expect(() => SendEnvelopeBodySchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid boolean values', () => {
      const invalidData = {
        message: 'Please review and sign this document',
        sendReminders: 'not-a-boolean'
      };

      expect(() => SendEnvelopeBodySchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid reminder days array', () => {
      const invalidData = {
        message: 'Please review and sign this document',
        reminderDays: 'not-an-array'
      };

      expect(() => SendEnvelopeBodySchema.parse(invalidData)).toThrow();
    });

    it('should reject reminder days that are not numbers', () => {
      const invalidData = {
        message: 'Please review and sign this document',
        reminderDays: ['not-a-number']
      };

      expect(() => SendEnvelopeBodySchema.parse(invalidData)).toThrow();
    });

    it('should reject reminder days that are negative', () => {
      const invalidData = {
        message: 'Please review and sign this document',
        reminderDays: [-1, 3, 7]
      };

      expect(() => SendEnvelopeBodySchema.parse(invalidData)).toThrow();
    });

    it('should reject reminder days that are too large', () => {
      const invalidData = {
        message: 'Please review and sign this document',
        reminderDays: [3, 7, 366]
      };

      expect(() => SendEnvelopeBodySchema.parse(invalidData)).toThrow();
    });

    it('should reject expires in days that is not a number', () => {
      const invalidData = {
        message: 'Please review and sign this document',
        expiresInDays: 'not-a-number'
      };

      expect(() => SendEnvelopeBodySchema.parse(invalidData)).toThrow();
    });

    it('should reject expires in days that is negative', () => {
      const invalidData = {
        message: 'Please review and sign this document',
        expiresInDays: -1
      };

      expect(() => SendEnvelopeBodySchema.parse(invalidData)).toThrow();
    });

    it('should reject expires in days that is too large', () => {
      const invalidData = {
        message: 'Please review and sign this document',
        expiresInDays: 366
      };

      expect(() => SendEnvelopeBodySchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => SendEnvelopeBodySchema.parse({})).toThrow();
    });
  });

  describe('SendEnvelopeRequestSchema', () => {
    it('should validate valid send envelope request', () => {
      const validData = {
        path: {
          envelopeId: '550e8400-e29b-41d4-a716-446655440000'
        },
        body: {
          message: 'Please review and sign this document',
          sendToAll: true
        }
      };

      const result = SendEnvelopeRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate send envelope request with minimal fields', () => {
      const minimalData = {
        path: {
          envelopeId: '550e8400-e29b-41d4-a716-446655440000'
        },
        body: {
          sendToAll: true
        }
      };

      const result = SendEnvelopeRequestSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject invalid envelope ID', () => {
      const invalidData = {
        envelopeId: 'invalid-uuid',
        message: 'Please review and sign this document'
      };

      expect(() => SendEnvelopeRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => SendEnvelopeRequestSchema.parse({})).toThrow();
    });
  });

  describe('SendEnvelopeResponseSchema', () => {
    it('should validate valid send envelope response with all fields', () => {
      const validData = {
        success: true,
        message: 'Envelope sent successfully',
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'SENT',
        tokensGenerated: 3,
        signersNotified: 3
      };

      const result = SendEnvelopeResponseSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate send envelope response with minimal fields', () => {
      const minimalData = {
        success: true,
        message: 'Envelope sent successfully',
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'SENT',
        tokensGenerated: 0,
        signersNotified: 0
      };

      const result = SendEnvelopeResponseSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject invalid envelope ID', () => {
      const invalidData = {
        success: true,
        message: 'Envelope sent successfully',
        envelopeId: 'invalid-uuid'
      };

      expect(() => SendEnvelopeResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid datetime format', () => {
      const invalidData = {
        success: true,
        message: 'Envelope sent successfully',
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        sentAt: 'invalid-datetime'
      };

      expect(() => SendEnvelopeResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid recipient email', () => {
      const invalidData = {
        success: true,
        message: 'Envelope sent successfully',
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        recipients: [
          {
            email: 'invalid-email',
            fullName: 'John Doe',
            status: 'PENDING'
          }
        ]
      };

      expect(() => SendEnvelopeResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid recipient status', () => {
      const invalidData = {
        success: true,
        message: 'Envelope sent successfully',
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        recipients: [
          {
            email: 'signer@example.com',
            fullName: 'John Doe',
            status: 'INVALID_STATUS'
          }
        ]
      };

      expect(() => SendEnvelopeResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid reminder schedule', () => {
      const invalidData = {
        success: true,
        message: 'Envelope sent successfully',
        envelopeId: '550e8400-e29b-41d4-a716-446655440000',
        reminderSchedule: {
          enabled: 'not-a-boolean',
          days: [3, 7, 14]
        }
      };

      expect(() => SendEnvelopeResponseSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => SendEnvelopeResponseSchema.parse({})).toThrow();
    });
  });
});
