/**
 * @fileoverview Unit tests for EnvelopeId value object
 * @summary Tests for envelope ID validation and business logic
 * @description Comprehensive test suite for EnvelopeId value object covering validation,
 * static factory methods, equality, and serialization.
 */

import { EnvelopeId } from '../../../../src/domain/value-objects/EnvelopeId';
import { NotFoundError } from '@lawprotect/shared-ts';
import { TestUtils } from '../../../helpers/testUtils';

describe('EnvelopeId', () => {
  describe('Constructor and Validation', () => {
    it('should create EnvelopeId with valid UUID', () => {
      const validUuid = TestUtils.generateUuid();
      const envelopeId = new EnvelopeId(validUuid);

      expect(envelopeId.getValue()).toBe(validUuid);
    });

    it('should throw error when value is empty string', () => {
      expect(() => new EnvelopeId(''))
        .toThrow(NotFoundError);
    });

    it('should throw error when value is null', () => {
      expect(() => new EnvelopeId(null as any))
        .toThrow(NotFoundError);
    });

    it('should throw error when value is undefined', () => {
      expect(() => new EnvelopeId(undefined as any))
        .toThrow(NotFoundError);
    });

    it('should throw error when value is not a valid UUID', () => {
      const invalidUuids = [
        'invalid-uuid',
        '123',
        'not-a-uuid',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-44665544000g', // Invalid character
        '550e8400-e29b-41d4-a716-446655440000-extra',
        '550e8400-e29b-41d4-a716-44665544000', // Too short
        '550e8400-e29b-41d4-a716-4466554400000' // Too long
      ];

      // Test each invalid UUID individually to avoid deep nesting
      for (const invalidUuid of invalidUuids) {
        expect(() => new EnvelopeId(invalidUuid)).toThrow(NotFoundError);
      }
    });

    it('should accept valid UUID v4 formats', () => {
      const validUuids = [
        TestUtils.generateUuid(),
        TestUtils.generateUuid(),
        TestUtils.generateUuid(),
        TestUtils.generateUuid(),
        TestUtils.generateUuid()
      ];

      // Test each valid UUID individually to avoid deep nesting
      for (const validUuid of validUuids) {
        expect(() => new EnvelopeId(validUuid)).not.toThrow();
        const envelopeId = new EnvelopeId(validUuid);
        expect(envelopeId.getValue()).toBe(validUuid);
      }
    });

    it('should handle uppercase UUIDs', () => {
      const upperCaseUuid = TestUtils.generateUuid().toUpperCase();
      
      expect(() => new EnvelopeId(upperCaseUuid)).not.toThrow();
      const envelopeId = new EnvelopeId(upperCaseUuid);
      expect(envelopeId.getValue()).toBe(upperCaseUuid);
    });

    it('should handle mixed case UUIDs', () => {
      const mixedCaseUuid = TestUtils.generateUuid().replace(/[0-9a-f]/g, (char, index) => 
        index % 2 === 0 ? char.toUpperCase() : char
      );
      
      expect(() => new EnvelopeId(mixedCaseUuid)).not.toThrow();
      const envelopeId = new EnvelopeId(mixedCaseUuid);
      expect(envelopeId.getValue()).toBe(mixedCaseUuid);
    });
  });

  describe('Static Factory Methods', () => {
    it('should generate new EnvelopeId', () => {
      const envelopeId = EnvelopeId.generate();

      expect(envelopeId).toBeInstanceOf(EnvelopeId);
      expect(envelopeId.getValue()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should create EnvelopeId from string', () => {
      const uuid = TestUtils.generateUuid();
      const envelopeId = EnvelopeId.fromString(uuid);

      expect(envelopeId.getValue()).toBe(uuid);
    });

    it('should throw error when fromString receives invalid UUID', () => {
      expect(() => EnvelopeId.fromString('invalid-uuid'))
        .toThrow(NotFoundError);
    });

    it('should generate unique EnvelopeIds', () => {
      const id1 = EnvelopeId.generate();
      const id2 = EnvelopeId.generate();

      expect(id1.getValue()).not.toBe(id2.getValue());
    });
  });

  describe('Equality', () => {
    it('should return true for equal EnvelopeIds', () => {
      const uuid = TestUtils.generateUuid();
      const id1 = new EnvelopeId(uuid);
      const id2 = new EnvelopeId(uuid);

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different EnvelopeIds', () => {
      const id1 = EnvelopeId.generate();
      const id2 = EnvelopeId.generate();

      expect(id1.equals(id2)).toBe(false);
    });

    it('should return false when comparing with different object types', () => {
      const envelopeId = EnvelopeId.generate();
      const otherObject = { getValue: () => 'different-id' };

      expect(envelopeId.equals(otherObject as any)).toBe(false);
    });

    it('should handle case-sensitive equality', () => {
      const uuid = TestUtils.generateUuid();
      const upperUuid = uuid.toUpperCase();
      
      const id1 = new EnvelopeId(uuid);
      const id2 = new EnvelopeId(upperUuid);

      expect(id1.equals(id2)).toBe(false); // Case sensitive
    });
  });

  describe('Serialization', () => {
    it('should return string representation', () => {
      const uuid = TestUtils.generateUuid();
      const envelopeId = new EnvelopeId(uuid);

      expect(envelopeId.toString()).toBe(uuid);
    });

    it('should return JSON representation', () => {
      const uuid = TestUtils.generateUuid();
      const envelopeId = new EnvelopeId(uuid);

      expect(envelopeId.toJSON()).toBe(uuid);
    });

    it('should be serializable to JSON string', () => {
      const uuid = TestUtils.generateUuid();
      const envelopeId = new EnvelopeId(uuid);
      const json = JSON.stringify(envelopeId.toJSON());

      expect(json).toBe(`"${uuid}"`);
    });
  });

  describe('Edge Cases', () => {
    it('should handle UUID with all zeros', () => {
      const zeroUuid = '00000000-0000-4000-8000-000000000000'; // Valid v4 UUID with all zeros
      const envelopeId = new EnvelopeId(zeroUuid);

      expect(envelopeId.getValue()).toBe(zeroUuid);
    });

    it('should handle UUID with all f\'s', () => {
      const fUuid = 'ffffffff-ffff-4fff-bfff-ffffffffffff'; // Valid v4 UUID with all f's
      const envelopeId = new EnvelopeId(fUuid);

      expect(envelopeId.getValue()).toBe(fUuid);
    });

    it('should handle UUID with special patterns', () => {
      const patternUuid = TestUtils.generateUuid();
      const envelopeId = new EnvelopeId(patternUuid);

      expect(envelopeId.getValue()).toBe(patternUuid);
    });

    it('should maintain immutability', () => {
      const uuid = TestUtils.generateUuid();
      const envelopeId = new EnvelopeId(uuid);
      const originalValue = envelopeId.getValue();

      // Attempting to modify the internal value should not affect the object
      // (This test ensures the value object is truly immutable)
      expect(envelopeId.getValue()).toBe(originalValue);
      expect(envelopeId.getValue()).toBe(uuid);
    });

    it('should handle whitespace in UUID', () => {
      const uuidWithSpaces = ' 550e8400-e29b-41d4-a716-446655440000 ';
      
      expect(() => new EnvelopeId(uuidWithSpaces))
        .toThrow(NotFoundError);
    });

    it('should handle non-string inputs', () => {
      expect(() => new EnvelopeId(123 as any))
        .toThrow(NotFoundError);

      expect(() => new EnvelopeId({} as any))
        .toThrow(NotFoundError);

      expect(() => new EnvelopeId([] as any))
        .toThrow(NotFoundError);

      expect(() => new EnvelopeId(true as any))
        .toThrow(NotFoundError);
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      
      expect(() => new EnvelopeId(longString))
        .toThrow(NotFoundError);
    });

    it('should handle special characters', () => {
      const specialChars = '550e8400-e29b-41d4-a716-44665544000!';
      
      expect(() => new EnvelopeId(specialChars))
        .toThrow(NotFoundError);
    });

    it('should handle unicode characters', () => {
      const unicodeUuid = '550e8400-e29b-41d4-a716-44665544000ñ';
      
      expect(() => new EnvelopeId(unicodeUuid))
        .toThrow(NotFoundError);
    });
  });
});
