/**
 * @fileoverview DocumentServiceClient - HTTP client for Document Service
 * @summary Handles HTTP communication with Document Service
 * @description
 * This client handles all HTTP communication with Document Service.
 * It implements the DocumentServicePort interface and provides
 * concrete HTTP implementation for Document Service operations.
 */

import type { DocumentServicePort, StoreFinalSignedPdfRequest } from '../../app/ports/documents/DocumentServicePort';
import { BadRequestError, ErrorCodes, type HttpClientConfig } from '@lawprotect/shared-ts';
import { documentServiceError, SignatureErrorCodes } from '@/signature-errors';

/**
 * HTTP client for Document Service communication
 */
export class DocumentServiceClient implements DocumentServicePort {
  constructor(
    private readonly config: HttpClientConfig
  ) {
    if (!config.baseUrl) {
      throw new BadRequestError(
        'Document Service base URL is required',
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }
  }

  /**
   * Stores the final signed PDF in Document Service
   * @param request - Request containing signed PDF and metadata
   * @returns Promise that resolves when PDF is stored
   * @throws documentServiceError when HTTP request fails
   */
  async storeFinalSignedPdf(request: StoreFinalSignedPdfRequest): Promise<void> {
    const url = `${this.config.baseUrl}/documents/${request.documentId}/finalize-signed`;
    
    try {
      const body = JSON.stringify({
        signedPdfBase64: request.signedPdfContent.toString('base64'),
        signatureHash: request.signatureHash,
        signedAt: request.signedAt.toISOString(),
        envelopeId: request.envelopeId,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);

      const response = await fetch(url, {
        method: 'POST',
        body,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw documentServiceError({
          status: response.status,
          statusText: response.statusText,
          errorText,
          url,
          documentId: request.documentId,
        });
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw documentServiceError({
          type: 'timeout',
          timeout: this.config.timeout || 30000,
          url,
          documentId: request.documentId,
        });
      }
      
      if (error && typeof error === 'object' && 'code' in error && error.code === SignatureErrorCodes.DOCUMENT_SERVICE_ERROR) {
        throw error;
      }
      
      throw documentServiceError({
        type: 'network_error',
        originalError: error instanceof Error ? error.message : String(error),
        url,
        documentId: request.documentId,
      });
    }
  }
}
