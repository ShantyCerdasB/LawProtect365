/**
 * @fileoverview S3Service.test.ts - Unit tests for S3Service
 * @summary Tests for S3Service document storage operations
 * @description Tests all S3Service methods including document storage, retrieval,
 * presigned URL generation, and audit event creation with comprehensive coverage.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { generateTestIpAddress, TestUtils } from '../../../helpers/testUtils';
import { S3Service } from '../../../../src/services/s3Service/S3Service';
import { S3Presigner, S3EvidenceStorage, NotFoundError, BadRequestError, ContentType, S3Key, S3Operation, getDocumentContent } from '@lawprotect/shared-ts';
import { createAuditEventServiceMock } from '../../../helpers/mocks/services/AuditEventService.mock';
import { EnvelopeId } from '../../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../../src/domain/value-objects/SignerId';
import { DocumentType } from '../../../../src/domain/enums';
import { documentS3Error, documentS3NotFound } from '../../../../src/signature-errors';

jest.mock('@lawprotect/shared-ts', () => {
  const actual = jest.requireActual('@lawprotect/shared-ts') as Record<string, any>;
  return {
    ...actual,
    createNetworkSecurityContext: jest.fn(() => ({
      ipAddress: generateTestIpAddress(),
      userAgent: 'TestAgent/1.0',
      country: 'US'
    })),
    getDocumentContent: jest.fn(),
    ContentType: {
      fromString: jest.fn((value: string) => ({
        getValue: () => value,
        toString: () => value
      }))
    },
    S3Key: {
      fromString: jest.fn((value: string) => ({
        getValue: () => value,
        toString: () => value,
        getFileName: () => value.split('/').pop() || 'document.pdf'
      }))
    },
    S3Operation: {
      fromString: jest.fn((value: string) => ({
        getValue: () => value,
        toString: () => value,
        isGet: () => value === 'GET',
        isPut: () => value === 'PUT',
        operation: value,
        isReadOperation: () => value === 'GET',
        isWriteOperation: () => value === 'PUT',
        equals: () => false,
        toJSON: () => value
      }))
    },
    ErrorCodes: {
      COMMON_NOT_FOUND: 'COMMON_NOT_FOUND',
      COMMON_BAD_REQUEST: 'COMMON_BAD_REQUEST'
    }
  };
});

jest.mock('../../../../src/domain/rules/s3/S3ValidationRules', () => ({
  validateStoreDocumentRequest: jest.fn(),
  validateRetrieveDocumentRequest: jest.fn(),
  validateGeneratePresignedUrlRequest: jest.fn(),
}));

jest.mock('../../../../src/domain/rules/s3/S3StorageRules', () => ({
  validateS3StorageForDocument: jest.fn(),
}));

describe('S3Service', () => {
  let s3Service: S3Service;
  let mockS3Presigner: jest.Mocked<S3Presigner>;
  let mockS3EvidenceStorage: jest.Mocked<S3EvidenceStorage>;
  let mockAuditEventService: any;
  let mockConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockS3Presigner = {
      getObjectUrl: jest.fn(),
      putObjectUrl: jest.fn()
    } as any;

    mockS3EvidenceStorage = {
      putObject: jest.fn(),
      headObject: jest.fn(),
      getObject: jest.fn()
    } as any;

    mockAuditEventService = createAuditEventServiceMock();
    mockConfig = {
      documentDownload: {
        maxExpirationSeconds: 86400,
        minExpirationSeconds: 300
      }
    };

    s3Service = new S3Service(
      mockS3Presigner,
      mockS3EvidenceStorage,
      'test-bucket',
      mockAuditEventService,
      mockConfig
    );
  });

  describe('constructor', () => {
    it('should create S3Service instance', () => {
      expect(s3Service).toBeDefined();
      expect(s3Service).toBeInstanceOf(S3Service);
    });
  });

  describe('storeDocument', () => {
    it('should store document successfully', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const signerId = SignerId.fromString(TestUtils.generateUuid());
      const documentContent = Buffer.from('test document content');
      const request = {
        envelopeId,
        signerId,
        documentContent,
        contentType: ContentType.fromString('application/pdf'),
        metadata: {
          originalFileName: 'test-document.pdf',
          fileSize: documentContent.length,
          checksum: 'sha256:test-checksum'
        }
      };

      mockS3EvidenceStorage.putObject.mockResolvedValue({ etag: 'test-etag' } as any);
      mockAuditEventService.create.mockResolvedValue({} as any);

      const result = await s3Service.storeDocument(request);

      expect(mockS3EvidenceStorage.putObject).toHaveBeenCalled();
      expect(mockAuditEventService.create).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.documentKey).toContain('envelopes/');
      expect(result.s3Location).toContain('s3://test-bucket/');
      expect(result.contentType).toBe('application/pdf');
      expect(result.size).toBe(documentContent.length);
    });

    it('should handle S3 storage errors', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const signerId = SignerId.fromString(TestUtils.generateUuid());
      const request = {
        envelopeId,
        signerId,
        documentContent: Buffer.from('test'),
        contentType: ContentType.fromString('application/pdf'),
      };

      mockS3EvidenceStorage.putObject.mockRejectedValue(new Error('S3 storage failed'));

      await expect(s3Service.storeDocument(request)).rejects.toThrow();
    });

    it('should re-throw BadRequestError', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const signerId = SignerId.fromString(TestUtils.generateUuid());
      const request = {
        envelopeId,
        signerId,
        documentContent: Buffer.from('test'),
        contentType: ContentType.fromString('application/pdf'),
      };

      const badRequestError = new BadRequestError('Invalid request', 'COMMON_BAD_REQUEST');
      mockS3EvidenceStorage.putObject.mockRejectedValue(badRequestError);

      await expect(s3Service.storeDocument(request)).rejects.toThrow(BadRequestError);
    });
  });

  describe('retrieveDocument', () => {
    it('should retrieve document successfully', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const signerId = SignerId.fromString(TestUtils.generateUuid());
      const documentKey = S3Key.fromString('envelopes/test-envelope/signers/test-signer/document.pdf');
      const request = {
        envelopeId,
        signerId,
        documentKey
      };

      const headResult = {
        exists: true,
        size: 1024,
        lastModified: new Date('2024-01-01T10:00:00Z'),
        metadata: {
          contentType: 'application/pdf'
        }
      };

      mockS3EvidenceStorage.headObject.mockResolvedValue(headResult as any);
      mockAuditEventService.create.mockResolvedValue({} as any);

      const result = await s3Service.retrieveDocument(request);

      expect(mockS3EvidenceStorage.headObject).toHaveBeenCalledWith('test-bucket', documentKey.getValue());
      expect(mockAuditEventService.create).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.documentKey).toBe(documentKey.getValue());
      expect(result.s3Location).toContain('s3://test-bucket/');
      expect(result.contentType).toBe('application/pdf');
      expect(result.size).toBe(1024);
    });

    it('should throw NotFoundError when document does not exist', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const signerId = SignerId.fromString(TestUtils.generateUuid());
      const documentKey = S3Key.fromString('envelopes/test-envelope/signers/test-signer/document.pdf');
      const request = {
        envelopeId,
        signerId,
        documentKey
      };

      mockS3EvidenceStorage.headObject.mockResolvedValue({ exists: false } as any);

      await expect(s3Service.retrieveDocument(request)).rejects.toThrow(NotFoundError);
    });

    it('should handle NoSuchKey errors', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const signerId = SignerId.fromString(TestUtils.generateUuid());
      const documentKey = S3Key.fromString('envelopes/test-envelope/signers/test-signer/document.pdf');
      const request = {
        envelopeId,
        signerId,
        documentKey
      };

      const noSuchKeyError = { name: 'NoSuchKey' };
      mockS3EvidenceStorage.headObject.mockRejectedValue(noSuchKeyError);

      await expect(s3Service.retrieveDocument(request)).rejects.toThrow(NotFoundError);
    });
  });

  describe('generatePresignedUrl', () => {
    it('should generate GET presigned URL successfully', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const signerId = SignerId.fromString(TestUtils.generateUuid());
      const documentKey = S3Key.fromString('envelopes/test-envelope/signers/test-signer/document.pdf');
      const operation = S3Operation.fromString('GET');
      const request = {
        envelopeId,
        signerId,
        documentKey,
        operation,
        expiresIn: 3600
      };

      const expectedUrl = 'https://test-bucket.s3.amazonaws.com/test-key?X-Amz-Algorithm=...';
      mockS3Presigner.getObjectUrl.mockResolvedValue(expectedUrl);
      mockAuditEventService.create.mockResolvedValue({} as any);

      const result = await s3Service.generatePresignedUrl(request);

      expect(mockS3Presigner.getObjectUrl).toHaveBeenCalledWith({
        bucket: 'test-bucket',
        key: documentKey.getValue(),
        expiresInSeconds: 3600
      });
      expect(mockAuditEventService.create).toHaveBeenCalled();
      expect(result).toBe(expectedUrl);
    });

    it('should generate PUT presigned URL successfully', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const signerId = SignerId.fromString(TestUtils.generateUuid());
      const documentKey = S3Key.fromString('envelopes/test-envelope/signers/test-signer/document.pdf');
      const operation = S3Operation.fromString('PUT');
      const request = {
        envelopeId,
        signerId,
        documentKey,
        operation,
        expiresIn: 3600
      };

      const expectedUrl = 'https://test-bucket.s3.amazonaws.com/test-key?X-Amz-Algorithm=...';
      mockS3Presigner.putObjectUrl.mockResolvedValue(expectedUrl);
      mockAuditEventService.create.mockResolvedValue({} as any);

      const result = await s3Service.generatePresignedUrl(request);

      expect(mockS3Presigner.putObjectUrl).toHaveBeenCalledWith({
        bucket: 'test-bucket',
        key: documentKey.getValue(),
        expiresInSeconds: 3600
      });
      expect(result).toBe(expectedUrl);
    });

    it('should use default expiration when not provided', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const signerId = SignerId.fromString(TestUtils.generateUuid());
      const documentKey = S3Key.fromString('envelopes/test-envelope/signers/test-signer/document.pdf');
      const operation = S3Operation.fromString('GET');
      const request = {
        envelopeId,
        signerId,
        documentKey,
        operation
      };

      const expectedUrl = 'https://test-bucket.s3.amazonaws.com/test-key?X-Amz-Algorithm=...';
      mockS3Presigner.getObjectUrl.mockResolvedValue(expectedUrl);
      mockAuditEventService.create.mockResolvedValue({} as any);

      await s3Service.generatePresignedUrl(request);

      expect(mockS3Presigner.getObjectUrl).toHaveBeenCalledWith({
        bucket: 'test-bucket',
        key: documentKey.getValue(),
        expiresInSeconds: 3600
      });
    });

    it('should throw BadRequestError for unsupported operations', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const signerId = SignerId.fromString(TestUtils.generateUuid());
      const documentKey = S3Key.fromString('envelopes/test-envelope/signers/test-signer/document.pdf');
      const operation = S3Operation.fromString('DELETE');
      const request = {
        envelopeId,
        signerId,
        documentKey,
        operation
      };

      await expect(s3Service.generatePresignedUrl(request)).rejects.toThrow(BadRequestError);
    });
  });

  describe('documentExists', () => {
    it('should return true when document exists', async () => {
      const documentKey = 'test-document.pdf';
      mockS3EvidenceStorage.headObject.mockResolvedValue({ exists: true } as any);

      const result = await s3Service.documentExists(documentKey);

      expect(mockS3EvidenceStorage.headObject).toHaveBeenCalledWith('test-bucket', documentKey);
      expect(result).toBe(true);
    });

    it('should return false when document does not exist', async () => {
      const documentKey = 'test-document.pdf';
      mockS3EvidenceStorage.headObject.mockResolvedValue({ exists: false } as any);

      const result = await s3Service.documentExists(documentKey);

      expect(result).toBe(false);
    });

    it('should return false for empty document key', async () => {
      const result = await s3Service.documentExists('');

      expect(result).toBe(false);
      expect(mockS3EvidenceStorage.headObject).not.toHaveBeenCalled();
    });

    it('should return false for whitespace-only document key', async () => {
      const result = await s3Service.documentExists('   ');

      expect(result).toBe(false);
    });
  });

  describe('assertExists', () => {
    it('should pass when source key exists', async () => {
      const sourceKey = 'source-document.pdf';
      mockS3EvidenceStorage.headObject.mockResolvedValue({ exists: true } as any);

      await expect(s3Service.assertExists({ sourceKey })).resolves.not.toThrow();

      expect(mockS3EvidenceStorage.headObject).toHaveBeenCalledWith('test-bucket', sourceKey);
    });

    it('should pass when both source and meta keys exist', async () => {
      const sourceKey = 'source-document.pdf';
      const metaKey = 'meta-document.pdf';
      mockS3EvidenceStorage.headObject
        .mockResolvedValueOnce({ exists: true } as any)
        .mockResolvedValueOnce({ exists: true } as any);

      await expect(s3Service.assertExists({ sourceKey, metaKey })).resolves.not.toThrow();

      expect(mockS3EvidenceStorage.headObject).toHaveBeenCalledTimes(2);
    });

    it('should throw when source key does not exist', async () => {
      const sourceKey = 'source-document.pdf';
      mockS3EvidenceStorage.headObject.mockResolvedValue({ exists: false } as any);

      await expect(s3Service.assertExists({ sourceKey })).rejects.toThrow();
      
      try {
        await s3Service.assertExists({ sourceKey });
      } catch (error: any) {
        expect(error.code).toBeDefined();
      }
    });

    it('should throw when meta key does not exist', async () => {
      const sourceKey = 'source-document.pdf';
      const metaKey = 'meta-document.pdf';
      mockS3EvidenceStorage.headObject
        .mockResolvedValueOnce({ exists: true } as any)
        .mockResolvedValueOnce({ exists: false } as any);

      await expect(s3Service.assertExists({ sourceKey, metaKey })).rejects.toThrow();
      
      try {
        await s3Service.assertExists({ sourceKey, metaKey });
      } catch (error: any) {
        expect(error.code).toBeDefined();
      }
    });
  });

  describe('getDocumentMetadata', () => {
    it('should return document metadata when document exists', async () => {
      const documentKey = 'test-document.pdf';
      const headResult = {
        exists: true,
        size: 1024,
        lastModified: new Date('2024-01-01T10:00:00Z'),
        metadata: {
          contentType: 'application/pdf'
        }
      };

      mockS3EvidenceStorage.headObject.mockResolvedValue(headResult as any);

      const result = await s3Service.getDocumentMetadata(documentKey);

      expect(mockS3EvidenceStorage.headObject).toHaveBeenCalledWith('test-bucket', documentKey);
      expect(result).toBeDefined();
      expect(result?.documentKey).toBe(documentKey);
      expect(result?.s3Location).toContain('s3://test-bucket/');
      expect(result?.contentType).toBe('application/pdf');
      expect(result?.size).toBe(1024);
    });

    it('should return null when document does not exist', async () => {
      const documentKey = 'test-document.pdf';
      mockS3EvidenceStorage.headObject.mockResolvedValue({ exists: false } as any);

      const result = await s3Service.getDocumentMetadata(documentKey);

      expect(result).toBeNull();
    });

    it('should return null for empty document key', async () => {
      const result = await s3Service.getDocumentMetadata('');

      expect(result).toBeNull();
      expect(mockS3EvidenceStorage.headObject).not.toHaveBeenCalled();
    });
  });

  describe('getDocumentInfo', () => {
    it('should return document info successfully', async () => {
      const s3Key = 'envelopes/test-envelope/signers/test-signer/document.pdf';
      const headResult = {
        exists: true,
        size: 1024,
        lastModified: new Date('2024-01-01T10:00:00Z'),
        metadata: {
          contentType: 'application/pdf'
        }
      };

      mockS3EvidenceStorage.headObject.mockResolvedValue(headResult as any);

      const result = await s3Service.getDocumentInfo(s3Key);

      expect(result).toBeDefined();
      expect(result.filename).toBeDefined();
      expect(result.contentType).toBe('application/pdf');
      expect(result.size).toBe(1024);
    });

    it('should throw when document not found', async () => {
      const s3Key = 'test-document.pdf';
      mockS3EvidenceStorage.headObject.mockResolvedValue({ exists: false } as any);

      await expect(s3Service.getDocumentInfo(s3Key)).rejects.toThrow();
      
      try {
        await s3Service.getDocumentInfo(s3Key);
      } catch (error: any) {
        expect(error.code).toBeDefined();
      }
    });
  });

  describe('getDocumentContent', () => {
    it('should return document content successfully', async () => {
      const s3Key = 'test-document.pdf';
      const expectedContent = Buffer.from('test content');
      
      (getDocumentContent as jest.MockedFunction<typeof getDocumentContent>).mockResolvedValue(expectedContent);

      const result = await s3Service.getDocumentContent(s3Key);

      expect(getDocumentContent).toHaveBeenCalledWith(
        mockS3EvidenceStorage,
        'test-bucket',
        s3Key
      );
      expect(result).toBe(expectedContent);
    });
  });

  describe('recordDownloadAction', () => {
    it('should record download action successfully', async () => {
      const s3Key = 'envelopes/test-envelope/signers/test-signer/signed-document.pdf';
      const headResult = {
        exists: true,
        size: 1024,
        metadata: {
          contentType: 'application/pdf'
        }
      };

      mockS3EvidenceStorage.headObject.mockResolvedValue(headResult as any);
      mockAuditEventService.create.mockResolvedValue({} as any);

      const request = {
        envelopeId: TestUtils.generateUuid(),
        userId: 'test-user-id',
        userEmail: 'test@example.com',
        s3Key,
        ipAddress: generateTestIpAddress(),
        userAgent: 'TestAgent/1.0',
        country: 'US'
      };

      await s3Service.recordDownloadAction(request);

      expect(mockAuditEventService.create).toHaveBeenCalledWith({
        envelopeId: request.envelopeId,
        description: 'Signed document downloaded',
        eventType: 'DOCUMENT_DOWNLOADED',
        userId: request.userId,
        userEmail: request.userEmail,
        networkContext: expect.any(Object),
        metadata: expect.objectContaining({
          s3Key,
          filename: expect.any(String),
          contentType: expect.any(String),
          size: expect.any(Number)
        })
      });
    });
  });

  describe('storeSignedDocument', () => {
    it('should store signed document successfully', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const signerId = SignerId.fromString(TestUtils.generateUuid());
      const signedDocumentContent = Buffer.from('signed document content');
      const request = {
        envelopeId,
        signerId,
        signedDocumentContent,
        contentType: 'application/pdf'
      };

      mockS3EvidenceStorage.putObject.mockResolvedValue({ etag: 'test-etag' } as any);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      const result = await s3Service.storeSignedDocument(request);

      expect(mockS3EvidenceStorage.putObject).toHaveBeenCalledWith({
        bucket: 'test-bucket',
        key: expect.stringContaining('envelopes/'),
        body: signedDocumentContent,
        contentType: 'application/pdf',
        metadata: expect.objectContaining({
          envelopeId: envelopeId.getValue(),
          signerId: signerId.getValue(),
          documentType: DocumentType.SIGNED,
          checksum: expect.any(String)
        })
      });

      expect(mockAuditEventService.createSignerEvent).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.documentKey).toContain('signed-document-');
      expect(result.s3Location).toContain('s3://test-bucket/');
      expect(result.contentType).toBe('application/pdf');
      expect(result.size).toBe(signedDocumentContent.length);
    });

    it('should handle S3 storage errors', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const signerId = SignerId.fromString(TestUtils.generateUuid());
      const request = {
        envelopeId,
        signerId,
        signedDocumentContent: Buffer.from('signed document content'),
        contentType: 'application/pdf'
      };

      mockS3EvidenceStorage.putObject.mockRejectedValue(new Error('S3 storage failed'));

      await expect(s3Service.storeSignedDocument(request)).rejects.toThrow();
    });
  });
});
