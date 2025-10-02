/**
 * @file fileSize.test.ts
 * @summary Tests for file size validation schema
 * @description Tests for the FileSizeSchema function covering validation scenarios
 */

import { FileSizeSchema } from '../../src/validation/fileSize.js';

describe('FileSizeSchema', () => {
  describe('default bounds', () => {
    const schema = FileSizeSchema();

    it('should validate file size within default bounds', () => {
      expect(schema.parse(1)).toBe(1);
      expect(schema.parse(1024)).toBe(1024);
      expect(schema.parse(50 * 1024 * 1024)).toBe(50 * 1024 * 1024);
    });

    it('should reject file size below minimum', () => {
      expect(() => schema.parse(0)).toThrow();
      expect(() => schema.parse(-1)).toThrow();
    });

    it('should reject file size above maximum', () => {
      expect(() => schema.parse(50 * 1024 * 1024 + 1)).toThrow();
    });

    it('should reject non-integer values', () => {
      expect(() => schema.parse(1.5)).toThrow();
      expect(schema.parse(1)).toBe(1); // 1 is valid as it's an integer
    });

    it('should reject non-number values', () => {
      expect(() => schema.parse('100')).toThrow();
      expect(() => schema.parse(null)).toThrow();
      expect(() => schema.parse(undefined)).toThrow();
    });
  });

  describe('custom bounds', () => {
    it('should validate with custom minimum and maximum', () => {
      const schema = FileSizeSchema(100, 1000);
      
      expect(schema.parse(100)).toBe(100);
      expect(schema.parse(500)).toBe(500);
      expect(schema.parse(1000)).toBe(1000);
    });

    it('should reject values below custom minimum', () => {
      const schema = FileSizeSchema(100, 1000);
      
      expect(() => schema.parse(99)).toThrow();
      expect(() => schema.parse(50)).toThrow();
    });

    it('should reject values above custom maximum', () => {
      const schema = FileSizeSchema(100, 1000);
      
      expect(() => schema.parse(1001)).toThrow();
      expect(() => schema.parse(2000)).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle zero as minimum', () => {
      const schema = FileSizeSchema(0, 100);
      
      expect(schema.parse(0)).toBe(0);
      expect(schema.parse(50)).toBe(50);
      expect(() => schema.parse(-1)).toThrow();
    });

    it('should handle very large maximum', () => {
      const schema = FileSizeSchema(1, Number.MAX_SAFE_INTEGER);
      
      expect(schema.parse(1)).toBe(1);
      expect(schema.parse(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle same minimum and maximum', () => {
      const schema = FileSizeSchema(100, 100);
      
      expect(schema.parse(100)).toBe(100);
      expect(() => schema.parse(99)).toThrow();
      expect(() => schema.parse(101)).toThrow();
    });
  });
});
