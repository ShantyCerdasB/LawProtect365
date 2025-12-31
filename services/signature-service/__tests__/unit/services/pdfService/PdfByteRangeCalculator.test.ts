/**
 * @fileoverview PdfByteRangeCalculator Tests - Unit tests for byte range calculation
 * @summary Tests for PDF signature byte range calculation
 * @description Tests the PdfByteRangeCalculator service that calculates byte ranges
 * for PDF signatures, ensuring correct range calculation and validation.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PdfByteRangeCalculator } from '../../../../src/services/pdfService/PdfByteRangeCalculator';
import { ByteRangeValidationRule } from '../../../../src/domain/rules/ByteRangeValidationRule';

describe('PdfByteRangeCalculator', () => {
  let calculator: PdfByteRangeCalculator;

  beforeEach(() => {
    calculator = new PdfByteRangeCalculator();
  });

  describe('calculateByteRanges', () => {
    it('should calculate correct byte ranges for signature', () => {
      const params = {
        pdfLength: 1000,
        signatureDictPosition: 500,
        signatureLength: 100,
      };

      const result = calculator.calculateByteRanges(params);

      expect(result).toEqual([0, 500, 600, 1000]);
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(500);
      expect(result[2]).toBe(600);
      expect(result[3]).toBe(1000);
    });

    it('should calculate byte ranges when signature is at the beginning', () => {
      const params = {
        pdfLength: 1000,
        signatureDictPosition: 100,
        signatureLength: 50,
      };

      const result = calculator.calculateByteRanges(params);

      expect(result).toEqual([0, 100, 150, 1000]);
    });

    it('should calculate byte ranges when signature is at the end', () => {
      const params = {
        pdfLength: 1000,
        signatureDictPosition: 800,
        signatureLength: 100,
      };

      const result = calculator.calculateByteRanges(params);

      expect(result).toEqual([0, 800, 900, 1000]);
    });

    it('should handle large PDF files', () => {
      const params = {
        pdfLength: 1000000,
        signatureDictPosition: 500000,
        signatureLength: 8192,
      };

      const result = calculator.calculateByteRanges(params);

      expect(result).toEqual([0, 500000, 508192, 1000000]);
    });

    it('should validate byte ranges using ByteRangeValidationRule', () => {
      const validateSpy = jest.spyOn(ByteRangeValidationRule, 'validate');

      const params = {
        pdfLength: 1000,
        signatureDictPosition: 500,
        signatureLength: 100,
      };

      calculator.calculateByteRanges(params);

      expect(validateSpy).toHaveBeenCalledWith([0, 500, 600, 1000], 1000);
      validateSpy.mockRestore();
    });
  });

  describe('calculateByteRangesWithPlaceholder', () => {
    it('should calculate byte ranges with placeholder size', () => {
      const pdfLength = 20000;
      const signatureDictPosition = 10000;
      const placeholderSize = 8192;

      const result = calculator.calculateByteRangesWithPlaceholder(
        pdfLength,
        signatureDictPosition,
        placeholderSize
      );

      expect(result).toEqual([0, 10000, 18192, 20000]);
    });

    it('should use placeholder size for signature length', () => {
      const pdfLength = 10000;
      const signatureDictPosition = 2500;
      const placeholderSize = 4096;

      const result = calculator.calculateByteRangesWithPlaceholder(
        pdfLength,
        signatureDictPosition,
        placeholderSize
      );

      expect(result[0]).toBe(0);
      expect(result[1]).toBe(2500);
      expect(result[2]).toBe(6596);
      expect(result[3]).toBe(10000);
    });

    it('should handle small placeholder size', () => {
      const pdfLength = 1000;
      const signatureDictPosition = 400;
      const placeholderSize = 100;

      const result = calculator.calculateByteRangesWithPlaceholder(
        pdfLength,
        signatureDictPosition,
        placeholderSize
      );

      expect(result).toEqual([0, 400, 500, 1000]);
    });
  });
});

