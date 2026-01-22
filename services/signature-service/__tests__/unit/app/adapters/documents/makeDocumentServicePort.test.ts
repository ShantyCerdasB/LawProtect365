/**
 * @fileoverview makeDocumentServicePort Tests - Unit tests for DocumentServicePort factory
 * @summary Tests for the factory function that creates DocumentServicePort instances
 * @description Comprehensive unit tests for makeDocumentServicePort factory function
 * that verifies proper creation of DocumentServicePort with correct configuration.
 */

import { makeDocumentServicePort } from '../../../../../src/app/adapters/documents/makeDocumentServicePort';
import { DocumentServiceClient } from '../../../../../src/infrastructure/clients/DocumentServiceClient';

jest.mock('../../../../../src/infrastructure/clients/DocumentServiceClient');

describe('makeDocumentServicePort', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create DocumentServicePort with provided URL and default timeout', () => {
    const documentServiceUrl = 'https://api.example.com';
    const mockClient = jest.fn();
    (DocumentServiceClient as jest.MockedClass<typeof DocumentServiceClient>).mockImplementation(() => mockClient as any);

    const result = makeDocumentServicePort({ documentServiceUrl });

    expect(DocumentServiceClient).toHaveBeenCalledWith({
      baseUrl: documentServiceUrl,
      timeout: 30000,
    });
    expect(result).toBe(mockClient);
  });

  it('should create DocumentServicePort with provided URL and custom timeout', () => {
    const documentServiceUrl = 'https://api.example.com';
    const documentServiceTimeout = 60000;
    const mockClient = jest.fn();
    (DocumentServiceClient as jest.MockedClass<typeof DocumentServiceClient>).mockImplementation(() => mockClient as any);

    const result = makeDocumentServicePort({ documentServiceUrl, documentServiceTimeout });

    expect(DocumentServiceClient).toHaveBeenCalledWith({
      baseUrl: documentServiceUrl,
      timeout: documentServiceTimeout,
    });
    expect(result).toBe(mockClient);
  });

  it('should create DocumentServicePort instance', () => {
    const documentServiceUrl = 'https://api.example.com';
    const mockClient = jest.fn();
    (DocumentServiceClient as jest.MockedClass<typeof DocumentServiceClient>).mockImplementation(() => mockClient as any);

    const result = makeDocumentServicePort({ documentServiceUrl });

    expect(result).toBeDefined();
    expect(result).toBe(mockClient);
  });
});



