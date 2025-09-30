import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { DownloadDocumentUseCase } from '../../../../../src/services/orchestrators/use-cases/DownloadDocumentUseCase';
import { DownloadDocumentInput } from '../../../../../src/domain/types/usecase/orchestrator/DownloadDocumentUseCase';
import { EnvelopeId } from '../../../../../src/domain/value-objects/EnvelopeId';
import { TestUtils } from '../../../../helpers/testUtils';
import { createSignatureEnvelopeServiceMock } from '../../../../helpers/mocks/services/SignatureEnvelopeService.mock';
import { createEnvelopeAccessServiceMock } from '../../../../helpers/mocks/services/EnvelopeAccessService.mock';
import { createAuditEventServiceMock } from '../../../../helpers/mocks/services/AuditEventService.mock';

describe('DownloadDocumentUseCase', () => {
  let useCase: DownloadDocumentUseCase;
  let mockSignatureEnvelopeService: any;
  let mockEnvelopeAccessService: any;
  let mockAuditEventService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSignatureEnvelopeService = createSignatureEnvelopeServiceMock();
    mockEnvelopeAccessService = createEnvelopeAccessServiceMock();
    mockAuditEventService = createAuditEventServiceMock();
    
    useCase = new DownloadDocumentUseCase(
      mockSignatureEnvelopeService,
      mockEnvelopeAccessService,
      mockAuditEventService
    );
  });

  describe('execute', () => {
    it('should download document successfully with all parameters', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const invitationToken = TestUtils.generateUuid();
      const expiresIn = 3600;
      
      const input: DownloadDocumentInput = {
        envelopeId,
        userId,
        invitationToken,
        expiresIn,
        securityContext: {
          ipAddress: TestUtils.createTestIpAddress(),
          userAgent: TestUtils.createTestUserAgent(),
          country: 'US'
        }
      };

      const expectedResult = {
        downloadUrl: 'https://s3.amazonaws.com/bucket/signed-document.pdf?signature=abc123',
        expiresIn: 3600
      };

      mockSignatureEnvelopeService.downloadDocument.mockResolvedValue(expectedResult);
      mockEnvelopeAccessService.validateEnvelopeAccess.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.downloadDocument).toHaveBeenCalledWith(
        envelopeId,
        expiresIn
      );
      expect(result).toEqual(expectedResult);
    });

    it('should download document with minimal parameters', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: DownloadDocumentInput = {
        envelopeId,
        userId
      };

      const expectedResult = {
        downloadUrl: 'https://s3.amazonaws.com/bucket/signed-document.pdf?signature=def456',
        expiresIn: 1800
      };

      mockSignatureEnvelopeService.downloadDocument.mockResolvedValue(expectedResult);
      mockEnvelopeAccessService.validateEnvelopeAccess.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.downloadDocument).toHaveBeenCalledWith(
        envelopeId,
        undefined
      );
      expect(result).toEqual(expectedResult);
    });

    it('should download document with only userId', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: DownloadDocumentInput = {
        envelopeId,
        userId
      };

      const expectedResult = {
        downloadUrl: 'https://s3.amazonaws.com/bucket/signed-document.pdf?signature=ghi789',
        expiresIn: 1800
      };

      mockSignatureEnvelopeService.downloadDocument.mockResolvedValue(expectedResult);
      mockEnvelopeAccessService.validateEnvelopeAccess.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.downloadDocument).toHaveBeenCalledWith(
        envelopeId,
        undefined
      );
      expect(result).toEqual(expectedResult);
    });

    it('should download document with only invitationToken', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const invitationToken = TestUtils.generateUuid();
      
      const input: DownloadDocumentInput = {
        envelopeId,
        invitationToken
      };

      const expectedResult = {
        downloadUrl: 'https://s3.amazonaws.com/bucket/signed-document.pdf?signature=jkl012',
        expiresIn: 1800
      };

      mockSignatureEnvelopeService.downloadDocument.mockResolvedValue(expectedResult);
      mockEnvelopeAccessService.validateEnvelopeAccess.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.downloadDocument).toHaveBeenCalledWith(
        envelopeId,
        undefined
      );
      expect(result).toEqual(expectedResult);
    });

    it('should download document with custom expiresIn', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const expiresIn = 7200;
      
      const input: DownloadDocumentInput = {
        envelopeId,
        userId,
        expiresIn
      };

      const expectedResult = {
        downloadUrl: 'https://s3.amazonaws.com/bucket/signed-document.pdf?signature=mno345',
        expiresIn: 7200
      };

      mockSignatureEnvelopeService.downloadDocument.mockResolvedValue(expectedResult);
      mockEnvelopeAccessService.validateEnvelopeAccess.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.downloadDocument).toHaveBeenCalledWith(
        envelopeId,
        expiresIn
      );
      expect(result).toEqual(expectedResult);
    });

    it('should download document with security context only', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: DownloadDocumentInput = {
        envelopeId,
        userId,
        securityContext: {
          ipAddress: TestUtils.createTestIpAddress(),
          userAgent: TestUtils.createTestUserAgent(),
          country: 'CA'
        }
      };

      const expectedResult = {
        downloadUrl: 'https://s3.amazonaws.com/bucket/signed-document.pdf?signature=pqr678',
        expiresIn: 1800
      };

      mockSignatureEnvelopeService.downloadDocument.mockResolvedValue(expectedResult);
      mockEnvelopeAccessService.validateEnvelopeAccess.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.downloadDocument).toHaveBeenCalledWith(
        envelopeId,
        undefined
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle service errors and rethrow', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: DownloadDocumentInput = {
        envelopeId,
        userId
      };

      const serviceError = new Error('Document not found');
      mockSignatureEnvelopeService.downloadDocument.mockRejectedValue(serviceError);

      await expect(useCase.execute(input)).rejects.toThrow('Document not found');
    });

    it('should handle access denied errors', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: DownloadDocumentInput = {
        envelopeId,
        userId
      };

      const accessError = new Error('Access denied');
      mockSignatureEnvelopeService.downloadDocument.mockRejectedValue(accessError);

      await expect(useCase.execute(input)).rejects.toThrow('Access denied');
    });

    it('should handle envelope not found errors', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: DownloadDocumentInput = {
        envelopeId,
        userId
      };

      const notFoundError = new Error('Envelope not found');
      mockSignatureEnvelopeService.downloadDocument.mockRejectedValue(notFoundError);

      await expect(useCase.execute(input)).rejects.toThrow('Envelope not found');
    });
  });
});
