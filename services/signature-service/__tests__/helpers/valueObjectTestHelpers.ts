/**
 * @fileoverview Value Object Test Helpers - Reusable test utilities for value objects
 * @summary Common test patterns and utilities for value object testing
 * @description This file provides reusable helper functions and test patterns
 * for testing value objects, including validation, equality, and serialization tests.
 */

import { TestUtils } from './testUtils';

/**
 * Common invalid UUID patterns for testing value object validation
 */
export const INVALID_UUID_PATTERNS = [
  'invalid-uuid',
  '123',
  'not-a-uuid',
  '550e8400-e29b-41d4-a716',
  '550e8400-e29b-41d4-a716-44665544000g', // Invalid character
  '550e8400-e29b-41d4-a716-446655440000-extra',
  '550e8400-e29b-41d4-a716-44665544000', // Too short
  '550e8400-e29b-41d4-a716-4466554400000' // Too long
] as const;

/**
 * Common invalid string patterns for testing value object validation
 */
export const INVALID_STRING_PATTERNS = [
  '',
  '   ',
  null,
  undefined,
  123,
  {},
  []
] as const;

/**
 * Test patterns for value object validation
 */
export class ValueObjectTestPatterns {
  /**
   * Tests basic constructor validation for value objects that require non-empty strings
   * @param ValueObjectClass - The value object class to test
   * @param validValue - A valid value for the constructor
   * @param expectedError - The expected error class
   */
  static testBasicStringValidation<T>(
    ValueObjectClass: new (value: string) => T,
    validValue: string,
    expectedError: new (...args: any[]) => Error
  ): void {
    describe('basic string validation', () => {
      it('should create instance with valid value', () => {
        const instance = new ValueObjectClass(validValue);
        expect(instance).toBeDefined();
      });

      it('should throw error for empty string', () => {
        expect(() => new ValueObjectClass('')).toThrow(expectedError);
      });

      it('should throw error for null', () => {
        expect(() => new ValueObjectClass(null as any)).toThrow(expectedError);
      });

      it('should throw error for undefined', () => {
        expect(() => new ValueObjectClass(undefined as any)).toThrow(expectedError);
      });
    });
  }

  /**
   * Tests UUID validation for value objects that require valid UUIDs
   * @param ValueObjectClass - The value object class to test
   * @param validUuid - A valid UUID for the constructor
   * @param expectedError - The expected error class
   */
  static testUuidValidation<T>(
    ValueObjectClass: new (value: string) => T,
    validUuid: string,
    expectedError: new (...args: any[]) => Error
  ): void {
    describe('UUID validation', () => {
      it('should create instance with valid UUID', () => {
        const instance = new ValueObjectClass(validUuid);
        expect(instance).toBeDefined();
      });

      it('should throw error for invalid UUID patterns', () => {
        INVALID_UUID_PATTERNS.forEach(testInvalidUuid);
      });

      function testInvalidUuid(invalidUuid: string): void {
        expect(() => new ValueObjectClass(invalidUuid)).toThrow(expectedError);
      }
    });
  }

  /**
   * Tests equality behavior for value objects
   * @param ValueObjectClass - The value object class to test
   * @param createInstance - Function to create an instance
   */
  static testEquality<T>(
    ValueObjectClass: new (...args: any[]) => T,
    createInstance: (value: string) => T
  ): void {
    describe('equality', () => {
      it('should return true for equal instances', () => {
        const value = TestUtils.generateUuid();
        const instance1 = createInstance(value);
        const instance2 = createInstance(value);
        
        expect((instance1 as any).equals(instance2)).toBe(true);
      });

      it('should return false for different instances', () => {
        const instance1 = createInstance(TestUtils.generateUuid());
        const instance2 = createInstance(TestUtils.generateUuid());
        
        expect((instance1 as any).equals(instance2)).toBe(false);
      });

      it('should return false when comparing with null or undefined', () => {
        const instance = createInstance(TestUtils.generateUuid());
        
        expect((instance as any).equals(null)).toBe(false);
        expect((instance as any).equals(undefined)).toBe(false);
      });
    });
  }

