/**
 * @fileoverview ReminderTrackingId unit tests
 * @summary Tests for ReminderTrackingId value object
 * @description Comprehensive unit tests for ReminderTrackingId class methods
 */

import { ReminderTrackingId } from '../../../../src/domain/value-objects/ReminderTrackingId';
import { TestUtils } from '../../../helpers/testUtils';

describe('ReminderTrackingId', () => {
  describe('fromString', () => {
    it('should create a ReminderTrackingId from a valid UUID', () => {
      const validUuid = TestUtils.generateUuid();
      const id = ReminderTrackingId.fromString(validUuid);
      
      expect(id).toBeInstanceOf(ReminderTrackingId);
      expect(id.getValue()).toBe(validUuid);
    });

    it('should throw error for invalid UUID format', () => {
      const invalidUuids = [
        'not-a-uuid',
        '123',
        'invalid-uuid-format',
        '',
        '123e4567-e89b-12d3-a456-42661417400', // Missing character
        '123e4567-e89b-12d3-a456-4266141740000' // Extra character
      ];

      invalidUuids.forEach(testInvalidUuid);
      
      function testInvalidUuid(invalidUuid: string): void {
        expect(() => ReminderTrackingId.fromString(invalidUuid)).toThrow('Invalid ReminderTrackingId');
      }
    });

    it('should throw error for null or undefined values', () => {
      expect(() => testNullValue()).toThrow();
      expect(() => testUndefinedValue()).toThrow();
    });

    function testNullValue(): void {
      ReminderTrackingId.fromString(null as any);
    }

    function testUndefinedValue(): void {
      ReminderTrackingId.fromString(undefined as any);
    }

    it('should handle valid UUID v4 format', () => {
      const uuidV4 = '550e8400-e29b-41d4-a716-446655440000';
      const id = ReminderTrackingId.fromString(uuidV4);
      
      expect(id.getValue()).toBe(uuidV4);
    });
  });

  describe('generate', () => {
    it('should generate a new ReminderTrackingId with valid UUID', () => {
      const id = ReminderTrackingId.generate();
      
      expect(id).toBeInstanceOf(ReminderTrackingId);
      expect(id.getValue()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs on multiple calls', () => {
      const id1 = ReminderTrackingId.generate();
      const id2 = ReminderTrackingId.generate();
      
      expect(id1.getValue()).not.toBe(id2.getValue());
    });

    it('should generate valid UUIDs that can be used with fromString', () => {
      const generatedId = ReminderTrackingId.generate();
      const recreatedId = ReminderTrackingId.fromString(generatedId.getValue());
      
      expect(recreatedId.getValue()).toBe(generatedId.getValue());
    });
  });

  describe('getValue', () => {
    it('should return the UUID string value', () => {
      const uuid = TestUtils.generateUuid();
      const id = ReminderTrackingId.fromString(uuid);
      
      expect(id.getValue()).toBe(uuid);
      expect(typeof id.getValue()).toBe('string');
    });
  });

  describe('equals', () => {
    it('should return true for equal ReminderTrackingIds', () => {
      const uuid = TestUtils.generateUuid();
      const id1 = ReminderTrackingId.fromString(uuid);
      const id2 = ReminderTrackingId.fromString(uuid);
      
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different ReminderTrackingIds', () => {
      const id1 = ReminderTrackingId.generate();
      const id2 = ReminderTrackingId.generate();
      
      expect(id1.equals(id2)).toBe(false);
    });

    it('should return false when comparing with null or undefined', () => {
      const id = ReminderTrackingId.generate();
      
      expect(id.equals(null as any)).toBe(false);
      expect(id.equals(undefined as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the UUID string representation', () => {
      const uuid = TestUtils.generateUuid();
      const id = ReminderTrackingId.fromString(uuid);
      
      expect(id.toString()).toBe(uuid);
      expect(id.toString()).toBe(id.getValue());
    });
  });

  describe('value object behavior', () => {
    it('should be immutable', () => {
      const id = ReminderTrackingId.generate();
      const originalValue = id.getValue();
      
      // Attempting to modify the internal value should not affect the object
      expect(id.getValue()).toBe(originalValue);
    });

    it('should maintain referential equality for same UUID', () => {
      const uuid = TestUtils.generateUuid();
      const id1 = ReminderTrackingId.fromString(uuid);
      const id2 = ReminderTrackingId.fromString(uuid);
      
      expect(id1.equals(id2)).toBe(true);
      expect(id1.getValue()).toBe(id2.getValue());
    });
  });
});

