/**
 * @fileoverview PdfSignatureManipulator - Embeds pre-computed digital signatures in PDFs
 * @summary Low-level PDF signature manipulation service
 * @description
 * Service that embeds pre-computed cryptographic signatures (from KMS) into PDF documents
 * following PDF 1.7 specification. Orchestrates PKCS#7/CMS SignedData construction, PDF
 * signature dictionary creation, byte range calculation, and cross-reference table updates
 * to create valid incremental PDF updates that support multiple signatures.
 * 
 * Process:
 * 1. Validates PDF structure and inputs
 * 2. Calculates document hash (before adding signature)
 * 3. Builds PKCS#7/CMS SignedData structure
 * 4. Creates signature dictionary with correct byte ranges (iterative process)
 * 5. Embeds signature in PDF via incremental update
 * 6. Updates cross-reference table
 * 
 * Uses incremental PDF updates to preserve existing signatures and allow multiple signers.
 */

import { PDFDocument } from 'pdf-lib';
import { createHash } from 'crypto';
import type { EmbedSignatureRequest } from '@/domain/types/pdf';
import type { PdfStructure } from '@/domain/types/pdf';
import {
  pdfSignatureEmbeddingFailed,
  pdfInvalidStructure
} from '@/signature-errors';
import { SignatureErrorCodes } from '@/signature-errors/codes';
import { PdfStructureParser } from './PdfStructureParser';
import { Pkcs7Builder } from './Pkcs7Builder';
import { PdfSignatureDictionaryBuilder } from './PdfSignatureDictionaryBuilder';
import { PdfByteRangeCalculator } from './PdfByteRangeCalculator';
import { PdfXrefUpdater } from './PdfXrefUpdater';
import type { NewPdfObject } from '@/domain/types/pdf';

/**
 * @description
 * Service for embedding pre-computed digital signatures into PDF documents. Orchestrates
 * the complete process of constructing PKCS#7 SignedData, creating signature dictionaries,
 * calculating byte ranges, and embedding signatures via incremental PDF updates.
 */
export class PdfSignatureManipulator {
  private readonly structureParser: PdfStructureParser;
  private readonly pkcs7Builder: Pkcs7Builder;
  private readonly dictBuilder: PdfSignatureDictionaryBuilder;
  private readonly byteRangeCalculator: PdfByteRangeCalculator;
  private readonly xrefUpdater: PdfXrefUpdater;

  constructor() {
    this.structureParser = new PdfStructureParser();
    this.pkcs7Builder = new Pkcs7Builder();
    this.dictBuilder = new PdfSignatureDictionaryBuilder();
    this.byteRangeCalculator = new PdfByteRangeCalculator();
    this.xrefUpdater = new PdfXrefUpdater();
  }

  /**
   * @description
   * Embeds a pre-computed cryptographic signature into a PDF document. Orchestrates the
   * complete process of building PKCS#7 SignedData, creating signature dictionaries with
   * correct byte ranges, and embedding via incremental PDF updates.
   * @param {EmbedSignatureRequest} request - Signature embedding request with PDF, signature bytes, and certificates
   * @returns {Promise<Buffer>} Promise resolving to PDF with embedded signature
   * @throws {BadRequestError} when PDF validation fails or inputs are invalid
   * @throws {InternalError} when signature embedding fails
   */
  async embedSignature(request: EmbedSignatureRequest): Promise<Buffer> {
    try {
      await this.validatePdfAndInputs(request);
      const pdfStructure = this.structureParser.parseStructure(request.pdfContent);
      const documentHash = await this.calculateDocumentHash(request.pdfContent);
      const signedDataDER = await this.buildPkcs7SignedData(request, documentHash);
      const objectNumber = this.xrefUpdater.getNextObjectNumber(pdfStructure);
      const signatureDictObject = await this.buildSignatureDictionaryWithCorrectByteRanges(
        signedDataDER,
        request,
        pdfStructure,
        objectNumber
      );
      const signedPdf = this.createIncrementalPdfUpdate(
        request.pdfContent,
        pdfStructure,
        objectNumber,
        signatureDictObject
      );
      await this.validateSignedPdf(signedPdf);
      return signedPdf;
    } catch (error) {
      // Preserve specific error types
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as any).code;
        if (
          errorCode === SignatureErrorCodes.PDF_ENCRYPTED ||
          errorCode === SignatureErrorCodes.PDF_INVALID_STRUCTURE ||
          errorCode === SignatureErrorCodes.PDF_CORRUPTED ||
          errorCode === SignatureErrorCodes.PDF_ALREADY_SIGNED
        ) {
          throw error;
        }
      }

