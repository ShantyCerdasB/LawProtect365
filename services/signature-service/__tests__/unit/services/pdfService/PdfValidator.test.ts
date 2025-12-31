/**
 * @fileoverview PdfValidator Tests - Unit tests for PDF validation
 * @summary Tests for PDF validation service
 * @description Tests the PdfValidator service that validates PDFs before digital signing.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PdfValidator } from '../../../../src/services/pdfService/PdfValidator';
import { createTestPdf, createTestPdfWithSignatures } from '../../../helpers/pdfTestHelpers';
import {
  pdfEncrypted,
  pdfCorrupted,
  pdfInvalidStructure,
  pdfAlreadySigned,
} from '../../../../src/signature-errors';

describe('PdfValidator', () => {
  let validator: PdfValidator;

  beforeEach(() => {
    validator = new PdfValidator();
  });

  describe('validateForSigning', () => {
    it('should validate a valid PDF successfully', async () => {
      const pdfContent = await createTestPdf();

      const result = await validator.validateForSigning(pdfContent);

      expect(result).toBe(true);
    });

    it('should throw error for PDF with no pages', async () => {
      const emptyPdf = Buffer.from('%PDF-1.7\n%%EOF');

      await expect(validator.validateForSigning(emptyPdf)).rejects.toThrow();
    });

    it('should throw error for PDF that already contains signatures', async () => {
      const signedPdf = await createTestPdfWithSignatures();

      await expect(validator.validateForSigning(signedPdf)).rejects.toThrow(
        pdfAlreadySigned('PDF already contains digital signatures')
      );
    });

    it('should throw error for encrypted PDF', async () => {
      const encryptedPdf = Buffer.from('encrypted pdf content');

      await expect(validator.validateForSigning(encryptedPdf)).rejects.toThrow();
    });

    it('should throw error for corrupted PDF', async () => {
      const corruptedPdf = Buffer.from('not a valid pdf');

      await expect(validator.validateForSigning(corruptedPdf)).rejects.toThrow();
    });

    it('should handle PDF with signature indicators correctly', async () => {
      const pdfWithIndicators = Buffer.from(
        '%PDF-1.7\n/Sig\n/ByteRange\n/Contents\n/Filter /Adobe.PPKLite\n%%EOF'
      );

      await expect(validator.validateForSigning(pdfWithIndicators)).rejects.toThrow();
    });

    it('should not throw for PDF with less than 3 signature indicators', async () => {
      const pdfWithFewIndicators = Buffer.from(
        '%PDF-1.7\n/Sig\n/ByteRange\n%%EOF'
      );

      await expect(validator.validateForSigning(pdfWithFewIndicators)).rejects.toThrow();
    });
  });
});

