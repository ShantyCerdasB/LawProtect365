/**
 * @fileoverview PdfValidator - Validates PDF documents for digital signing
 * @summary PDF validation service using pdf-lib
 * @description
 * Validates PDF documents to ensure they can accept digital signatures.
 * Checks for encryption, existing signatures, and valid structure.
 */

import { PDFDocument } from 'pdf-lib';
import {
  pdfEncrypted,
  pdfCorrupted,
  pdfInvalidStructure,
  pdfAlreadySigned
} from '@/signature-errors';

/**
 * @description
 * Validates PDF documents before digital signing. Ensures PDFs are not encrypted,
 * do not contain existing signatures, and have valid structure with at least one page.
 */
export class PdfValidator {
  /**
   * @description
   * Validates that a PDF can accept a digital signature. Checks for encryption,
   * existing signatures, and valid structure.
   * @param {Buffer} pdfContent - PDF content to validate
   * @returns {Promise<boolean>} Promise resolving to true if PDF is valid for signing
   * @throws {BadRequestError} when PDF is encrypted, corrupted, or invalid
   * @throws {ConflictError} when PDF already contains signatures
   */
  async validateForSigning(pdfContent: Buffer): Promise<boolean> {
    try {
      const pdfDoc = await PDFDocument.load(pdfContent, {
        ignoreEncryption: false,
        parseSpeed: 1,
      });

      this.validatePageCount(pdfDoc);

      const hasExistingSignatures = await this.checkForExistingSignatures(pdfContent);
      if (hasExistingSignatures) {
        throw pdfAlreadySigned('PDF already contains digital signatures');
      }

      return true;
    } catch (error: any) {
      if (error?.message?.includes('encrypted') || error?.message?.includes('password')) {
        throw pdfEncrypted('PDF is encrypted and cannot be signed');
      }

      if (error?.code === 'PDF_ENCRYPTED' || error?.code === 'PDF_ALREADY_SIGNED') {
        throw error;
      }

      throw pdfCorrupted(
        `PDF validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * @description
   * Checks if PDF already contains digital signatures by searching for signature-related
   * keywords in the PDF structure. Uses heuristic detection requiring multiple indicators.
   * @param {Buffer} pdfContent - PDF content to check
   * @returns {Promise<boolean>} Promise resolving to true if signatures exist
   */
  private async checkForExistingSignatures(pdfContent: Buffer): Promise<boolean> {
    try {
      const pdfString = pdfContent.toString('latin1');
      
      const signatureIndicators = [
        '/Sig',
        '/ByteRange',
        '/Contents',
        '/Filter /Adobe.PPKLite',
      ];

      let indicatorCount = 0;
      for (const indicator of signatureIndicators) {
        if (pdfString.includes(indicator)) {
          indicatorCount++;
        }
      }

      return indicatorCount >= 3;
    } catch {
      return false;
    }
  }

  /**
   * @description
   * Validates that PDF has at least one page.
   * @param {PDFDocument} pdfDoc - PDF document to validate
   * @throws {BadRequestError} when PDF has no pages
   */
  private validatePageCount(pdfDoc: PDFDocument): void {
    const pageCount = pdfDoc.getPageCount();
    if (pageCount === 0) {
      throw pdfInvalidStructure('PDF has no pages');
    }
  }
}




