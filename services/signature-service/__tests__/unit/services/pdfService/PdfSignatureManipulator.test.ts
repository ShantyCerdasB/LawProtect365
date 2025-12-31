/**
 * @fileoverview PdfSignatureManipulator Tests - Unit tests for PDF signature manipulation
 * @summary Tests for PDF signature embedding service
 * @description Tests the PdfSignatureManipulator service that embeds pre-computed
 * digital signatures into PDF documents.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PdfSignatureManipulator } from '../../../../src/services/pdfService/PdfSignatureManipulator';
import { createTestPdf, createMockCertificateChain, createMockSignatureBytes, createMockSignerInfo } from '../../../helpers/pdfTestHelpers';
import {
  pdfSignatureEmbeddingFailed,
  pdfInvalidStructure,
} from '../../../../src/signature-errors';

describe('PdfSignatureManipulator', () => {
  let manipulator: PdfSignatureManipulator;

  beforeEach(() => {
    manipulator = new PdfSignatureManipulator();
  });

  describe('embedSignature', () => {
    it('should embed signature into valid PDF', async () => {
      const pdfContent = await createTestPdf();
      const request = {
        pdfContent,
        signatureBytes: createMockSignatureBytes(),
        certificateChain: createMockCertificateChain(1),
        signerInfo: createMockSignerInfo(),
        timestamp: new Date('2023-01-01T10:00:00Z'),
      };

      const result = await manipulator.embedSignature(request);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(pdfContent.length);
    });

    it('should throw error for PDF with no pages', async () => {
      const emptyPdf = Buffer.from('%PDF-1.7\n%%EOF');
      const request = {
        pdfContent: emptyPdf,
        signatureBytes: createMockSignatureBytes(),
        certificateChain: createMockCertificateChain(1),
        signerInfo: createMockSignerInfo(),
        timestamp: new Date(),
      };

      // The PDF is invalid, so it will fail to load and be wrapped in pdfSignatureEmbeddingFailed
      await expect(manipulator.embedSignature(request)).rejects.toThrow();
      
      try {
        await manipulator.embedSignature(request);
        expect(true).toBe(false);
      } catch (error: any) {
        // PDF loading will fail, so it gets wrapped
        expect(['PDF_SIGNATURE_EMBEDDING_FAILED', 'PDF_INVALID_STRUCTURE']).toContain(error.code);
      }
    });

    it('should throw error when certificate chain is empty', async () => {
      const pdfContent = await createTestPdf();
      const request = {
        pdfContent,
        signatureBytes: createMockSignatureBytes(),
        certificateChain: [],
        signerInfo: createMockSignerInfo(),
        timestamp: new Date(),
      };

      await expect(manipulator.embedSignature(request)).rejects.toThrow(
        pdfInvalidStructure('Certificate chain is required')
      );
    });

    it('should throw error when signature bytes are empty', async () => {
      const pdfContent = await createTestPdf();
      const request = {
        pdfContent,
        signatureBytes: new Uint8Array(0),
        certificateChain: createMockCertificateChain(1),
        signerInfo: createMockSignerInfo(),
        timestamp: new Date(),
      };

      await expect(manipulator.embedSignature(request)).rejects.toThrow(
        pdfInvalidStructure('Signature bytes are required')
      );
    });

    it('should create incremental PDF update', async () => {
      const pdfContent = await createTestPdf();
      const request = {
        pdfContent,
        signatureBytes: createMockSignatureBytes(),
        certificateChain: createMockCertificateChain(1),
        signerInfo: createMockSignerInfo(),
        timestamp: new Date(),
      };

      const result = await manipulator.embedSignature(request);

      expect(result.toString('latin1')).toContain('xref');
      expect(result.toString('latin1')).toContain('trailer');
      expect(result.toString('latin1')).toContain('startxref');
    });

    it('should preserve original PDF content', async () => {
      const pdfContent = await createTestPdf();
      const originalContent = pdfContent.toString('latin1');
      const request = {
        pdfContent,
        signatureBytes: createMockSignatureBytes(),
        certificateChain: createMockCertificateChain(1),
        signerInfo: createMockSignerInfo(),
        timestamp: new Date(),
      };

      const result = await manipulator.embedSignature(request);
      const resultString = result.toString('latin1');

      expect(resultString).toContain(originalContent.substring(0, 100));
    });

    it('should wrap errors in pdfSignatureEmbeddingFailed', async () => {
      const invalidPdf = Buffer.from('invalid pdf');
      const request = {
        pdfContent: invalidPdf,
        signatureBytes: createMockSignatureBytes(),
        certificateChain: createMockCertificateChain(1),
        signerInfo: createMockSignerInfo(),
        timestamp: new Date(),
      };

      await expect(manipulator.embedSignature(request)).rejects.toThrow();
      
      try {
        await manipulator.embedSignature(request);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.code).toBe('PDF_SIGNATURE_EMBEDDING_FAILED');
      }
    });
  });
});

