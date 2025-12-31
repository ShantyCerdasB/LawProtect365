/**
 * @fileoverview DocumentServicePort - Port interface for Document Service operations
 * @summary Defines contract for communicating with Document Service
 * @description
 * This port defines the interface for operations with Document Service.
 * It follows hexagonal architecture principles by defining the contract
 * without implementation details, allowing for easy testing and mocking.
 */

/**
 * Request to store final signed PDF in Document Service
 */
export interface StoreFinalSignedPdfRequest {
  /** Document ID in Document Service */
  documentId: string;
  /** Envelope ID */
  envelopeId: string;
  /** Final signed PDF content with embedded digital signature */
  signedPdfContent: Buffer;
  /** Signature hash from KMS */
  signatureHash: string;
  /** Timestamp when signature was created */
  signedAt: Date;
}

/**
 * Port interface for Document Service operations
 */
export interface DocumentServicePort {
  /**
   * Stores the final signed PDF in Document Service
   * @param request - Request containing signed PDF and metadata
   * @returns Promise that resolves when PDF is stored
   * @throws Error when Document Service communication fails
   */
  storeFinalSignedPdf(request: StoreFinalSignedPdfRequest): Promise<void>;
}

