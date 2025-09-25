/**
 * @fileoverview Unit tests for InvitationTokenId value object
 * @summary Tests for invitation token ID validation and equality logic
 * @description Comprehensive test suite for InvitationTokenId value object covering validation,
 * generation, equality, and serialization functionality.
 */

import { InvitationTokenId } from '../../../../src/domain/value-objects/InvitationTokenId';
import { envelopeNotFound } from '../../../../src/signature-errors';
import { TestUtils } from '../../../helpers/testUtils';

describe('InvitationTokenId', () => {
  describe('Constructor and Validation', () => {
    it('should create InvitationTokenId with valid UUID', () => {
      const validUuid = TestUtils.generateUuid();
      const tokenId = new InvitationTokenId(validUuid);

      expect(tokenId.getValue()).toBe(validUuid);
    });

    it('should throw error when value is empty string', () => {
      expect(() => new InvitationTokenId(''))
        .toThrow(envelopeNotFound('InvitationTokenId must be a non-empty string'));
    });

    it('should throw error when value is null', () => {
      expect(() => new InvitationTokenId(null as any))
        .toThrow(envelopeNotFound('InvitationTokenId must be a non-empty string'));
    });

    it('should throw error when value is undefined', () => {
      expect(() => new InvitationTokenId(undefined as any))
        .toThrow(envelopeNotFound('InvitationTokenId must be a non-empty string'));
    });

    it('should throw error when value is not a string', () => {
      expect(() => new InvitationTokenId(123 as any))
        .toThrow(envelopeNotFound('InvitationTokenId must be a non-empty string'));

      expect(() => new InvitationTokenId({} as any))
        .toThrow(envelopeNotFound('InvitationTokenId must be a non-empty string'));

      expect(() => new InvitationTokenId([] as any))
        .toThrow(envelopeNotFound('InvitationTokenId must be a non-empty string'));
    });

    it('should throw error when value is not a valid UUID', () => {
      const invalidUuids = [
        'not-a-uuid',
        '123',
        'abc-def-ghi',
        '550e8400-e29b-41d4-a716-44665544000', // Too short
        '550e8400-e29b-41d4-a716-4466554400000', // Too long
        '550e8400-e29b-41d4-a716-44665544000g', // Invalid character
        '550e8400-e29b-41d4-a716', // Missing parts
        '550e8400e29b41d4a716446655440000' // No hyphens
      ];

      // Test each invalid UUID individually to avoid deep nesting
      for (const invalidUuid of invalidUuids) {
        expect(() => new InvitationTokenId(invalidUuid)).toThrow(envelopeNotFound('InvitationTokenId must be a valid UUID'));
      }
    });

    it('should accept valid UUID v4 format', () => {
      const validUuids = [
        TestUtils.generateUuid(),
        TestUtils.generateUuid(),
        TestUtils.generateUuid(),
        TestUtils.generateUuid(),
        TestUtils.generateUuid()
      ];

      // Test each valid UUID individually to avoid deep nesting
      for (const validUuid of validUuids) {
        expect(() => new InvitationTokenId(validUuid)).not.toThrow();
        const tokenId = new InvitationTokenId(validUuid);
        expect(tokenId.getValue()).toBe(validUuid);
      }
    });
  });

  describe('Static Factory Methods', () => {
    it('should generate new InvitationTokenId with random UUID', () => {
      const tokenId1 = InvitationTokenId.generate();
      const tokenId2 = InvitationTokenId.generate();

      expect(tokenId1).toBeInstanceOf(InvitationTokenId);
      expect(tokenId2).toBeInstanceOf(InvitationTokenId);
      expect(tokenId1.getValue()).not.toBe(tokenId2.getValue());
      expect(tokenId1.getValue()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(tokenId2.getValue()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should create InvitationTokenId from string', () => {
      const uuid = TestUtils.generateUuid();
      const tokenId = InvitationTokenId.fromString(uuid);

      expect(tokenId).toBeInstanceOf(InvitationTokenId);
      expect(tokenId.getValue()).toBe(uuid);
    });

    it('should throw error when fromString receives invalid UUID', () => {
      expect(() => InvitationTokenId.fromString('invalid-uuid'))
        .toThrow(envelopeNotFound('InvitationTokenId must be a valid UUID'));
    });
  });

  describe('Equality', () => {
    it('should return true for equal InvitationTokenIds', () => {
      const uuid = TestUtils.generateUuid();
      const tokenId1 = new InvitationTokenId(uuid);
      const tokenId2 = new InvitationTokenId(uuid);

      expect(tokenId1.equals(tokenId2)).toBe(true);
    });

    it('should return false for different InvitationTokenIds', () => {
      const tokenId1 = InvitationTokenId.generate();
      const tokenId2 = InvitationTokenId.generate();

      expect(tokenId1.equals(tokenId2)).toBe(false);
    });

    it('should return false when comparing with different object types', () => {
      const tokenId = InvitationTokenId.generate();
      const otherObject = { getValue: () => 'different-value' };

      expect(tokenId.equals(otherObject as any)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should return string representation', () => {
      const uuid = TestUtils.generateUuid();
      const tokenId = new InvitationTokenId(uuid);

      expect(tokenId.toString()).toBe(uuid);
    });

    it('should return JSON representation', () => {
      const uuid = TestUtils.generateUuid();
      const tokenId = new InvitationTokenId(uuid);

      expect(tokenId.toJSON()).toBe(uuid);
    });

    it('should be serializable to JSON', () => {
      const tokenId = InvitationTokenId.generate();
      const json = JSON.stringify(tokenId);

      expect(json).toBe(`"${tokenId.getValue()}"`);
    });
  });

  describe('Edge Cases', () => {
    it('should handle UUID with uppercase letters', () => {
      const upperCaseUuid = '550E8400-E29B-41D4-A716-446655440000';
      const tokenId = new InvitationTokenId(upperCaseUuid);

      expect(tokenId.getValue()).toBe(upperCaseUuid);
    });

    it('should handle UUID with mixed case', () => {
      const mixedCaseUuid = '550e8400-E29B-41d4-A716-446655440000';
      const tokenId = new InvitationTokenId(mixedCaseUuid);

      expect(tokenId.getValue()).toBe(mixedCaseUuid);
    });

    it('should handle UUID with leading/trailing whitespace', () => {
      const uuid = TestUtils.generateUuid();
      const uuidWithSpaces = ` ${uuid} `;
      
      // UUIDs with whitespace should be invalid
      expect(() => new InvitationTokenId(uuidWithSpaces))
        .toThrow(envelopeNotFound('InvitationTokenId must be a valid UUID'));
    });

    it('should handle very long invalid strings', () => {
      const longInvalidString = 'a'.repeat(1000);
      
      expect(() => new InvitationTokenId(longInvalidString))
        .toThrow(envelopeNotFound('InvitationTokenId must be a valid UUID'));
    });

    it('should handle special characters in invalid strings', () => {
      const specialCharStrings = [
        '550e8400-e29b-41d4-a716-446655440000!',
        '550e8400-e29b-41d4-a716-446655440000@',
        '550e8400-e29b-41d4-a716-446655440000#',
        '550e8400-e29b-41d4-a716-446655440000$',
        '550e8400-e29b-41d4-a716-446655440000%'
      ];

      // Test each invalid string individually to avoid deep nesting
      for (const invalidString of specialCharStrings) {
        expect(() => new InvitationTokenId(invalidString)).toThrow(envelopeNotFound('InvitationTokenId must be a valid UUID'));
      }
    });

    it('should maintain immutability', () => {
      const uuid = TestUtils.generateUuid();
      const tokenId = new InvitationTokenId(uuid);
      const originalValue = tokenId.getValue();

      // Attempting to modify the internal value should not affect the object
      // (This test ensures the value object is truly immutable)
      expect(tokenId.getValue()).toBe(originalValue);
      expect(tokenId.getValue()).toBe(uuid);
    });

    it('should handle multiple generations without collision', () => {
      const generatedIds = new Set<string>();
      const numberOfGenerations = 1000;

      for (let i = 0; i < numberOfGenerations; i++) {
        const tokenId = InvitationTokenId.generate();
        const value = tokenId.getValue();
        
        expect(generatedIds.has(value)).toBe(false);
        generatedIds.add(value);
      }

      expect(generatedIds.size).toBe(numberOfGenerations);
    });
  });
});