  /**
   * Tests serialization methods (toString, toJSON) for value objects
   * @param ValueObjectClass - The value object class to test
   * @param createInstance - Function to create an instance
   * @param expectedValue - The expected serialized value
   */
  static testSerialization<T>(
    ValueObjectClass: new (...args: any[]) => T,
    createInstance: (value: string) => T,
    expectedValue: string
  ): void {
    describe('serialization', () => {
      it('should return correct string representation', () => {
        const instance = createInstance(expectedValue);
        
        expect((instance as any).toString()).toBe(expectedValue);
      });

      it('should return correct JSON representation', () => {
        const instance = createInstance(expectedValue);
        
        expect((instance as any).toJSON()).toBe(expectedValue);
      });

      it('should have consistent toString and toJSON', () => {
        const instance = createInstance(expectedValue);
        
        expect((instance as any).toString()).toBe((instance as any).toJSON());
      });
    });
  }

  /**
   * Tests static factory methods for value objects
   * @param ValueObjectClass - The value object class to test
   * @param factoryMethod - The static factory method to test
   * @param expectedValue - The expected value from the factory method
   */
  static testStaticFactory<T>(
    ValueObjectClass: any,
    factoryMethod: string,
    expectedValue: string
  ): void {
    describe(`static ${factoryMethod}`, () => {
      it('should create instance with correct value', () => {
        const instance = ValueObjectClass[factoryMethod]();
        
        expect(instance).toBeInstanceOf(ValueObjectClass);
        expect((instance as any).getValue()).toBe(expectedValue);
      });

      it('should create unique instances on multiple calls', () => {
        const instance1 = ValueObjectClass[factoryMethod]();
        const instance2 = ValueObjectClass[factoryMethod]();
        
        if (factoryMethod === 'generate') {
          expect((instance1 as any).getValue()).not.toBe((instance2 as any).getValue());
        } else {
          expect((instance1 as any).getValue()).toBe((instance2 as any).getValue());
        }
      });
    });
  }

  /**
   * Tests fromStringOrUndefined method for value objects
   * @param ValueObjectClass - The value object class to test
   * @param validValue - A valid value for the method
   */
  static testFromStringOrUndefined<T>(
    ValueObjectClass: any,
    validValue: string
  ): void {
    describe('fromStringOrUndefined', () => {
      it('should return undefined for null', () => {
        const result = ValueObjectClass.fromStringOrUndefined(null);
        expect(result).toBeUndefined();
      });

      it('should return undefined for undefined', () => {
        const result = ValueObjectClass.fromStringOrUndefined(undefined);
        expect(result).toBeUndefined();
      });

      it('should create instance for valid value', () => {
        const result = ValueObjectClass.fromStringOrUndefined(validValue);
        
        expect(result).toBeInstanceOf(ValueObjectClass);
        expect((result as any).getValue()).toBe(validValue);
      });
    });
  }

  /**
   * Tests immutability for value objects
   * @param createInstance - Function to create an instance
   */
  static testImmutability<T>(createInstance: () => T): void {
    describe('immutability', () => {
      it('should be immutable', () => {
        const instance = createInstance();
        const originalValue = (instance as any).getValue();
        
        // Attempting to modify the internal value should not affect the object
        expect((instance as any).getValue()).toBe(originalValue);
      });
    });
  }
}

/**
 * Common test data for value object testing
 */
export const VALUE_OBJECT_TEST_DATA = {
  VALID_UUID: '550e8400-e29b-41d4-a716-446655440000',
  VALID_EMAIL: 'test@example.com',
  VALID_HASH: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
  VALID_S3_KEY: 'documents/envelope-123/document.pdf'
} as const;
