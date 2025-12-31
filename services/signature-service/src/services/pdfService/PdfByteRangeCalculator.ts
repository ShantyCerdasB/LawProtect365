/**
 * @fileoverview PdfByteRangeCalculator - Calculates byte ranges for PDF signatures
 * @summary Computes byte ranges that define which parts of PDF are signed
 * @description
 * Calculates byte ranges that define which parts of a PDF are covered by the digital signature.
 * The signature itself is excluded from the signed content to allow verification.
 */

import type { ByteRange, ByteRangeParams } from '@/domain/types/pdf/ByteRange';
import { ByteRangeValidationRule } from '@/domain/rules/ByteRangeValidationRule';

/**
 * @description
 * Calculates byte ranges for PDF signatures. Byte ranges define which parts of a PDF
 * are covered by the digital signature, excluding the signature content itself.
 */
export class PdfByteRangeCalculator {
  /**
   * @description
   * Calculates byte ranges for signature embedding. The signature content is excluded
   * from the signed ranges to allow verification.
   * @param {ByteRangeParams} params - Parameters for calculation
   * @param {boolean} skipValidation - If true, skip validation (useful for iterative calculations)
   * @returns {ByteRange} Byte range array [start1, end1, start2, end2]
   */
  calculateByteRanges(params: ByteRangeParams, skipValidation: boolean = false): ByteRange {
    const { pdfLength, signatureDictPosition, signatureLength } = params;
    
    const start1 = 0;
    const end1 = signatureDictPosition;
    const contentsEnd = signatureDictPosition + signatureLength;
    const start2 = contentsEnd;
    const end2 = pdfLength;
    
    const byteRange: ByteRange = [start1, end1, start2, end2];
    
    if (!skipValidation) {
      ByteRangeValidationRule.validate(byteRange, pdfLength);
    }
    
    return byteRange;
  }

  /**
   * @description
   * Calculates byte ranges using a placeholder size when the exact signature size
   * is not yet known. Useful for two-pass signature embedding.
   * @param {number} pdfLength - Current PDF length in bytes
   * @param {number} signatureDictPosition - Position where signature dict will be inserted
   * @param {number} placeholderSize - Size of placeholder for signature
   * @returns {ByteRange} Byte range array [start1, end1, start2, end2]
   */
  calculateByteRangesWithPlaceholder(
    pdfLength: number,
    signatureDictPosition: number,
    placeholderSize: number
  ): ByteRange {
    return this.calculateByteRanges({
      pdfLength,
      signatureDictPosition,
      signatureLength: placeholderSize,
    });
  }
}





