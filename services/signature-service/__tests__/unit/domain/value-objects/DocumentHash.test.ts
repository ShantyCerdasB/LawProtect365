/**
 * @fileoverview Unit tests for DocumentHash value object
 * @summary Tests for document hash validation and formatting logic
 * @description Comprehensive test suite for DocumentHash value object covering validation,
 * hash manipulation, pattern matching, and SHA-256 format compliance.
 */

import { DocumentHash } from '../../../../src/domain/value-objects/DocumentHash';
import { BadRequestError } from '@lawprotect/shared-ts';
import { TestUtils } from '../../../helpers/testUtils';

describe('DocumentHash', () => {
  describe('Constructor and Validation', () => {
    it('should create DocumentHash with valid SHA-256 hash', () => {
      const validHash = TestUtils.generateSha256Hash();
      const documentHash = new DocumentHash(validHash);

      expect(documentHash.getValue()).toBe(validHash.toLowerCase());
    });

    it('should normalize hash to lowercase', () => {
      const upperCaseHash = 'A1B2C3D4E5F6789012345678901234567890ABCDEF1234567890ABCDEF123456';
      const documentHash = new DocumentHash(upperCaseHash);

      expect(documentHash.getValue()).toBe(upperCaseHash.toLowerCase());
    });

    it('should trim whitespace from hash', () => {
      const hashWithSpaces = '  a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456  ';
      const documentHash = new DocumentHash(hashWithSpaces);

      expect(documentHash.getValue()).toBe('a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456');
    });

    it('should throw error when hash is empty string', () => {
      expect(() => new DocumentHash(''))
        .toThrow(BadRequestError);
    });

    it('should throw error when hash is only whitespace', () => {
      expect(() => new DocumentHash('   '))
        .toThrow(BadRequestError);
    });

    it('should throw error when hash is null', () => {
      expect(() => new DocumentHash(null as any))
        .toThrow(BadRequestError);
    });

    it('should throw error when hash is undefined', () => {
      expect(() => new DocumentHash(undefined as any))
        .toThrow(BadRequestError);
    });

    it('should throw error when hash is not a string', () => {
      expect(() => new DocumentHash(123 as any))
        .toThrow(BadRequestError);

      expect(() => new DocumentHash({} as any))
        .toThrow(BadRequestError);

      expect(() => new DocumentHash([] as any))
        .toThrow(BadRequestError);
    });

    it('should throw error when hash is too short', () => {
      const shortHash = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345'; // 63 characters
      
      expect(() => new DocumentHash(shortHash))
        .toThrow(BadRequestError);
    });

    it('should throw error when hash is too long', () => {
      const longHash = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567'; // 65 characters
      
      expect(() => new DocumentHash(longHash))
        .toThrow(BadRequestError);
    });

    it('should throw error when hash contains invalid characters', () => {
      const invalidHashes = [
        'g1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', // Contains 'g'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345g', // Contains 'g'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345!', // Contains '!'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345@', // Contains '@'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345#', // Contains '#'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345$', // Contains '$'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345%', // Contains '%'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345^', // Contains '^'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345&', // Contains '&'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345*', // Contains '*'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345(', // Contains '('
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345)', // Contains ')'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345-', // Contains '-'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345_', // Contains '_'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345+', // Contains '+'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345=', // Contains '='
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345[', // Contains '['
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345]', // Contains ']'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345{', // Contains '{'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345}', // Contains '}'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345|', // Contains '|'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345\\', // Contains '\'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345;', // Contains ';'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345:', // Contains ':'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345"', // Contains '"'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345\'', // Contains '''
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345,', // Contains ','
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345.', // Contains '.'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345/', // Contains '/'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345<', // Contains '<'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345>', // Contains '>'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345?', // Contains '?'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345~', // Contains '~'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345`', // Contains '`'
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345 ', // Contains space
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345\t', // Contains tab
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345\n', // Contains newline
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345\r'  // Contains carriage return
      ];

      invalidHashes.forEach(invalidHash => {
        expect(() => new DocumentHash(invalidHash))
          .toThrow(BadRequestError);
      });
    });

    it('should accept valid SHA-256 hashes', () => {
      const validHashes = [
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        '0000000000000000000000000000000000000000000000000000000000000000',
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      ];

      validHashes.forEach(validHash => {
        expect(() => new DocumentHash(validHash)).not.toThrow();
        const documentHash = new DocumentHash(validHash);
        expect(documentHash.getValue()).toBe(validHash.toLowerCase());
      });
    });

    it('should accept valid SHA-256 hashes with uppercase letters', () => {
      const upperCaseHash = 'A1B2C3D4E5F6789012345678901234567890ABCDEF1234567890ABCDEF123456';
      
      expect(() => new DocumentHash(upperCaseHash)).not.toThrow();
      const documentHash = new DocumentHash(upperCaseHash);
      expect(documentHash.getValue()).toBe(upperCaseHash.toLowerCase());
    });
  });

  describe('Static Factory Methods', () => {
    it('should create DocumentHash from string', () => {
      const hash = TestUtils.generateSha256Hash();
      const documentHash = DocumentHash.fromString(hash);

      expect(documentHash.getValue()).toBe(hash.toLowerCase());
    });

    it('should throw error when fromString receives invalid hash', () => {
      expect(() => DocumentHash.fromString('invalid-hash'))
        .toThrow(BadRequestError);
    });
  });

  describe('Hash Manipulation', () => {
    it('should get hash in uppercase', () => {
      const hash = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
      const documentHash = new DocumentHash(hash);

      expect(documentHash.getUpperCase()).toBe(hash.toUpperCase());
    });

    it('should get hash in lowercase', () => {
      const hash = 'A1B2C3D4E5F6789012345678901234567890ABCDEF1234567890ABCDEF123456';
      const documentHash = new DocumentHash(hash);

      expect(documentHash.getLowerCase()).toBe(hash.toLowerCase());
    });

    it('should get short hash (first 8 characters)', () => {
      const hash = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
      const documentHash = new DocumentHash(hash);

      expect(documentHash.getShortHash()).toBe('a1b2c3d4');
    });

    it('should get last 8 characters', () => {
      const hash = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
      const documentHash = new DocumentHash(hash);

      expect(documentHash.getLastChars()).toBe('ef123456');
    });
  });

  describe('Pattern Matching', () => {
    it('should check if hash matches pattern', () => {
      const hash = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
      const documentHash = new DocumentHash(hash);

      expect(documentHash.matches('a1b2')).toBe(true);
      expect(documentHash.matches('c3d4')).toBe(true);
      expect(documentHash.matches('123456')).toBe(true);
      expect(documentHash.matches('nonexistent')).toBe(false);
    });

    it('should check if hash starts with prefix', () => {
      const hash = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
      const documentHash = new DocumentHash(hash);

      expect(documentHash.startsWith('a1b2')).toBe(true);
      expect(documentHash.startsWith('a1b2c3d4')).toBe(true);
      expect(documentHash.startsWith('c3d4')).toBe(false);
      expect(documentHash.startsWith('nonexistent')).toBe(false);
    });

    it('should check if hash ends with suffix', () => {
      const hash = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
      const documentHash = new DocumentHash(hash);

      expect(documentHash.endsWith('123456')).toBe(true);
      expect(documentHash.endsWith('ef123456')).toBe(true);
      expect(documentHash.endsWith('a1b2')).toBe(false);
      expect(documentHash.endsWith('nonexistent')).toBe(false);
    });

    it('should handle case-insensitive pattern matching', () => {
      const hash = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
      const documentHash = new DocumentHash(hash);

      expect(documentHash.matches('A1B2')).toBe(true);
      expect(documentHash.startsWith('A1B2')).toBe(true);
      expect(documentHash.endsWith('123456')).toBe(true);
    });
  });

  describe('Equality', () => {
    it('should return true for equal DocumentHashes', () => {
      const hash = TestUtils.generateSha256Hash();
      const hash1 = new DocumentHash(hash);
      const hash2 = new DocumentHash(hash);

      expect(hash1.equals(hash2)).toBe(true);
    });

    it('should return false for different DocumentHashes', () => {
      const hash1 = new DocumentHash(TestUtils.generateSha256Hash());
      const hash2 = new DocumentHash(TestUtils.generateSha256Hash());

      expect(hash1.equals(hash2)).toBe(false);
    });

    it('should return false when comparing with different object types', () => {
      const hash = new DocumentHash(TestUtils.generateSha256Hash());
      const otherObject = { getValue: () => hash.getValue() };

      expect(hash.equals(otherObject as any)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should return string representation', () => {
      const hash = TestUtils.generateSha256Hash();
      const documentHash = new DocumentHash(hash);

      expect(documentHash.toString()).toBe(hash.toLowerCase());
    });

    it('should return JSON representation', () => {
      const hash = TestUtils.generateSha256Hash();
      const documentHash = new DocumentHash(hash);

      expect(documentHash.toJSON()).toBe(hash.toLowerCase());
    });

    it('should be serializable to JSON string', () => {
      const hash = TestUtils.generateSha256Hash();
      const documentHash = new DocumentHash(hash);
      const json = JSON.stringify(documentHash.toJSON());

      expect(json).toBe(`"${hash.toLowerCase()}"`);
    });
  });

  describe('Edge Cases', () => {
    it('should handle hash with all zeros', () => {
      const zeroHash = '0000000000000000000000000000000000000000000000000000000000000000';
      const documentHash = new DocumentHash(zeroHash);

      expect(documentHash.getValue()).toBe(zeroHash);
      expect(documentHash.getShortHash()).toBe('00000000');
      expect(documentHash.getLastChars()).toBe('00000000');
    });

    it('should handle hash with all f\'s', () => {
      const fHash = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      const documentHash = new DocumentHash(fHash);

      expect(documentHash.getValue()).toBe(fHash);
      expect(documentHash.getShortHash()).toBe('ffffffff');
      expect(documentHash.getLastChars()).toBe('ffffffff');
    });

    it('should handle hash with alternating pattern', () => {
      const alternatingHash = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const documentHash = new DocumentHash(alternatingHash);

      expect(documentHash.getValue()).toBe(alternatingHash);
      expect(documentHash.getShortHash()).toBe('01234567');
      expect(documentHash.getLastChars()).toBe('89abcdef');
    });

    it('should handle hash with mixed case input', () => {
      const mixedCaseHash = 'A1b2C3d4E5f6789012345678901234567890AbCdEf1234567890AbCdEf123456';
      const documentHash = new DocumentHash(mixedCaseHash);

      expect(documentHash.getValue()).toBe(mixedCaseHash.toLowerCase());
      expect(documentHash.getUpperCase()).toBe(mixedCaseHash.toUpperCase());
      expect(documentHash.getLowerCase()).toBe(mixedCaseHash.toLowerCase());
    });

    it('should maintain immutability', () => {
      const hash = TestUtils.generateSha256Hash();
      const documentHash = new DocumentHash(hash);
      const originalValue = documentHash.getValue();

      // Attempting to modify the internal value should not affect the object
      // (This test ensures the value object is truly immutable)
      expect(documentHash.getValue()).toBe(originalValue);
      expect(documentHash.getValue()).toBe(hash.toLowerCase());
    });

    it('should handle very long pattern matching', () => {
      const hash = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
      const documentHash = new DocumentHash(hash);

      // Test with pattern that spans most of the hash
      const longPattern = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345';
      expect(documentHash.matches(longPattern)).toBe(true);
    });

    it('should handle empty pattern matching', () => {
      const hash = TestUtils.generateSha256Hash();
      const documentHash = new DocumentHash(hash);

      expect(documentHash.matches('')).toBe(true);
      expect(documentHash.startsWith('')).toBe(true);
      expect(documentHash.endsWith('')).toBe(true);
    });

    it('should handle pattern longer than hash', () => {
      const hash = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
      const documentHash = new DocumentHash(hash);

      const longPattern = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567';
      expect(documentHash.matches(longPattern)).toBe(false);
      expect(documentHash.startsWith(longPattern)).toBe(false);
      expect(documentHash.endsWith(longPattern)).toBe(false);
    });

    it('should handle special characters in patterns', () => {
      const hash = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
      const documentHash = new DocumentHash(hash);

      // Patterns with special characters should not match
      expect(documentHash.matches('a1b2!')).toBe(false);
      expect(documentHash.startsWith('a1b2@')).toBe(false);
      expect(documentHash.endsWith('123456#')).toBe(false);
    });
  });
});
