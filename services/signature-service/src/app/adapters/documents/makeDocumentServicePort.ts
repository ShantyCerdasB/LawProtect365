/**
 * @fileoverview makeDocumentServicePort - Factory for DocumentServicePort
 * @summary Creates DocumentServicePort implementation
 * @description
 * Factory function that creates a DocumentServicePort implementation
 * using DocumentServiceClient. This follows the adapter pattern and
 * allows for dependency injection.
 */

import { DocumentServicePort } from '../../ports/documents/DocumentServicePort';
import { DocumentServiceClient } from '../../../infrastructure/clients/DocumentServiceClient';
import type { HttpClientConfig } from '@lawprotect/shared-ts';

/**
 * Dependencies for creating DocumentServicePort
 */
export interface DocumentServicePortDependencies {
  /** Base URL of Document Service API */
  documentServiceUrl: string;
  /** Request timeout in milliseconds */
  documentServiceTimeout?: number;
}

/**
 * Creates a DocumentServicePort implementation
 * @param deps - Dependencies including service URL and timeout
 * @returns Configured DocumentServicePort instance
 */
export const makeDocumentServicePort = (deps: DocumentServicePortDependencies): DocumentServicePort => {
  const config: HttpClientConfig = {
    baseUrl: deps.documentServiceUrl,
    timeout: deps.documentServiceTimeout || 30000
  };

  return new DocumentServiceClient(config);
};

