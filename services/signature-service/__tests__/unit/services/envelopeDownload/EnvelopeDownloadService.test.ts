/**
 * @fileoverview EnvelopeDownloadService.test.ts - Unit tests for EnvelopeDownloadService
 * @summary Tests for document download functionality
 * @description Comprehensive test suite for EnvelopeDownloadService covering all methods and edge cases
 */

import { jest } from '@jest/globals';
import { EnvelopeDownloadService } from '../../../../src/services/envelopeDownload/EnvelopeDownloadService';
import { SignatureEnvelopeRepository } from '../../../../src/repositories/SignatureEnvelopeRepository';
import { S3Service } from '../../../../src/services/s3Service/S3Service';

// Mock dependencies
jest.mock('../../../../src/repositories/SignatureEnvelopeRepository');
jest.mock('../../../../src/services/s3Service/S3Service');
jest.mock('../../../../src/domain/value-objects/EnvelopeId');
jest.mock('../../../../src/config/AppConfig', () => ({
  loadConfig: jest.fn(() => ({
    documentDownload: {
      defaultExpirationSeconds: 3600,
      minExpirationSeconds: 300,
      maxExpirationSeconds: 86400
    }
  }))
}));
jest.mock('../../../../src/domain/value-objects/SignerId', () => ({
  SignerId: {
    fromString: jest.fn((value: string) => ({ getValue: () => value }))
  }
}));
jest.mock('@lawprotect/shared-ts', () => ({
  S3Operation: {
    get: jest.fn(() => ({
      isGet: () => true,
      isPut: () => false,
      operation: 'GET',
      isReadOperation: () => true,
      isWriteOperation: () => false,
      equals: jest.fn(),
      toJSON: jest.fn()
    }))
  },
  NotFoundError: class NotFoundError extends Error {
    code: string;
    details: any;
    constructor(message: string, code: string, details?: any) {
      super(message);
      this.name = 'NotFoundError';
      this.code = code;
      this.details = details;
    }
  },
  BadRequestError: class BadRequestError extends Error {
    code: string;
    details: any;
    constructor(message: string, code: string, details?: any) {
      super(message);
      this.name = 'BadRequestError';
      this.code = code;
      this.details = details;
    }
  },
  InternalError: class InternalError extends Error {
    code: string;
    details: any;
    constructor(message: string, code: string, details?: any) {
      super(message);
      this.name = 'InternalError';
      this.code = code;
      this.details = details;
    }
  }
}));

function createMockEnvelope(envelopeId: string) {
  return {
    getId: jest.fn(() => ({ getValue: () => envelopeId })),
    getLatestSignedDocumentKey: jest.fn(() => ({ getValue: () => 'signed-document-key' })),
  };
}

function createMockEnvelopeWithDocumentKey(envelopeId: string, documentKey: string) {
  return {
    getId: jest.fn(() => ({ getValue: () => envelopeId })),
    getLatestSignedDocumentKey: jest.fn(() => ({ getValue: () => documentKey })),
  };
}

describe('EnvelopeDownloadService', () => {
  let service: EnvelopeDownloadService;
  let mockSignatureEnvelopeRepository: jest.Mocked<SignatureEnvelopeRepository>;
  let mockS3Service: jest.Mocked<S3Service>;

  beforeEach(() => {
    mockSignatureEnvelopeRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    mockS3Service = {
      generatePresignedUrl: jest.fn(),
    } as any;

    service = new EnvelopeDownloadService(
      mockSignatureEnvelopeRepository,
      mockS3Service
    );
  });

  describe('downloadDocument', () => {
    it('should download document successfully', async () => {
      const envelopeId = 'test-envelope-id';
      const expiresIn = 3600;
      const expectedUrl = 'https://s3.amazonaws.com/bucket/signed-document.pdf';

      const mockEnvelope = createMockEnvelope(envelopeId);

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);
      mockS3Service.generatePresignedUrl.mockResolvedValue(expectedUrl);

      const result = await service.downloadDocument(
        { getValue: () => envelopeId } as any,
        expiresIn
      );

      expect(result).toEqual({
        downloadUrl: expectedUrl,
        expiresIn: expiresIn
      });

      expect(mockSignatureEnvelopeRepository.findById).toHaveBeenCalledWith(
        expect.any(Object)
      );
      expect(mockS3Service.generatePresignedUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: expect.any(Object),
          documentKey: expect.any(Object),
          expiresIn: expiresIn
        })
      );
    });

    it('should handle envelope not found', async () => {
      const envelopeId = 'non-existent-envelope';
      
      mockSignatureEnvelopeRepository.findById.mockResolvedValue(null);

      await expect(
        service.downloadDocument(
          { getValue: () => envelopeId } as any,
          3600
        )
      ).rejects.toThrow();
    });

    it('should handle S3 service errors', async () => {
      const envelopeId = 'test-envelope-id';
      const mockEnvelope = createMockEnvelope(envelopeId);

      mockSignatureEnvelopeRepository.findById.mockResolvedValue(mockEnvelope as any);
      mockS3Service.generatePresignedUrl.mockRejectedValue(new Error('S3 error'));

      await expect(
        service.downloadDocument(
          { getValue: () => envelopeId } as any,
          3600
        )
      ).rejects.toThrow('Envelope not found');
    });

    it('should handle repository errors', async () => {
      const envelopeId = 'test-envelope-id';
      
      mockSignatureEnvelopeRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(
        service.downloadDocument(
          { getValue: () => envelopeId } as any,
          3600
        )
      ).rejects.toThrow('Envelope not found');
    });
  });
});