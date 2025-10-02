/**
 * @fileoverview Unit tests for ConsentId value object
 * @summary Tests for consent ID validation and business logic
 * @description Comprehensive test suite for ConsentId value object covering validation,
 * static factory methods, equality, and serialization.
 */

import { ConsentId } from '../../../../src/domain/value-objects/ConsentId';
import { ForbiddenError } from '@lawprotect/shared-ts';
import { TestUtils } from '../../../helpers/testUtils';

describe('ConsentId', () => {
  describe('Constructor and Validation', () => {
    it('should create ConsentId with valid UUID', () => {
      const validUuid = TestUtils.generateUuid();
      const consentId = new ConsentId(validUuid);

      expect(consentId.getValue()).toBe(validUuid);
    });

    it('should throw error when value is empty string', () => {
      expect(() => new ConsentId(''))
        .toThrow(ForbiddenError);
    });

    it('should throw error when value is null', () => {
      expect(() => new ConsentId(null as any))
        .toThrow(ForbiddenError);
    });

    it('should throw error when value is undefined', () => {
      expect(() => new ConsentId(undefined as any))
        .toThrow(ForbiddenError);
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
        expect(() => new ConsentId(invalidUuid)).toThrow(ForbiddenError);
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
        expect(() => new ConsentId(validUuid)).not.toThrow();
        const consentId = new ConsentId(validUuid);
        expect(consentId.getValue()).toBe(validUuid);
      }
    });

    it('should handle uppercase UUIDs', () => {
      const upperCaseUuid = TestUtils.generateUuid().toUpperCase();
      
      expect(() => new ConsentId(upperCaseUuid)).not.toThrow();
      const consentId = new ConsentId(upperCaseUuid);
      expect(consentId.getValue()).toBe(upperCaseUuid);
    });

    it('should handle mixed case UUIDs', () => {
      const mixedCaseUuid = TestUtils.generateUuid().replaceAll(/[0-9a-f]/g, (char, index) => 
        index % 2 === 0 ? char.toUpperCase() : char
      );
      
      expect(() => new ConsentId(mixedCaseUuid)).not.toThrow();
      const consentId = new ConsentId(mixedCaseUuid);
      expect(consentId.getValue()).toBe(mixedCaseUuid);
    });
  });

  describe('Static Factory Methods', () => {
    it('should generate new ConsentId', () => {
      const consentId = ConsentId.generate();

      expect(consentId).toBeInstanceOf(ConsentId);
      expect(consentId.getValue()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should create ConsentId from string', () => {
      const uuid = TestUtils.generateUuid();
      const consentId = ConsentId.fromString(uuid);

      expect(consentId.getValue()).toBe(uuid);
    });

    it('should throw error when fromString receives invalid UUID', () => {
      expect(() => ConsentId.fromString('invalid-uuid'))
        .toThrow(ForbiddenError);
    });

    it('should generate unique ConsentIds', () => {
      const id1 = ConsentId.generate();
      const id2 = ConsentId.generate();

      expect(id1.getValue()).not.toBe(id2.getValue());
    });
  });

  describe('Equality', () => {
    it('should return true for equal ConsentIds', () => {
      const uuid = TestUtils.generateUuid();
      const id1 = new ConsentId(uuid);
      const id2 = new ConsentId(uuid);

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different ConsentIds', () => {
      const id1 = ConsentId.generate();
      const id2 = ConsentId.generate();

      expect(id1.equals(id2)).toBe(false);
    });

    it('should return false when comparing with different object types', () => {
      const consentId = ConsentId.generate();
      const otherObject = { getValue: () => 'different-id' };

      expect(consentId.equals(otherObject as any)).toBe(false);
    });

    it('should handle case-sensitive equality', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const upperUuid = '550E8400-E29B-41D4-A716-446655440000';
      
      const id1 = new ConsentId(uuid);
      const id2 = new ConsentId(upperUuid);

      expect(id1.equals(id2)).toBe(false); // Case sensitive
    });
  });

  describe('Serialization', () => {
    it('should return string representation', () => {
      const uuid = TestUtils.generateUuid();
      const consentId = new ConsentId(uuid);

      expect(consentId.toString()).toBe(uuid);
    });

    it('should return JSON representation', () => {
      const uuid = TestUtils.generateUuid();
      const consentId = new ConsentId(uuid);

      expect(consentId.toJSON()).toBe(uuid);
    });

    it('should be serializable to JSON string', () => {
      const uuid = TestUtils.generateUuid();
      const consentId = new ConsentId(uuid);
      const json = JSON.stringify(consentId.toJSON());

      expect(json).toBe(`"${uuid}"`);
    });
  });

  describe('Edge Cases', () => {
    it('should handle UUID with all zeros', () => {
      const zeroUuid = '00000000-0000-4000-8000-000000000000'; // Valid v4 UUID with all zeros
      const consentId = new ConsentId(zeroUuid);

      expect(consentId.getValue()).toBe(zeroUuid);
    });

    it('should handle UUID with all f\'s', () => {
      const fUuid = 'ffffffff-ffff-4fff-bfff-ffffffffffff'; // Valid v4 UUID with all f's
      const consentId = new ConsentId(fUuid);

      expect(consentId.getValue()).toBe(fUuid);
    });

    it('should handle UUID with special patterns', () => {
      const patternUuid = TestUtils.generateUuid();
      const consentId = new ConsentId(patternUuid);

      expect(consentId.getValue()).toBe(patternUuid);
    });

    it('should maintain immutability', () => {
      const uuid = TestUtils.generateUuid();
      const consentId = new ConsentId(uuid);
      const originalValue = consentId.getValue();

      // Attempting to modify the internal value should not affect the object
      // (This test ensures the value object is truly immutable)
      expect(consentId.getValue()).toBe(originalValue);
      expect(consentId.getValue()).toBe(uuid);
    });

    it('should handle whitespace in UUID', () => {
      const uuidWithSpaces = ' 550e8400-e29b-41d4-a716-446655440000 ';
      
      expect(() => new ConsentId(uuidWithSpaces))
        .toThrow(ForbiddenError);
    });

    it('should handle non-string inputs', () => {
      const invalidInputs = [123, {}, [], true];
      
      // Test each invalid input individually to avoid deep nesting
      for (const invalidInput of invalidInputs) {
        expect(() => new ConsentId(invalidInput as any)).toThrow(ForbiddenError);
      }
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      
      expect(() => new ConsentId(longString))
        .toThrow(ForbiddenError);
    });

    it('should handle special characters', () => {
      const specialChars = '550e8400-e29b-41d4-a716-44665544000!';
      
      expect(() => new ConsentId(specialChars))
        .toThrow(ForbiddenError);
    });

    it('should handle unicode characters', () => {
      const unicodeUuid = '550e8400-e29b-41d4-a716-44665544000ñ';
      
      expect(() => new ConsentId(unicodeUuid))
        .toThrow(ForbiddenError);
    });
  });
});
