/**
 * @fileoverview Unit tests for documentSigning utilities
 * @summary Tests for document preparation and signing flow helpers
 * @description Comprehensive test suite for documentSigning utilities covering all business logic,
 * document processing, S3 operations, and error handling for signature workflows.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { handleSignedDocumentFromFrontend, handleFlattenedDocument } from '../../../../../src/services/orchestrators/utils/documentSigning';
import { EnvelopeId } from '../../../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../../../src/domain/value-objects/SignerId';
import { TestUtils } from '../../../../helpers/testUtils';
import { signatureEnvelopeEntity } from '../../../../helpers/builders/signatureEnvelope';
import { envelopeNotFound, documentNotReady } from '../../../../../src/signature-errors';

describe('documentSigning utilities', () => {
  let mockS3Service: any;
  let mockSignatureEnvelopeService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockS3Service = {
      storeSignedDocument: jest.fn(),
      getDocumentContent: jest.fn()
    };

    mockSignatureEnvelopeService = {
      getEnvelopeWithSigners: jest.fn(),
      updateFlattenedKey: jest.fn()
    };
  });

  describe('handleSignedDocumentFromFrontend', () => {
    it('should process signed document from frontend successfully', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const base64Document = 'JVBERi0xLjQKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDMgMCBSCi9SZXNvdXJjZXMgPDwKL0ZvbnQgPDwKL0YxIDQgMCBSCj4+Cj4+Ci9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9Db250ZW50cyA2IDAgUgo+PgplbmRvYmoKNiAwIG9iago8PAovTGVuZ3RoIDc5Cj4+CnN0cmVhbQpCVApxIDU5NSA4NDIgVGQKL0YxIDEyIFRmCjcyIDcyMCBUZAooSGVsbG8gV29ybGQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMyAwIFIKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFs1IDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKeHJlZgowIDcKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDEwNyAwMDAwMCBuIAowMDAwMDAwMTYyIDAwMDAwIG4gCjAwMDAwMDAyNzEgMDAwMDAgbiAKMDAwMDAwMDM0OCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDcKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ0NwolJUVPRgo=';
      const expectedDocumentKey = 'signed/envelope-123/signer-456.pdf';
      const expectedBuffer = Buffer.from(base64Document, 'base64');

      mockS3Service.storeSignedDocument.mockResolvedValue({
        documentKey: expectedDocumentKey
      });

      const result = await handleSignedDocumentFromFrontend(mockS3Service, {
        envelopeId,
        signerId,
        signedDocumentBase64: base64Document
      });

      expect(mockS3Service.storeSignedDocument).toHaveBeenCalledWith({
        envelopeId,
        signerId,
        signedDocumentContent: expectedBuffer,
        contentType: 'application/pdf'
      });

      expect(result).toEqual({
        signedDocumentKey: expectedDocumentKey,
        documentContent: expectedBuffer,
        documentHash: expect.any(String)
      });

      expect(result.documentHash).toHaveLength(64); // SHA-256 hash length
    });

    it('should handle empty base64 document', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const base64Document = '';
      const expectedDocumentKey = 'signed/envelope-123/signer-456.pdf';

      mockS3Service.storeSignedDocument.mockResolvedValue({
        documentKey: expectedDocumentKey
      });

      const result = await handleSignedDocumentFromFrontend(mockS3Service, {
        envelopeId,
        signerId,
        signedDocumentBase64: base64Document
      });

      expect(result.documentContent).toEqual(Buffer.alloc(0));
      expect(result.documentHash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('should handle large base64 document', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const largeBase64Document = Buffer.alloc(1024 * 1024, 'A').toString('base64'); // 1MB
      const expectedDocumentKey = 'signed/envelope-123/signer-456.pdf';

      mockS3Service.storeSignedDocument.mockResolvedValue({
        documentKey: expectedDocumentKey
      });

      const result = await handleSignedDocumentFromFrontend(mockS3Service, {
        envelopeId,
        signerId,
        signedDocumentBase64: largeBase64Document
      });

      expect(result.documentContent.length).toBe(1024 * 1024);
      expect(result.documentHash).toHaveLength(64);
    });

    it('should propagate S3 service errors', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const base64Document = 'dGVzdA=='; // 'test' in base64
      const s3Error = new Error('S3 storage failed');

      mockS3Service.storeSignedDocument.mockRejectedValue(s3Error);

      await expect(handleSignedDocumentFromFrontend(mockS3Service, {
        envelopeId,
        signerId,
        signedDocumentBase64: base64Document
      })).rejects.toThrow('S3 storage failed');
    });
  });

  describe('handleFlattenedDocument', () => {
    it('should process flattened document successfully with existing flattened key', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const flattenedKey = 'documents/flattened/envelope-123.pdf';
      const documentContent = Buffer.from('PDF content');

      const envelope = signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        flattenedKey
      });

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(envelope);
      mockS3Service.getDocumentContent.mockResolvedValue(documentContent);

      const result = await handleFlattenedDocument(
        mockSignatureEnvelopeService,
        mockS3Service,
        {
          envelopeId,
          userId
        }
      );

      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).toHaveBeenCalledWith(envelopeId);
      expect(mockS3Service.getDocumentContent).toHaveBeenCalledWith(flattenedKey);

      expect(result).toEqual({
        signedDocumentKey: flattenedKey,
        documentContent,
        documentHash: expect.any(String)
      });

      expect(result.documentHash).toHaveLength(64);
    });

    it('should process flattened document with provided flattened key', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const providedFlattenedKey = 'custom/flattened/envelope-123.pdf';
      const documentContent = Buffer.from('PDF content');

      const envelope = signatureEnvelopeEntity({
        id: envelopeId.getValue()
      });

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(envelope);
      mockS3Service.getDocumentContent.mockResolvedValue(documentContent);

      const result = await handleFlattenedDocument(
        mockSignatureEnvelopeService,
        mockS3Service,
        {
          envelopeId,
          flattenedKey: providedFlattenedKey,
          userId
        }
      );

      expect(mockS3Service.getDocumentContent).toHaveBeenCalledWith(providedFlattenedKey);
      expect(result.signedDocumentKey).toBe(providedFlattenedKey);
    });

    it('should update flattened key when provided and envelope has no existing key', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const providedFlattenedKey = 'custom/flattened/envelope-123.pdf';
      const documentContent = Buffer.from('PDF content');

      const envelope = signatureEnvelopeEntity({
        id: envelopeId.getValue()
      });

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(envelope);
      mockSignatureEnvelopeService.updateFlattenedKey.mockResolvedValue(undefined);
      mockS3Service.getDocumentContent.mockResolvedValue(documentContent);

      const result = await handleFlattenedDocument(
        mockSignatureEnvelopeService,
        mockS3Service,
        {
          envelopeId,
          flattenedKey: providedFlattenedKey,
          userId
        }
      );

      expect(mockSignatureEnvelopeService.updateFlattenedKey).toHaveBeenCalledWith(
        envelopeId,
        providedFlattenedKey,
        userId
      );
      expect(result.signedDocumentKey).toBe(providedFlattenedKey);
    });

    it('should throw error when envelope is not found', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(null);

      await expect(handleFlattenedDocument(
        mockSignatureEnvelopeService,
        mockS3Service,
        {
          envelopeId,
          userId
        }
      )).rejects.toThrow('Envelope not found');
    });

    it('should throw error when envelope has no flattened key and none provided', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();

      const envelope = signatureEnvelopeEntity({
        id: envelopeId.getValue()
      });

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(envelope);

      await expect(handleFlattenedDocument(
        mockSignatureEnvelopeService,
        mockS3Service,
        {
          envelopeId,
          userId
        }
      )).rejects.toThrow('Document is not ready for signing');
    });

    it('should handle S3 service errors when retrieving document content', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const flattenedKey = 'documents/flattened/envelope-123.pdf';
      const s3Error = new Error('S3 retrieval failed');

      const envelope = signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        flattenedKey
      });

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(envelope);
      mockS3Service.getDocumentContent.mockRejectedValue(s3Error);

      await expect(handleFlattenedDocument(
        mockSignatureEnvelopeService,
        mockS3Service,
        {
          envelopeId,
          userId
        }
      )).rejects.toThrow('S3 retrieval failed');
    });

    it('should handle envelope service errors when updating flattened key', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const providedFlattenedKey = 'custom/flattened/envelope-123.pdf';
      const envelopeError = new Error('Envelope update failed');

      const envelope = signatureEnvelopeEntity({
        id: envelopeId.getValue()
      });

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(envelope);
      mockSignatureEnvelopeService.updateFlattenedKey.mockRejectedValue(envelopeError);

      await expect(handleFlattenedDocument(
        mockSignatureEnvelopeService,
        mockS3Service,
        {
          envelopeId,
          flattenedKey: providedFlattenedKey,
          userId
        }
      )).rejects.toThrow('Envelope update failed');
    });

    it('should generate consistent hash for same document content', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const flattenedKey = 'documents/flattened/envelope-123.pdf';
      const documentContent = Buffer.from('Consistent PDF content');

      const envelope = signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        flattenedKey
      });

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(envelope);
      mockS3Service.getDocumentContent.mockResolvedValue(documentContent);

      const result1 = await handleFlattenedDocument(
        mockSignatureEnvelopeService,
        mockS3Service,
        {
          envelopeId,
          userId
        }
      );

      const result2 = await handleFlattenedDocument(
        mockSignatureEnvelopeService,
        mockS3Service,
        {
          envelopeId,
          userId
        }
      );

      expect(result1.documentHash).toBe(result2.documentHash);
    });

    it('should handle different document sizes', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const flattenedKey = 'documents/flattened/envelope-123.pdf';

      const envelope = signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        flattenedKey
      });

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(envelope);

      // Test with small document
      const smallContent = Buffer.from('Small PDF');
      mockS3Service.getDocumentContent.mockResolvedValue(smallContent);

      const smallResult = await handleFlattenedDocument(
        mockSignatureEnvelopeService,
        mockS3Service,
        {
          envelopeId,
          userId
        }
      );

      expect(smallResult.documentContent.length).toBe(9);

      // Test with large document
      const largeContent = Buffer.alloc(1024 * 1024, 'A'); // 1MB
      mockS3Service.getDocumentContent.mockResolvedValue(largeContent);

      const largeResult = await handleFlattenedDocument(
        mockSignatureEnvelopeService,
        mockS3Service,
        {
          envelopeId,
          userId
        }
      );

      expect(largeResult.documentContent.length).toBe(1024 * 1024);
    });
  });

  describe('Edge cases', () => {
    it('should handle malformed base64 in frontend document', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const malformedBase64 = 'Invalid base64 content!@#$%';

      mockS3Service.storeSignedDocument.mockResolvedValue({
        documentKey: 'signed/malformed.pdf'
      });

      const result = await handleSignedDocumentFromFrontend(mockS3Service, {
        envelopeId,
        signerId,
        signedDocumentBase64: malformedBase64
      });

      expect(result.documentContent).toBeInstanceOf(Buffer);
      expect(result.documentHash).toHaveLength(64);
    });

    it('should handle special characters in envelope and signer IDs', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const base64Document = 'dGVzdA==';

      mockS3Service.storeSignedDocument.mockResolvedValue({
        documentKey: 'signed/special-chars.pdf'
      });

      const result = await handleSignedDocumentFromFrontend(mockS3Service, {
        envelopeId,
        signerId,
        signedDocumentBase64: base64Document
      });

      expect(mockS3Service.storeSignedDocument).toHaveBeenCalledWith({
        envelopeId,
        signerId,
        signedDocumentContent: expect.any(Buffer),
        contentType: 'application/pdf'
      });

      expect(result.signedDocumentKey).toBe('signed/special-chars.pdf');
    });
  });
});