      throw pdfSignatureEmbeddingFailed(
        `Failed to embed signature: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * @description
   * Validates PDF structure and input parameters. Ensures PDF is valid, has pages,
   * and all required signature data is present.
   * @param {EmbedSignatureRequest} request - Signature embedding request
   * @throws {BadRequestError} when PDF validation fails or inputs are invalid
   */
  private async validatePdfAndInputs(request: EmbedSignatureRequest): Promise<void> {
    const pdfDoc = await PDFDocument.load(request.pdfContent, {
      ignoreEncryption: false,
      parseSpeed: 1,
    });

    if (pdfDoc.getPageCount() === 0) {
      throw pdfInvalidStructure('PDF has no pages');
    }

    if (request.certificateChain.length === 0) {
      throw pdfInvalidStructure('Certificate chain is required');
    }

    if (!request.signatureBytes || request.signatureBytes.length === 0) {
      throw pdfInvalidStructure('Signature bytes are required');
    }
  }

  /**
   * @description
   * Builds PKCS#7/CMS SignedData structure from signature bytes, certificate chain,
   * and document hash. This structure contains the cryptographic signature and
   * certificate chain for verification.
   * @param {EmbedSignatureRequest} request - Signature embedding request
   * @param {Uint8Array} documentHash - SHA-256 hash of the PDF document
   * @returns {Promise<Uint8Array>} Promise resolving to DER-encoded PKCS#7 SignedData
   */
  private async buildPkcs7SignedData(
    request: EmbedSignatureRequest,
    documentHash: Uint8Array
  ): Promise<Uint8Array> {
    return this.pkcs7Builder.buildSignedData({
      signatureBytes: request.signatureBytes,
      certificateChain: request.certificateChain,
      signerInfo: request.signerInfo,
      timestamp: request.timestamp,
      documentHash,
    });
  }

  /**
   * @description
   * Builds signature dictionary with correct byte ranges. Uses iterative process:
   * 1. Build dictionary with placeholder byte ranges
   * 2. Serialize to calculate actual size
   * 3. Calculate correct byte ranges based on actual size
   * 4. Rebuild dictionary with correct byte ranges
   * 
   * This iterative approach is necessary because byte ranges must reference the
   * exact byte positions where the signature dictionary will be embedded.
   * @param {Uint8Array} signedDataDER - DER-encoded PKCS#7 SignedData
   * @param {EmbedSignatureRequest} request - Signature embedding request
   * @param {PdfStructure} pdfStructure - Parsed PDF structure
   * @param {number} objectNumber - PDF object number for signature dictionary
   * @returns {Promise<string>} Promise resolving to serialized signature dictionary object
   */
  private async buildSignatureDictionaryWithCorrectByteRanges(
    signedDataDER: Uint8Array,
    request: EmbedSignatureRequest,
    pdfStructure: PdfStructure,
    objectNumber: number
  ): Promise<string> {
    const placeholderSize = 8192;
    const initialByteRanges = this.byteRangeCalculator.calculateByteRangesWithPlaceholder(
      request.pdfContent.length,
      pdfStructure.body.end,
      placeholderSize
    );

    const initialDict = this.dictBuilder.buildDictionary({
      signedDataDER,
      byteRanges: initialByteRanges,
      signerInfo: request.signerInfo,
      timestamp: request.timestamp,
    });

    const initialDictObject = this.dictBuilder.serializeToPdfObject(
      initialDict,
      objectNumber,
      0
    );

    const signatureDictSize = Buffer.byteLength(initialDictObject, 'latin1');
    const actualByteRanges = this.byteRangeCalculator.calculateByteRanges({
      pdfLength: request.pdfContent.length + signatureDictSize,
      signatureDictPosition: pdfStructure.body.end,
      signatureLength: signedDataDER.length * 2,
    });

    const finalDict = this.dictBuilder.buildDictionary({
      signedDataDER,
      byteRanges: actualByteRanges,
      signerInfo: request.signerInfo,
      timestamp: request.timestamp,
    });

    return this.dictBuilder.serializeToPdfObject(finalDict, objectNumber, 0);
  }

  /**
   * @description
   * Creates incremental PDF update with embedded signature dictionary. Uses PDF
   * incremental update mechanism to add signature without modifying existing content,
   * preserving previous signatures and allowing multiple signers.
   * @param {Buffer} pdfContent - Original PDF content
   * @param {PdfStructure} pdfStructure - Parsed PDF structure
   * @param {number} objectNumber - PDF object number for signature dictionary
   * @param {string} signatureDictObject - Serialized signature dictionary object
   * @returns {Buffer} PDF with embedded signature via incremental update
   */
  private createIncrementalPdfUpdate(
    pdfContent: Buffer,
    pdfStructure: PdfStructure,
    objectNumber: number,
    signatureDictObject: string
  ): Buffer {
    const newObjects: NewPdfObject[] = [
      {
        id: objectNumber,
        generation: 0,
        content: signatureDictObject,
        offset: 0,
      },
    ];

    return this.xrefUpdater.createIncrementalUpdate(
      pdfContent,
      pdfStructure,
      newObjects
    );
  }

  /**
   * @description
   * Validates that the signed PDF is still a valid PDF document. Ensures the
   * incremental update process did not corrupt the PDF structure.
   * @param {Buffer} signedPdf - PDF with embedded signature
   * @throws {InternalError} when PDF validation fails
   */
  private async validateSignedPdf(signedPdf: Buffer): Promise<void> {
    await PDFDocument.load(signedPdf);
  }

  /**
   * @description
   * Calculates SHA-256 hash of PDF document content. This hash is embedded in
   * the PKCS#7 SignedData structure and used for signature verification.
   * @param {Buffer} pdfContent - PDF content to hash
   * @returns {Promise<Uint8Array>} Promise resolving to SHA-256 hash as Uint8Array
   */
  private async calculateDocumentHash(pdfContent: Buffer): Promise<Uint8Array> {
    const hash = createHash('sha256');
    hash.update(pdfContent);
    return new Uint8Array(hash.digest());
  }
}
