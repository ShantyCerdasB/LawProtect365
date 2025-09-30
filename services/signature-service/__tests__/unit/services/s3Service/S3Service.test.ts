/**
 * @fileoverview S3Service.test.ts - Unit tests for S3Service
 * @summary Tests for S3Service document storage operations
 * @description Tests all S3Service methods including document storage, retrieval,
 * presigned URL generation, and audit event creation with comprehensive coverage.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { S3Service } from '../../../../src/services/s3Service/S3Service';
import { AuditEventService } from '../../../../src/services/audit/AuditEventService';
import { S3Presigner, S3EvidenceStorage, NotFoundError, BadRequestError } from '@lawprotect/shared-ts';
// import { TestUtils } from '../../../helpers/testUtils';
import { createS3ServiceMock } from '../../../helpers/mocks/services/S3Service.mock';
import { createAuditEventServiceMock } from '../../../helpers/mocks/services/AuditEventService.mock';
import { DocumentType } from '../../../../src/domain/enums';

// Mock the shared-ts modules
jest.mock('@lawprotect/shared-ts', () => ({
  createNetworkSecurityContext: jest.fn(() => ({
    ipAddress: '192.168.1.1',
    userAgent: 'TestAgent/1.0',
    country: 'US'
  }))
}));

describe('S3Service', () => {
  let s3Service: S3Service;
  let mockS3Presigner: jest.Mocked<S3Presigner>;
  let mockS3EvidenceStorage: jest.Mocked<S3EvidenceStorage>;
  let mockAuditEventService: any;
  let mockConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mocks
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

    // Create S3Service instance
    s3Service = new S3Service(
      mockS3Presigner,
      mockS3EvidenceStorage,
      'test-bucket',
      mockAuditEventService,
      mockConfig
    );
  });

  describe('storeDocument', () => {
    it('should store document successfully', async () => {
      const request = {
        envelopeId: { getValue: () => 'test-envelope-id' } as any,
        signerId: { getValue: () => 'test-signer-id' } as any,
        documentContent: Buffer.from('test document content'),
        contentType: { getValue: () => 'application/pdf' } as any,
        metadata: {
          originalFileName: 'test-document.pdf',
          fileSize: 1024,
          checksum: 'sha256:test-checksum'
        }
      };

      mockS3EvidenceStorage.putObject.mockResolvedValue({ etag: 'test-etag' });
      mockAuditEventService.create.mockResolvedValue({} as any);

      const result = await s3Service.storeDocument(request);

      expect(mockS3EvidenceStorage.putObject).toHaveBeenCalledWith({
        bucket: 'test-bucket',
        key: expect.stringContaining('envelopes/'),
        body: request.documentContent,
        contentType: request.contentType.getValue(),
        metadata: expect.objectContaining({
          envelopeId: request.envelopeId.getValue(),
          signerId: request.signerId.getValue()
        })
      });

      expect(mockAuditEventService.create).toHaveBeenCalledWith({
        envelopeId: request.envelopeId.getValue(),
        description: expect.stringContaining('Document stored'),
        eventType: 'DOCUMENT_ACCESSED',
        userId: request.signerId.getValue(),
        networkContext: expect.any(Object),
        metadata: expect.any(Object)
      });

      expect(result).toEqual(expect.objectContaining({
        documentKey: expect.any(String),
        s3Location: expect.stringContaining('s3://test-bucket/'),
        contentType: request.contentType.getValue(),
        size: request.documentContent.length
      }));
    });

    it('should handle S3 storage errors', async () => {
      const request = {
        envelopeId: { getValue: () => 'test-envelope-id' } as any,
        signerId: { getValue: () => 'test-signer-id' } as any,
        documentContent: Buffer.from('test document content'),
        contentType: { getValue: () => 'application/pdf' } as any,
        metadata: {
          originalFileName: 'test-document.pdf',
          fileSize: 1024,
          checksum: 'sha256:test-checksum'
        }
      };
      const error = new Error('S3 storage failed');

      mockS3EvidenceStorage.putObject.mockRejectedValue(error);

      await expect(s3Service.storeDocument(request)).rejects.toThrow();
    });
  });

  describe('retrieveDocument', () => {
    it('should retrieve document successfully', async () => {
      const request = {
        envelopeId: { getValue: () => 'test-envelope-id' } as any,
        signerId: { getValue: () => 'test-signer-id' } as any,
        documentKey: { getValue: () => 'envelopes/test-envelope/signers/test-signer/document.pdf' } as any
      };
      const headResult = {
        exists: true,
        size: 1024,
        lastModified: new Date('2024-01-01T10:00:00Z'),
        metadata: {
          contentType: 'application/pdf',
          envelopeId: 'test-envelope-id',
          signerId: 'test-signer-id'
        }
      };

      mockS3EvidenceStorage.headObject.mockResolvedValue(headResult);
      mockAuditEventService.create.mockResolvedValue({} as any);

      const result = await s3Service.retrieveDocument(request);

      expect(mockS3EvidenceStorage.headObject).toHaveBeenCalledWith(
        'test-bucket',
        request.documentKey.getValue()
      );

      expect(mockAuditEventService.create).toHaveBeenCalledWith({
        envelopeId: request.envelopeId.getValue(),
        description: expect.stringContaining('Document retrieved'),
        eventType: 'DOCUMENT_ACCESSED',
        userId: request.signerId.getValue(),
        networkContext: expect.any(Object),
        metadata: expect.any(Object)
      });

      expect(result).toEqual(expect.objectContaining({
        documentKey: request.documentKey.getValue(),
        s3Location: expect.stringContaining('s3://test-bucket/'),
        contentType: headResult.metadata?.contentType || 'application/octet-stream',
        size: headResult.size
      }));
    });

    it('should handle document not found', async () => {
      const request = {
        envelopeId: { getValue: () => 'test-envelope-id' } as any,
        signerId: { getValue: () => 'test-signer-id' } as any,
        documentKey: { getValue: () => 'envelopes/test-envelope/signers/test-signer/document.pdf' } as any
      };
      const headResult = { exists: false };

      mockS3EvidenceStorage.headObject.mockResolvedValue(headResult);

      await expect(s3Service.retrieveDocument(request)).rejects.toThrow(NotFoundError);
    });
  });

  describe('generatePresignedUrl', () => {
    it('should generate GET presigned URL successfully', async () => {
      const request = {
        envelopeId: { getValue: () => 'test-envelope-id' } as any,
        signerId: { getValue: () => 'test-signer-id' } as any,
        documentKey: { getValue: () => 'envelopes/test-envelope/signers/test-signer/document.pdf' } as any,
        operation: { 
          isGet: () => true, 
          isPut: () => false, 
          getValue: () => 'GET',
          operation: 'GET',
          isReadOperation: () => true,
          isWriteOperation: () => false,
          equals: () => false,
          toJSON: () => 'GET'
        } as any,
        expiresIn: 3600
      };
      const expectedUrl = 'https://test-bucket.s3.amazonaws.com/test-key?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...';

      mockS3Presigner.getObjectUrl.mockResolvedValue(expectedUrl);
      mockAuditEventService.create.mockResolvedValue({} as any);

      const result = await s3Service.generatePresignedUrl(request);

      expect(mockS3Presigner.getObjectUrl).toHaveBeenCalledWith({
        bucket: 'test-bucket',
        key: request.documentKey.getValue(),
        expiresInSeconds: request.expiresIn || 3600
      });

      expect(mockAuditEventService.create).toHaveBeenCalledWith({
        envelopeId: request.envelopeId.getValue(),
        description: expect.stringContaining('Presigned URL generated'),
        eventType: 'DOCUMENT_ACCESSED',
        userId: request.signerId.getValue(),
        networkContext: expect.any(Object),
        metadata: expect.any(Object)
      });

      expect(result).toBe(expectedUrl);
    });

    it('should generate PUT presigned URL successfully', async () => {
      const request = {
        envelopeId: { getValue: () => 'test-envelope-id' } as any,
        signerId: { getValue: () => 'test-signer-id' } as any,
        documentKey: { getValue: () => 'envelopes/test-envelope/signers/test-signer/document.pdf' } as any,
        operation: { 
          isGet: () => false, 
          isPut: () => true, 
          getValue: () => 'PUT',
          operation: 'PUT',
          isReadOperation: () => false,
          isWriteOperation: () => true,
          equals: () => false,
          toJSON: () => 'PUT'
        } as any,
        expiresIn: 3600
      };
      const expectedUrl = 'https://test-bucket.s3.amazonaws.com/test-key?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...';

      mockS3Presigner.putObjectUrl.mockResolvedValue(expectedUrl);
      mockAuditEventService.create.mockResolvedValue({} as any);

      const result = await s3Service.generatePresignedUrl(request);

      expect(mockS3Presigner.putObjectUrl).toHaveBeenCalledWith({
        bucket: 'test-bucket',
        key: request.documentKey.getValue(),
        expiresInSeconds: request.expiresIn || 3600
      });

      expect(result).toBe(expectedUrl);
    });

    it('should handle unsupported operations', async () => {
      const request = {
        envelopeId: { getValue: () => 'test-envelope-id' } as any,
        signerId: { getValue: () => 'test-signer-id' } as any,
        documentKey: { getValue: () => 'envelopes/test-envelope/signers/test-signer/document.pdf' } as any,
        operation: { 
          isGet: () => false, 
          isPut: () => false, 
          getValue: () => 'DELETE',
          operation: 'DELETE',
          isReadOperation: () => false,
          isWriteOperation: () => false,
          equals: () => false,
          toJSON: () => 'DELETE'
        } as any,
        expiresIn: 3600
      };

      await expect(s3Service.generatePresignedUrl(request)).rejects.toThrow(BadRequestError);
    });
  });

  describe('documentExists', () => {
    it('should return true when document exists', async () => {
      const documentKey = 'test-document.pdf';
      const headResult = { exists: true };

      mockS3EvidenceStorage.headObject.mockResolvedValue(headResult);

      const result = await s3Service.documentExists(documentKey);

      expect(mockS3EvidenceStorage.headObject).toHaveBeenCalledWith('test-bucket', documentKey);
      expect(result).toBe(true);
    });

    it('should return false when document does not exist', async () => {
      const documentKey = 'test-document.pdf';
      const headResult = { exists: false };

      mockS3EvidenceStorage.headObject.mockResolvedValue(headResult);

      const result = await s3Service.documentExists(documentKey);

      expect(result).toBe(false);
    });

    it('should return false for empty document key', async () => {
      const result = await s3Service.documentExists('');

      expect(result).toBe(false);
    });
  });

  describe('assertExists', () => {
    it('should pass when source key exists', async () => {
      const sourceKey = 'source-document.pdf';
      const metaKey = 'meta-document.pdf';

      mockS3EvidenceStorage.headObject
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({ exists: true });

      await expect(s3Service.assertExists({ sourceKey, metaKey })).resolves.not.toThrow();

      expect(mockS3EvidenceStorage.headObject).toHaveBeenCalledWith('test-bucket', sourceKey);
      expect(mockS3EvidenceStorage.headObject).toHaveBeenCalledWith('test-bucket', metaKey);
    });

    it('should throw when source key does not exist', async () => {
      const sourceKey = 'source-document.pdf';
      const headResult = { exists: false };

      mockS3EvidenceStorage.headObject.mockResolvedValue(headResult);

      await expect(s3Service.assertExists({ sourceKey })).rejects.toThrow();
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

      mockS3EvidenceStorage.headObject.mockResolvedValue(headResult);

      const result = await s3Service.getDocumentMetadata(documentKey);

      expect(mockS3EvidenceStorage.headObject).toHaveBeenCalledWith('test-bucket', documentKey);
      expect(result).toEqual(expect.objectContaining({
        documentKey,
        s3Location: expect.stringContaining('s3://test-bucket/'),
        contentType: headResult.metadata?.contentType || 'application/octet-stream',
        size: headResult.size
      }));
    });

    it('should return null when document does not exist', async () => {
      const documentKey = 'test-document.pdf';
      const headResult = { exists: false };

      mockS3EvidenceStorage.headObject.mockResolvedValue(headResult);

      const result = await s3Service.getDocumentMetadata(documentKey);

      expect(result).toBeNull();
    });
  });

  describe('getDocumentInfo', () => {
    it('should return document info successfully', async () => {
      const s3Key = 'test-document.pdf';
      const headResult = {
        exists: true,
        size: 1024,
        lastModified: new Date('2024-01-01T10:00:00Z'),
        metadata: {
          contentType: 'application/pdf'
        }
      };

      mockS3EvidenceStorage.headObject.mockResolvedValue(headResult);

      const result = await s3Service.getDocumentInfo(s3Key);

      expect(result).toEqual(expect.objectContaining({
        filename: expect.any(String),
        contentType: expect.any(String),
        size: expect.any(Number)
      }));
    });

    it('should throw when document not found', async () => {
      const s3Key = 'test-document.pdf';

      mockS3EvidenceStorage.headObject.mockResolvedValue({ exists: false });

      await expect(s3Service.getDocumentInfo(s3Key)).rejects.toThrow();
    });
  });

  describe('getDocumentContent', () => {
    it('should return document content successfully', async () => {
      const s3Key = 'test-document.pdf';
      const expectedContent = Buffer.from('test content');

      mockS3EvidenceStorage.getObject.mockResolvedValue({ body: expectedContent } as any);

      const result = await s3Service.getDocumentContent(s3Key);

      expect(mockS3EvidenceStorage.getObject).toHaveBeenCalledWith('test-bucket', s3Key);
      expect(result).toBe(expectedContent);
    });
  });

  describe('recordDownloadAction', () => {
    it('should record download action successfully', async () => {
      const request = {
        envelopeId: 'test-envelope-id',
        userId: 'test-user-id',
        userEmail: 'test@example.com',
        s3Key: 'envelopes/test-envelope/signers/test-signer/signed-document.pdf',
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent/1.0',
        country: 'US'
      };

      mockS3EvidenceStorage.headObject.mockResolvedValue({ exists: true });
      mockAuditEventService.create.mockResolvedValue({} as any);

      await s3Service.recordDownloadAction(request);

      expect(mockAuditEventService.create).toHaveBeenCalledWith({
        envelopeId: request.envelopeId,
        description: 'Signed document downloaded',
        eventType: 'DOCUMENT_DOWNLOADED',
        userId: request.userId,
        userEmail: request.userEmail,
        networkContext: expect.any(Object),
        metadata: expect.any(Object)
      });
    });
  });

  describe('storeSignedDocument', () => {
    it('should store signed document successfully', async () => {
      const request = {
        envelopeId: { getValue: () => 'test-envelope-id' } as any,
        signerId: { getValue: () => 'test-signer-id' } as any,
        signedDocumentContent: Buffer.from('signed document content'),
        contentType: 'application/pdf'
      };

      mockS3EvidenceStorage.putObject.mockResolvedValue({ etag: 'test-etag' });
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      const result = await s3Service.storeSignedDocument(request);

      expect(mockS3EvidenceStorage.putObject).toHaveBeenCalledWith({
        bucket: 'test-bucket',
        key: expect.stringContaining('envelopes/'),
        body: request.signedDocumentContent,
        contentType: request.contentType,
        metadata: expect.objectContaining({
          envelopeId: request.envelopeId.getValue(),
          signerId: request.signerId.getValue(),
          documentType: DocumentType.SIGNED
        })
      });

      expect(mockAuditEventService.createSignerEvent).toHaveBeenCalledWith({
        envelopeId: request.envelopeId.getValue(),
        signerId: request.signerId.getValue(),
        eventType: 'DOCUMENT_ACCESSED',
        description: expect.stringContaining('Signed document stored'),
        userId: 'system',
        metadata: expect.any(Object)
      });

      expect(result).toEqual(expect.objectContaining({
        documentKey: expect.any(String),
        s3Location: expect.stringContaining('s3://test-bucket/'),
        contentType: request.contentType,
        size: request.signedDocumentContent.length
      }));
    });

    it('should handle S3 storage errors', async () => {
      const request = {
        envelopeId: { getValue: () => 'test-envelope-id' } as any,
        signerId: { getValue: () => 'test-signer-id' } as any,
        signedDocumentContent: Buffer.from('signed document content'),
        contentType: 'application/pdf'
      };
      const error = new Error('S3 storage failed');

      mockS3EvidenceStorage.putObject.mockRejectedValue(error);

      await expect(s3Service.storeSignedDocument(request)).rejects.toThrow();
    });
  });
});