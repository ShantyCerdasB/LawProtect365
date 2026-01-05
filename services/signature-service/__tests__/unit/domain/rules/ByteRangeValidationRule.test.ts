/**
 * @fileoverview ByteRangeValidationRule Tests - Unit tests for byte range validation
 * @summary Tests for PDF signature byte range validation rule
 * @description Comprehensive unit tests for ByteRangeValidationRule that verifies
 * proper validation of PDF signature byte ranges.
 */

import { ByteRangeValidationRule } from '../../../../src/domain/rules/ByteRangeValidationRule';

describe('ByteRangeValidationRule', () => {
  describe('validate', () => {
    it('should validate correct byte range', () => {
      const byteRange: [number, number, number, number] = [0, 100, 200, 1000];
      const pdfLength = 1000;

      expect(() => {
        ByteRangeValidationRule.validate(byteRange, pdfLength);
      }).not.toThrow();
    });

    it('should throw when start1 is not 0', () => {
      const byteRange: [number, number, number, number] = [10, 100, 200, 1000];
      const pdfLength = 1000;

      expect(() => {
        ByteRangeValidationRule.validate(byteRange, pdfLength);
      }).toThrow();

      try {
        ByteRangeValidationRule.validate(byteRange, pdfLength);
      } catch (error: any) {
        expect(error.code).toBeDefined();
      }
    });

    it('should throw when end1 is less than or equal to start1', () => {
      const byteRange: [number, number, number, number] = [0, 0, 200, 1000];
      const pdfLength = 1000;

      expect(() => {
        ByteRangeValidationRule.validate(byteRange, pdfLength);
      }).toThrow();

      try {
        ByteRangeValidationRule.validate(byteRange, pdfLength);
      } catch (error: any) {
        expect(error.code).toBeDefined();
      }
    });

    it('should throw when start2 is less than or equal to end1', () => {
      const byteRange: [number, number, number, number] = [0, 100, 100, 1000];
      const pdfLength = 1000;

      expect(() => {
        ByteRangeValidationRule.validate(byteRange, pdfLength);
      }).toThrow();

      try {
        ByteRangeValidationRule.validate(byteRange, pdfLength);
      } catch (error: any) {
        expect(error.code).toBeDefined();
      }
    });

    it('should throw when end2 is less than or equal to start2', () => {
      const byteRange: [number, number, number, number] = [0, 100, 200, 200];
      const pdfLength = 1000;

      expect(() => {
        ByteRangeValidationRule.validate(byteRange, pdfLength);
      }).toThrow();

      try {
        ByteRangeValidationRule.validate(byteRange, pdfLength);
      } catch (error: any) {
        expect(error.code).toBeDefined();
      }
    });

    it('should throw when end2 exceeds PDF length by more than tolerance', () => {
      const byteRange: [number, number, number, number] = [0, 100, 200, 1011];
      const pdfLength = 1000;

      expect(() => {
        ByteRangeValidationRule.validate(byteRange, pdfLength);
      }).toThrow();

      try {
        ByteRangeValidationRule.validate(byteRange, pdfLength);
      } catch (error: any) {
        expect(error.code).toBeDefined();
      }
    });

    it('should allow end2 to be within tolerance (10 bytes)', () => {
      const byteRange: [number, number, number, number] = [0, 100, 200, 1010];
      const pdfLength = 1000;

      expect(() => {
        ByteRangeValidationRule.validate(byteRange, pdfLength);
      }).not.toThrow();
    });

    it('should allow end2 to equal PDF length', () => {
      const byteRange: [number, number, number, number] = [0, 100, 200, 1000];
      const pdfLength = 1000;

      expect(() => {
        ByteRangeValidationRule.validate(byteRange, pdfLength);
      }).not.toThrow();
    });
  });
});

