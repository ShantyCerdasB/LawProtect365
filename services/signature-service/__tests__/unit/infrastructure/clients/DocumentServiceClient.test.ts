/**
 * @fileoverview DocumentServiceClient Tests - Unit tests for Document Service HTTP client
 * @summary Tests for HTTP client that communicates with Document Service
 * @description Comprehensive unit tests for DocumentServiceClient class that verifies
 * proper HTTP communication, error handling, timeout management, and request formatting.
 */

import { DocumentServiceClient } from '../../../../src/infrastructure/clients/DocumentServiceClient';
import { BadRequestError, ErrorCodes } from '@lawprotect/shared-ts';
import { documentServiceError, SignatureErrorCodes } from '@/signature-errors';
import type { StoreFinalSignedPdfRequest } from '../../../../src/app/ports/documents/DocumentServicePort';

global.fetch = jest.fn();
global.AbortController = jest.fn().mockImplementation(() => ({
  abort: jest.fn(),
  signal: {},
}));

describe('DocumentServiceClient', () => {
  const mockBaseUrl = 'https://api.example.com';
  const mockConfig = {
    baseUrl: mockBaseUrl,
    timeout: 30000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create client with valid baseUrl', () => {
      const client = new DocumentServiceClient(mockConfig);
      expect(client).toBeDefined();
    });

    it('should throw BadRequestError when baseUrl is missing', () => {
      expect(() => {
        new DocumentServiceClient({ baseUrl: '', timeout: 30000 });
      }).toThrow(BadRequestError);
    });

    it('should throw BadRequestError with correct error code when baseUrl is missing', () => {
      try {
        new DocumentServiceClient({ baseUrl: '', timeout: 30000 });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
        if (error instanceof BadRequestError) {
          expect(error.message).toBe('Document Service base URL is required');
          expect(error.code).toBe(ErrorCodes.COMMON_BAD_REQUEST);
        }
      }
    });
  });

  describe('storeFinalSignedPdf', () => {
    const mockRequest: StoreFinalSignedPdfRequest = {
      documentId: 'doc-123',
      envelopeId: 'env-456',
      signedPdfContent: Buffer.from('test pdf content'),
      signatureHash: 'hash-789',
      signedAt: new Date('2024-01-01T00:00:00Z'),
    };

    it('should successfully store signed PDF', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const client = new DocumentServiceClient(mockConfig);
      await client.storeFinalSignedPdf(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/documents/${mockRequest.documentId}/finalize-signed`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('signedPdfBase64'),
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should include correct request body with base64 PDF', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const client = new DocumentServiceClient(mockConfig);
      await client.storeFinalSignedPdf(mockRequest);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.signedPdfBase64).toBe(mockRequest.signedPdfContent.toString('base64'));
      expect(body.signatureHash).toBe(mockRequest.signatureHash);
      expect(body.signedAt).toBe(mockRequest.signedAt.toISOString());
      expect(body.envelopeId).toBe(mockRequest.envelopeId);
    });

    it('should use custom timeout when provided', async () => {
      const customTimeout = 60000;
      const customConfig = { ...mockConfig, timeout: customTimeout };
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const client = new DocumentServiceClient(customConfig);
      await client.storeFinalSignedPdf(mockRequest);

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should use default timeout when not provided', async () => {
      const configWithoutTimeout = { baseUrl: mockBaseUrl };
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const client = new DocumentServiceClient(configWithoutTimeout);
      await client.storeFinalSignedPdf(mockRequest);

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should throw documentServiceError when HTTP response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('Server error'),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const client = new DocumentServiceClient(mockConfig);

      await expect(client.storeFinalSignedPdf(mockRequest)).rejects.toThrow();

      try {
        await client.storeFinalSignedPdf(mockRequest);
      } catch (error: any) {
        expect(error.code).toBe(SignatureErrorCodes.DOCUMENT_SERVICE_ERROR);
      }
    });

    it('should include error details when HTTP response fails', async () => {
      const errorText = 'Detailed error message';
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: jest.fn().mockResolvedValue(errorText),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const client = new DocumentServiceClient(mockConfig);

      try {
        await client.storeFinalSignedPdf(mockRequest);
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.code).toBe(SignatureErrorCodes.DOCUMENT_SERVICE_ERROR);
      }
    });

    it('should handle timeout error', async () => {
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      (global.fetch as jest.Mock).mockRejectedValue(abortError);

      const client = new DocumentServiceClient(mockConfig);

      await expect(client.storeFinalSignedPdf(mockRequest)).rejects.toThrow();

      try {
        await client.storeFinalSignedPdf(mockRequest);
      } catch (error: any) {
        expect(error.code).toBe(SignatureErrorCodes.DOCUMENT_SERVICE_ERROR);
      }
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network failure');
      (global.fetch as jest.Mock).mockRejectedValue(networkError);

      const client = new DocumentServiceClient(mockConfig);

      await expect(client.storeFinalSignedPdf(mockRequest)).rejects.toThrow();

      try {
        await client.storeFinalSignedPdf(mockRequest);
      } catch (error: any) {
        expect(error.code).toBe(SignatureErrorCodes.DOCUMENT_SERVICE_ERROR);
      }
    });

    it('should re-throw documentServiceError when already thrown', async () => {
      const existingError = documentServiceError({
        type: 'network_error',
        originalError: 'Test error',
        url: 'test-url',
        documentId: 'test-id',
      });
      (global.fetch as jest.Mock).mockRejectedValue(existingError);

      const client = new DocumentServiceClient(mockConfig);

      await expect(client.storeFinalSignedPdf(mockRequest)).rejects.toThrow();
    });

    it('should handle error when response.text() fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockRejectedValue(new Error('Failed to read response')),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const client = new DocumentServiceClient(mockConfig);

      await expect(client.storeFinalSignedPdf(mockRequest)).rejects.toThrow();
    });
  });
});



