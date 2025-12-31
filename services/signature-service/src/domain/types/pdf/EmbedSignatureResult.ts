/**
 * @fileoverview EmbedSignatureResult - Result of embedding digital signature
 * @summary Result interface for PDF signature embedding operations
 * @description Contains the result of successfully embedding a digital signature into a PDF document.
 * This interface follows the domain-driven design pattern by separating result types from service implementation.
 */

/**
 * Result of embedding digital signature in PDF
 * @description Contains the final signed PDF and metadata about the signature operation.
 */
export interface EmbedSignatureResult {
  /** Final PDF with embedded digital signature */
  signedPdfContent: Buffer;
  /** Name of the signature field in the PDF */
  signatureFieldName: string;
}

