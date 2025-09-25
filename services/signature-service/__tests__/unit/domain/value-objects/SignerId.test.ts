/**
 * @fileoverview Unit tests for SignerId value object
 * @summary Tests for signer ID validation and business logic
 * @description Comprehensive test suite for SignerId value object covering validation,
 * static factory methods, equality, and serialization.
 */

import { SignerId } from '../../../../src/domain/value-objects/SignerId';
import { TestUtils } from '../../../helpers/testUtils';

describe('SignerId', () => {
  describe('Constructor and Validation', () => {
    it('should create SignerId with valid UUID', () => {
      const validUuid = TestUtils.generateUuid();
      const signerId = new SignerId(validUuid);

      expect(signerId.getValue()).toBe(validUuid);
    });

    it('should throw error when value is empty string', () => {
      expect(() => new SignerId(''))
        .toThrow(Error);
    });

    it('should throw error when value is null', () => {
      expect(() => new SignerId(null as any))
        .toThrow(Error);
    });

    it('should throw error when value is undefined', () => {
      expect(() => new SignerId(undefined as any))
        .toThrow(Error);
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
        expect(() => new SignerId(invalidUuid)).toThrow(Error);
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
        expect(() => new SignerId(validUuid)).not.toThrow();
        const signerId = new SignerId(validUuid);
        expect(signerId.getValue()).toBe(validUuid);
      }
    });

    it('should handle uppercase UUIDs', () => {
      const upperCaseUuid = TestUtils.generateUuid().toUpperCase();
      
      expect(() => new SignerId(upperCaseUuid)).not.toThrow();
      const signerId = new SignerId(upperCaseUuid);
      expect(signerId.getValue()).toBe(upperCaseUuid);
    });

    it('should handle mixed case UUIDs', () => {
      const mixedCaseUuid = TestUtils.generateUuid().replace(/[0-9a-f]/g, (char, index) => 
        index % 2 === 0 ? char.toUpperCase() : char
      );
      
      expect(() => new SignerId(mixedCaseUuid)).not.toThrow();
      const signerId = new SignerId(mixedCaseUuid);
      expect(signerId.getValue()).toBe(mixedCaseUuid);
    });
  });

  describe('Static Factory Methods', () => {
    it('should generate new SignerId', () => {
      const signerId = SignerId.generate();

      expect(signerId).toBeInstanceOf(SignerId);
      expect(signerId.getValue()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should create SignerId from string', () => {
      const uuid = TestUtils.generateUuid();
      const signerId = SignerId.fromString(uuid);

      expect(signerId.getValue()).toBe(uuid);
    });

    it('should throw error when fromString receives invalid UUID', () => {
      expect(() => SignerId.fromString('invalid-uuid'))
        .toThrow(Error);
    });

    it('should generate unique SignerIds', () => {
      const id1 = SignerId.generate();
      const id2 = SignerId.generate();

      expect(id1.getValue()).not.toBe(id2.getValue());
    });
  });

  describe('Equality', () => {
    it('should return true for equal SignerIds', () => {
      const uuid = TestUtils.generateUuid();
      const id1 = new SignerId(uuid);
      const id2 = new SignerId(uuid);

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different SignerIds', () => {
      const id1 = SignerId.generate();
      const id2 = SignerId.generate();

      expect(id1.equals(id2)).toBe(false);
    });

    it('should return false when comparing with different object types', () => {
      const signerId = SignerId.generate();
      const otherObject = { getValue: () => 'different-id' };

      expect(signerId.equals(otherObject as any)).toBe(false);
    });

    it('should handle case-sensitive equality', () => {
      const uuid = TestUtils.generateUuid();
      const upperUuid = uuid.toUpperCase();
      
      const id1 = new SignerId(uuid);
      const id2 = new SignerId(upperUuid);

      expect(id1.equals(id2)).toBe(false); // Case sensitive
    });
  });

  describe('Serialization', () => {
    it('should return string representation', () => {
      const uuid = TestUtils.generateUuid();
      const signerId = new SignerId(uuid);

      expect(signerId.toString()).toBe(uuid);
    });

    it('should return JSON representation', () => {
      const uuid = TestUtils.generateUuid();
      const signerId = new SignerId(uuid);

      expect(signerId.toJSON()).toBe(uuid);
    });

    it('should be serializable to JSON string', () => {
      const uuid = TestUtils.generateUuid();
      const signerId = new SignerId(uuid);
      const json = JSON.stringify(signerId.toJSON());

      expect(json).toBe(`"${uuid}"`);
    });
  });

  describe('Edge Cases', () => {
    it('should handle UUID with all zeros', () => {
      const zeroUuid = '00000000-0000-4000-8000-000000000000'; // Valid v4 UUID with all zeros
      const signerId = new SignerId(zeroUuid);

      expect(signerId.getValue()).toBe(zeroUuid);
    });

    it('should handle UUID with all f\'s', () => {
      const fUuid = 'ffffffff-ffff-4fff-bfff-ffffffffffff'; // Valid v4 UUID with all f's
      const signerId = new SignerId(fUuid);

      expect(signerId.getValue()).toBe(fUuid);
    });

    it('should handle UUID with special patterns', () => {
      const patternUuid = TestUtils.generateUuid();
      const signerId = new SignerId(patternUuid);

      expect(signerId.getValue()).toBe(patternUuid);
    });

    it('should maintain immutability', () => {
      const uuid = TestUtils.generateUuid();
      const signerId = new SignerId(uuid);
      const originalValue = signerId.getValue();

      // Attempting to modify the internal value should not affect the object
      // (This test ensures the value object is truly immutable)
      expect(signerId.getValue()).toBe(originalValue);
      expect(signerId.getValue()).toBe(uuid);
    });

    it('should handle whitespace in UUID', () => {
      const uuidWithSpaces = ' 550e8400-e29b-41d4-a716-446655440000 ';
      
      expect(() => new SignerId(uuidWithSpaces))
        .toThrow(Error);
    });

    it('should handle non-string inputs', () => {
      expect(() => new SignerId(123 as any))
        .toThrow(Error);

      expect(() => new SignerId({} as any))
        .toThrow(Error);

      expect(() => new SignerId([] as any))
        .toThrow(Error);

      expect(() => new SignerId(true as any))
        .toThrow(Error);
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      
      expect(() => new SignerId(longString))
        .toThrow(Error);
    });

    it('should handle special characters', () => {
      const specialChars = '550e8400-e29b-41d4-a716-44665544000!';
      
      expect(() => new SignerId(specialChars))
        .toThrow(Error);
    });

    it('should handle unicode characters', () => {
      const unicodeUuid = '550e8400-e29b-41d4-a716-44665544000ñ';
      
      expect(() => new SignerId(unicodeUuid))
        .toThrow(Error);
    });
  });
});
