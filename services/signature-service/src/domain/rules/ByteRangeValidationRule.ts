/**
 * @fileoverview ByteRangeValidationRule - Validates PDF signature byte ranges
 * @summary Domain rule for byte range validation
 * @description
 * Validates that byte ranges for PDF signatures are correctly structured.
 * Byte ranges define which parts of a PDF are covered by the digital signature.
 */

import type { ByteRange } from '../types/pdf/ByteRange';
import { pdfByteRangeInvalid } from '../../signature-errors';

/**
 * @description
 * Validates PDF signature byte ranges. Ensures byte ranges are correctly structured
 * and within PDF bounds. Byte ranges define which parts of a PDF are signed.
 */
export class ByteRangeValidationRule {
  /**
   * @description
   * Validates that a byte range array is correctly structured and within PDF bounds.
   * @param {ByteRange} byteRange - Byte range array [start1, end1, start2, end2]
   * @param {number} pdfLength - Total PDF length in bytes
   * @throws {BadRequestError} when byte range is invalid
   */
  static validate(byteRange: ByteRange, pdfLength: number): void {
    const [start1, end1, start2, end2] = byteRange;
    
    if (start1 !== 0) {
      throw pdfByteRangeInvalid('ByteRange must start at 0');
    }
    
    if (end1 <= start1) {
      throw pdfByteRangeInvalid('ByteRange: end1 must be greater than start1');
    }
    
    if (start2 <= end1) {
      throw pdfByteRangeInvalid('ByteRange: start2 must be greater than end1');
    }
    
    if (end2 <= start2) {
      throw pdfByteRangeInvalid('ByteRange: end2 must be greater than start2');
    }
    
    if (end2 > pdfLength) {
      throw pdfByteRangeInvalid(`ByteRange: end2 (${end2}) exceeds PDF length (${pdfLength})`);
    }
  }
}

