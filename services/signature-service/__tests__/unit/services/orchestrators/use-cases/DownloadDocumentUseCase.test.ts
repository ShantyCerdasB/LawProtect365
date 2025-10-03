import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { DownloadDocumentUseCase } from '../../../../../src/services/orchestrators/use-cases/DownloadDocumentUseCase';
import { TestUtils } from '../../../../helpers/testUtils';
import { createSignatureEnvelopeServiceMock } from '../../../../helpers/mocks/services/SignatureEnvelopeService.mock';
import { createEnvelopeAccessServiceMock } from '../../../../helpers/mocks/services/EnvelopeAccessService.mock';
import { createAuditEventServiceMock } from '../../../../helpers/mocks/services/AuditEventService.mock';
import { 
  createDownloadDocumentTestData,
  createExpectedDownloadResult,
  setupDownloadDocumentMocks,
  executeDownloadDocumentTest,
  executeDownloadDocumentErrorTest,
  createMockConfiguration
} from '../../../../helpers/DownloadDocumentTestHelpers';

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
    let mockConfig: ReturnType<typeof createMockConfiguration>;

    beforeEach(() => {
      mockConfig = createMockConfiguration({
        signatureEnvelopeService: mockSignatureEnvelopeService,
        envelopeAccessService: mockEnvelopeAccessService,
        auditEventService: mockAuditEventService
      });
    });

    it('should download document successfully with all parameters', async () => {
      const testData = createDownloadDocumentTestData({
        expiresIn: 3600
      });
      const expectedResult = createExpectedDownloadResult('abc123', 3600);
      
      setupDownloadDocumentMocks(mockConfig, testData, expectedResult);
      await executeDownloadDocumentTest(testData, mockConfig, useCase, expectedResult);
    });

    it('should download document with minimal parameters', async () => {
      const testData = createDownloadDocumentTestData();
      const expectedResult = createExpectedDownloadResult('def456');
      
      setupDownloadDocumentMocks(mockConfig, testData, expectedResult);
      await executeDownloadDocumentTest(testData, mockConfig, useCase, expectedResult);
    });

    it('should download document with only userId', async () => {
      const testData = createDownloadDocumentTestData();
      const expectedResult = createExpectedDownloadResult('ghi789');
      
      setupDownloadDocumentMocks(mockConfig, testData, expectedResult);
      await executeDownloadDocumentTest(testData, mockConfig, useCase, expectedResult);
    });

    it('should download document with only invitationToken', async () => {
      const testData = createDownloadDocumentTestData({ userId: undefined });
      const expectedResult = createExpectedDownloadResult('jkl012');
      
      setupDownloadDocumentMocks(mockConfig, testData, expectedResult);
      await executeDownloadDocumentTest(testData, mockConfig, useCase, expectedResult);
    });

    it('should download document with custom expiresIn', async () => {
      const testData = createDownloadDocumentTestData({ expiresIn: 7200 });
      const expectedResult = createExpectedDownloadResult('mno345', 7200);
      
      setupDownloadDocumentMocks(mockConfig, testData, expectedResult);
      await executeDownloadDocumentTest(testData, mockConfig, useCase, expectedResult);
    });

    it('should download document with security context only', async () => {
      const testData = createDownloadDocumentTestData({
        securityContext: {
          ipAddress: TestUtils.createTestIpAddress(),
          userAgent: TestUtils.createTestUserAgent(),
          country: 'CA'
        }
      });
      const expectedResult = createExpectedDownloadResult('pqr678');
      
      setupDownloadDocumentMocks(mockConfig, testData, expectedResult);
      await executeDownloadDocumentTest(testData, mockConfig, useCase, expectedResult);
    });

    it('should handle service errors and rethrow', async () => {
      await executeDownloadDocumentErrorTest('service', 'Document not found', mockConfig, useCase);
    });

    it('should handle access denied errors', async () => {
      await executeDownloadDocumentErrorTest('access', 'Access denied', mockConfig, useCase);
    });

    it('should handle envelope not found errors', async () => {
      await executeDownloadDocumentErrorTest('notFound', 'Envelope not found', mockConfig, useCase);
    });

    it('should throw error when neither userId nor invitationToken is provided', async () => {
      await executeDownloadDocumentErrorTest('auth', 'Either userId or invitationToken must be provided', mockConfig, useCase);
    });
  });
});
