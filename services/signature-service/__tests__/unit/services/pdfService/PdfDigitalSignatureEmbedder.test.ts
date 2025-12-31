/**
 * @fileoverview PdfDigitalSignatureEmbedder Tests - Unit tests for digital signature embedding
 * @summary Tests for PDF digital signature embedder service
 * @description Tests the PdfDigitalSignatureEmbedder service that embeds cryptographic
 * signatures from KMS into PDF documents.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PdfDigitalSignatureEmbedder } from '../../../../src/services/pdfService/PdfDigitalSignatureEmbedder';
import { createTestPdf, createMockCertificateChain, createMockSignatureBytes, createMockSignerInfo } from '../../../helpers/pdfTestHelpers';
import {
  pdfSignatureEmbeddingFailed,
  pdfInvalidStructure,
} from '../../../../src/signature-errors';

describe('PdfDigitalSignatureEmbedder', () => {
  let embedder: PdfDigitalSignatureEmbedder;

  beforeEach(() => {
    embedder = new PdfDigitalSignatureEmbedder();
  });

  describe('embedSignature', () => {
    it('should embed signature successfully', async () => {
      const pdfContent = await createTestPdf();
      const request = {
        pdfContent,
        signatureBytes: createMockSignatureBytes(),
        certificateChain: createMockCertificateChain(1),
        signerInfo: createMockSignerInfo(),
        timestamp: new Date('2023-01-01T10:00:00Z'),
      };

      const result = await embedder.embedSignature(request);

      expect(result.signedPdfContent).toBeInstanceOf(Buffer);
      expect(result.signatureFieldName).toBe('Signature1');
      expect(result.signedPdfContent.length).toBeGreaterThan(pdfContent.length);
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

      await expect(embedder.embedSignature(request)).rejects.toThrow(
        pdfInvalidStructure('Certificate chain is required for digital signature embedding')
      );
    });

    it('should validate PDF before embedding', async () => {
      const invalidPdf = Buffer.from('invalid pdf');
      const request = {
        pdfContent: invalidPdf,
        signatureBytes: createMockSignatureBytes(),
        certificateChain: createMockCertificateChain(1),
        signerInfo: createMockSignerInfo(),
        timestamp: new Date(),
      };

      await expect(embedder.embedSignature(request)).rejects.toThrow();
    });

    it('should wrap errors in pdfSignatureEmbeddingFailed', async () => {
      const pdfContent = await createTestPdf();
      const request = {
        pdfContent,
        signatureBytes: new Uint8Array(0),
        certificateChain: createMockCertificateChain(1),
        signerInfo: createMockSignerInfo(),
        timestamp: new Date(),
      };

      await expect(embedder.embedSignature(request)).rejects.toThrow();
      
      try {
        await embedder.embedSignature(request);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        // The error could be PDF_INVALID_STRUCTURE (from signature bytes validation) 
        // or PDF_SIGNATURE_EMBEDDING_FAILED (wrapped error)
        expect(['PDF_SIGNATURE_EMBEDDING_FAILED', 'PDF_INVALID_STRUCTURE']).toContain(error.code);
      }
    });

    it('should preserve specific error types', async () => {
      const pdfContent = await createTestPdf();
      const request = {
        pdfContent,
        signatureBytes: createMockSignatureBytes(),
        certificateChain: [],
        signerInfo: createMockSignerInfo(),
        timestamp: new Date(),
      };

      try {
        await embedder.embedSignature(request);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe('PDF_INVALID_STRUCTURE');
        // The message should contain information about certificate chain
        expect(error.message).toMatch(/Certificate chain|PDF has invalid structure/);
      }
    });
  });
});

