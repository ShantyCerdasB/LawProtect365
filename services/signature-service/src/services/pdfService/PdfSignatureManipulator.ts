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
import { ByteRangeValidationRule } from '@/domain/rules/ByteRangeValidationRule';
import type { NewPdfObject, ByteRange } from '@/domain/types/pdf';

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
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as any).code;
        if (
          errorCode === SignatureErrorCodes.PDF_ENCRYPTED ||
          errorCode === SignatureErrorCodes.PDF_INVALID_STRUCTURE ||
          errorCode === SignatureErrorCodes.PDF_CORRUPTED ||
          errorCode === SignatureErrorCodes.PDF_ALREADY_SIGNED ||
          errorCode === SignatureErrorCodes.PDF_BYTE_RANGE_INVALID
        ) {
          throw error;
        }
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = error && typeof error === 'object' && 'details' in error 
        ? (error as any).details 
        : undefined;
      
      throw pdfSignatureEmbeddingFailed(
        `Failed to embed signature: ${errorMessage}${errorDetails ? ` (${String(errorDetails)})` : ''}`
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
   * Builds signature dictionary with correct byte ranges using a robust two-pass approach.
   * This is the industry-standard method for PDF signature embedding:
   * 
   * Pass 1: Estimate
   * 1. Build dictionary with placeholder byte ranges
   * 2. Measure actual dictionary size
   * 3. Build temporary PDF to measure final length
   * 
   * Pass 2: Finalize
   * 4. Calculate byte ranges with measured lengths (skip validation during calculation)
   * 5. Build final dictionary with correct byte ranges
   * 6. Build final PDF
   * 7. Validate byte ranges against actual final PDF length
   * 
   * This approach ensures byte ranges are accurate and handles the circular dependency
   * between byte range values and PDF length.
   * @param {Uint8Array} signedDataDER - DER-encoded PKCS#7 SignedData
   * @param {EmbedSignatureRequest} request - Signature embedding request
   * @param {PdfStructure} pdfStructure - Parsed PDF structure
   * @param {number} objectNumber - PDF object number for signature dictionary
   * @returns {Promise<string>} Promise resolving to serialized signature dictionary object
   * @throws {InternalError} when byte range calculation fails after multiple attempts
   */
  private async buildSignatureDictionaryWithCorrectByteRanges(
    signedDataDER: Uint8Array,
    request: EmbedSignatureRequest,
    pdfStructure: PdfStructure,
    objectNumber: number
  ): Promise<string> {
    const placeholderSize = 8192;
    const maxIterations = 3;
    let lastError: Error | null = null;
    
    const estimatedXrefOverhead = 200;
    const estimatedFinalLength = pdfStructure.body.end + placeholderSize + estimatedXrefOverhead;
    
    const initialByteRanges = this.byteRangeCalculator.calculateByteRangesWithPlaceholder(
      estimatedFinalLength,
      pdfStructure.body.end,
      placeholderSize
    );

    let currentDict = this.dictBuilder.buildDictionary({
      signedDataDER,
      byteRanges: initialByteRanges,
      signerInfo: request.signerInfo,
      timestamp: request.timestamp,
    });

    let currentDictObject = this.dictBuilder.serializeToPdfObject(
      currentDict,
      objectNumber,
      0
    );

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const currentDictSize = Buffer.byteLength(currentDictObject, 'latin1');
      
      const tempObjects: NewPdfObject[] = [
        {
          id: objectNumber,
          generation: 0,
          content: currentDictObject,
          offset: 0,
        },
      ];
      
      const tempUpdate = this.xrefUpdater.createIncrementalUpdate(
        request.pdfContent,
        pdfStructure,
        tempObjects
      );
      const measuredFinalPdfLength = tempUpdate.length;
      
      let calculatedByteRanges: ByteRange;
      try {
        calculatedByteRanges = this.byteRangeCalculator.calculateByteRanges(
          {
            pdfLength: measuredFinalPdfLength,
            signatureDictPosition: pdfStructure.body.end,
            signatureLength: currentDictSize,
          },
          true
        );
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        calculatedByteRanges = this.byteRangeCalculator.calculateByteRanges(
          {
            pdfLength: measuredFinalPdfLength + 20,
            signatureDictPosition: pdfStructure.body.end,
            signatureLength: currentDictSize,
          },
          true
        );
      }
      
      const newDict = this.dictBuilder.buildDictionary({
        signedDataDER,
        byteRanges: calculatedByteRanges,
        signerInfo: request.signerInfo,
        timestamp: request.timestamp,
      });
      
      const newDictObject = this.dictBuilder.serializeToPdfObject(newDict, objectNumber, 0);
      const newDictSize = Buffer.byteLength(newDictObject, 'latin1');
      
      if (Math.abs(newDictSize - currentDictSize) <= 2) {
        const finalObjects: NewPdfObject[] = [
          {
            id: objectNumber,
            generation: 0,
            content: newDictObject,
            offset: 0,
          },
        ];
        
        const finalTempUpdate = this.xrefUpdater.createIncrementalUpdate(
          request.pdfContent,
          pdfStructure,
          finalObjects
        );
        const actualFinalPdfLength = finalTempUpdate.length;
        
        try {
          ByteRangeValidationRule.validate(calculatedByteRanges, actualFinalPdfLength);
          return newDictObject;
        } catch (validationError: any) {
          const [start1, end1, start2] = calculatedByteRanges;
          const adjustedByteRanges: ByteRange = [start1, end1, start2, actualFinalPdfLength];
          
          ByteRangeValidationRule.validate(adjustedByteRanges, actualFinalPdfLength);
          
          const adjustedDict = this.dictBuilder.buildDictionary({
            signedDataDER,
            byteRanges: adjustedByteRanges,
            signerInfo: request.signerInfo,
            timestamp: request.timestamp,
          });
          
          return this.dictBuilder.serializeToPdfObject(adjustedDict, objectNumber, 0);
        }
      }
      
      currentDictObject = newDictObject;
      currentDict = newDict;
    }
    
    const finalSize = Buffer.byteLength(currentDictObject, 'latin1');
    throw pdfSignatureEmbeddingFailed(
      `Failed to calculate stable byte ranges after ${maxIterations} iterations. ` +
      `Dictionary size: ${finalSize} bytes. ` +
      `Original error: ${lastError?.message || 'Unknown error'}`
    );
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
