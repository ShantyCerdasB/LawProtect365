/**
 * @fileoverview PdfDigitalSignatureEmbedder - Embeds digital signatures in PDF documents
 * @summary Service for embedding cryptographic signatures from KMS into PDFs
 * @description
 * Embeds pre-computed digital signatures from KMS into PDF documents using PKCS#7/CMS structures.
 * Validates PDF structure and embeds signature bytes and certificate chain.
 */

import type { EmbedSignatureRequest, EmbedSignatureResult } from '@/domain/types/pdf';
import { PdfValidator } from './PdfValidator';
import { PdfSignatureManipulator } from './PdfSignatureManipulator';
import {
  pdfSignatureEmbeddingFailed,
  pdfInvalidStructure
} from '@/signature-errors';
import { SignatureErrorCodes } from '@/signature-errors/codes';

/**
 * @description
 * Embeds cryptographic signatures from KMS into PDF documents. Validates PDF structure
 * and embeds signature bytes and certificate chain.
 */
export class PdfDigitalSignatureEmbedder {
  private readonly pdfValidator: PdfValidator;
  private readonly signatureManipulator: PdfSignatureManipulator;

  constructor() {
    this.pdfValidator = new PdfValidator();
    this.signatureManipulator = new PdfSignatureManipulator();
  }

  /**
   * @description
   * Embeds a digital signature into a PDF document. Validates the PDF can be signed
   * and embeds the cryptographic signature from KMS with certificate chain.
   * @param {EmbedSignatureRequest} request - Signature embedding request with PDF, signature bytes, and metadata
   * @returns {Promise<EmbedSignatureResult>} Promise with embedded PDF and signature metadata
   * @throws {BadRequestError} when PDF validation fails or certificate chain is missing
   * @throws {InternalError} when signature embedding fails
   */
  async embedSignature(request: EmbedSignatureRequest): Promise<EmbedSignatureResult> {
    try {
      await this.pdfValidator.validateForSigning(request.pdfContent);

      if (request.certificateChain.length === 0) {
        throw pdfInvalidStructure('Certificate chain is required for digital signature embedding');
      }

      const signedPdf = await this.signatureManipulator.embedSignature(request);

      return {
        signedPdfContent: signedPdf,
        signatureFieldName: 'Signature1',
      };

    } catch (error) {
      // Preserve specific error types
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as any).code;
        if (
          errorCode === SignatureErrorCodes.PDF_ENCRYPTED ||
          errorCode === SignatureErrorCodes.PDF_ALREADY_SIGNED ||
          errorCode === SignatureErrorCodes.PDF_CORRUPTED ||
          errorCode === SignatureErrorCodes.PDF_INVALID_STRUCTURE ||
          errorCode === SignatureErrorCodes.PDF_SIGNATURE_EMBEDDING_FAILED
        ) {
          throw error;
        }
      }

      throw pdfSignatureEmbeddingFailed(
        `Failed to embed digital signature in PDF: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
