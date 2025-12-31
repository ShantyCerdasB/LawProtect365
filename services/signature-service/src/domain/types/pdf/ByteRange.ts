/**
 * @fileoverview ByteRange - Types for PDF signature byte ranges
 * @summary Type definitions for PDF signature byte range calculations
 * @description
 * Byte ranges define which parts of a PDF are covered by the digital signature.
 * The signature itself is excluded from the signed content to allow verification.
 */

/**
 * Byte range array: [start1, end1, start2, end2]
 * @description
 * Format: [start1, end1, start2, end2]
 * - [0, end1]: Content before signature (signed)
 * - [end1, start2]: Signature content (excluded)
 * - [start2, end2]: Content after signature (signed)
 */
export type ByteRange = [number, number, number, number];

/**
 * Parameters for calculating byte ranges
 */
export interface ByteRangeParams {
  /** Total length of PDF in bytes */
  pdfLength: number;
  /** Position where signature dictionary will be inserted */
  signatureDictPosition: number;
  /** Length of signature content in bytes */
  signatureLength: number;
}

