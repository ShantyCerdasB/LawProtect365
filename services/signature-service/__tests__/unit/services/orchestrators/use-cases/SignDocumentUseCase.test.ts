import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { generateTestIpAddress } from '../../../../integration/helpers/testHelpers';
import { SignDocumentUseCase } from '../../../../../src/services/orchestrators/use-cases/SignDocumentUseCase';
import { SignDocumentUseCaseInput } from '../../../../../src/domain/types/usecase/orchestrator/SignDocumentUseCase';
import { Email } from '@lawprotect/shared-ts';
import { AuditEventType } from '../../../../../src/domain/enums/AuditEventType';
import { TestUtils } from '../../../../helpers/testUtils';
import { createSignatureEnvelopeServiceMock } from '../../../../helpers/mocks/services/SignatureEnvelopeService.mock';
import { createEnvelopeSignerServiceMock } from '../../../../helpers/mocks/services/EnvelopeSignerService.mock';
import { createInvitationTokenServiceMock } from '../../../../helpers/mocks/services/InvitationTokenService.mock';
import { createConsentServiceMock } from '../../../../helpers/mocks/services/ConsentService.mock';
import { createS3ServiceMock } from '../../../../helpers/mocks/services/S3Service.mock';
import { createKmsServiceMock } from '../../../../helpers/mocks/services/KmsService.mock';
import { createAuditEventServiceMock } from '../../../../helpers/mocks/services/AuditEventService.mock';
import { signatureEnvelopeEntity } from '../../../../helpers/builders/signatureEnvelope';
import { EnvelopeSigner } from '../../../../../src/domain/entities/EnvelopeSigner';
import { 
  createSignDocumentTestData, 
  createSignDocumentInput, 
  setupSignDocumentMocks,
  SIGN_DOCUMENT_TEST_SCENARIOS,
  createErrorScenarioData,
  createEdgeCaseData
} from '../../../../helpers/SignDocumentUseCaseTestHelpers';

// Mock the EntityFactory
jest.mock('../../../../../src/infrastructure/factories/EntityFactory', () => ({
  EntityFactory: {
    createValueObjects: {
      envelopeId: jest.fn(),
      signerId: jest.fn(),
      consentId: jest.fn()
    }
  }
}));

// Mock the SigningFlowValidationRule
jest.mock('../../../../../src/domain/rules/SigningFlowValidationRule', () => ({
  SigningFlowValidationRule: jest.fn().mockImplementation(() => ({
    validateSigningFlow: jest.fn()
  }))
}));

// Mock the orchestrator utilities
jest.mock('../../../../../src/services/orchestrators', () => ({
  buildSigningResponse: jest.fn(),
  handleSignedDocumentFromFrontend: jest.fn(),
  handleFlattenedDocument: jest.fn()
}));

// Mock the signing algorithm enum
jest.mock('../../../../../src/domain/enums/SigningAlgorithmEnum', () => ({
  getDefaultSigningAlgorithm: jest.fn(() => 'RS256')
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn()
}));

describe('SignDocumentUseCase', () => {
  let useCase: SignDocumentUseCase;
  let mockSignatureEnvelopeService: any;
  let mockEnvelopeSignerService: any;
  let mockInvitationTokenService: any;
  let mockConsentService: any;
  let mockS3Service: any;
  let mockKmsService: any;
  let mockAuditEventService: any;
  let mockEntityFactory: any;
  let mockBuildSigningResponse: jest.Mock;
  let mockHandleSignedDocumentFromFrontend: jest.Mock;
  let mockHandleFlattenedDocument: jest.Mock;
  let mockUuid: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSignatureEnvelopeService = createSignatureEnvelopeServiceMock();
    mockEnvelopeSignerService = createEnvelopeSignerServiceMock();
    mockInvitationTokenService = createInvitationTokenServiceMock();
    mockConsentService = createConsentServiceMock();
    mockS3Service = createS3ServiceMock();
    mockKmsService = createKmsServiceMock();
    mockAuditEventService = createAuditEventServiceMock();

    // Get references to mocked functions
    mockEntityFactory = require('../../../../../src/infrastructure/factories/EntityFactory').EntityFactory;
    mockBuildSigningResponse = require('../../../../../src/services/orchestrators').buildSigningResponse as jest.Mock;
    mockHandleSignedDocumentFromFrontend = require('../../../../../src/services/orchestrators').handleSignedDocumentFromFrontend as jest.Mock;
    mockHandleFlattenedDocument = require('../../../../../src/services/orchestrators').handleFlattenedDocument as jest.Mock;
    mockUuid = require('uuid').v4;

    // Reset the mock implementation for SigningFlowValidationRule
    const { SigningFlowValidationRule } = require('../../../../../src/domain/rules/SigningFlowValidationRule');
    jest.mocked(SigningFlowValidationRule).mockImplementation(() => ({
      validateSigningFlow: jest.fn()
    }));

    useCase = new SignDocumentUseCase(
      mockSignatureEnvelopeService,
      mockEnvelopeSignerService,
      mockInvitationTokenService,
      mockConsentService,
      mockS3Service,
      mockKmsService,
      mockAuditEventService,
      mockSignatureEnvelopeService, // envelopeHashService
      mockSignatureEnvelopeService, // envelopeAccessService
      mockSignatureEnvelopeService  // envelopeStateService
    );
  });

  describe('execute', () => {
    it('should sign document successfully with frontend-signed document', async () => {
      const testData = createSignDocumentTestData();
      const input = createSignDocumentInput(testData, {
        request: {
          invitationToken: 'token-123',
          consent: {
            given: true,
            timestamp: '2023-01-01T10:00:00Z',
            text: 'I consent to sign this document',
            ipAddress: generateTestIpAddress(),
            userAgent: 'Mozilla/5.0',
            country: 'US'
          },
          signedDocument: 'base64-encoded-document',
          documentHash: 'hash-123',
          signatureHash: 'signature-hash-123',
          s3Key: 's3-key-signed',
          kmsKeyId: 'kms-key-123',
          algorithm: 'RS256'
        }
      });

      setupSignDocumentMocks({
        entityFactory: mockEntityFactory,
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        consentService: mockConsentService,
        kmsService: mockKmsService,
        envelopeSignerService: mockEnvelopeSignerService,
        auditEventService: mockAuditEventService,
        handleSignedDocumentFromFrontend: mockHandleSignedDocumentFromFrontend,
        handleFlattenedDocument: mockHandleFlattenedDocument,
        buildSigningResponse: mockBuildSigningResponse,
        uuid: mockUuid
      }, testData);

      mockInvitationTokenService.markTokenAsSigned.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValueOnce({
        ...testData.testEnvelope,
        isCompleted: jest.fn().mockReturnValue(false),
        getSigners: jest.fn().mockReturnValue([testData.testSigner])
      });

      const result = await useCase.execute(input);

      expect(mockEntityFactory.createValueObjects.envelopeId).toHaveBeenCalledWith(input.request.envelopeId);
      expect(mockEntityFactory.createValueObjects.signerId).toHaveBeenCalledWith(input.request.signerId);
      expect(mockSignatureEnvelopeService.validateUserAccess).toHaveBeenCalledWith(
        testData.envelopeId,
        testData.userId,
        input.request.invitationToken
      );
      expect(mockInvitationTokenService.markTokenAsSigned).toHaveBeenCalledWith(
        input.request.invitationToken,
        testData.signerId.getValue(),
        testData.securityContext
      );
      expect(mockConsentService.createConsent).toHaveBeenCalledWith(
        expect.objectContaining({
          id: testData.consentId,
          envelopeId: testData.envelopeId,
          signerId: testData.signerId,
          signatureId: undefined,
          consentGiven: input.request.consent.given,
          consentTimestamp: new Date(input.request.consent.timestamp),
          consentText: input.request.consent.text,
          ipAddress: input.request.consent.ipAddress,
          userAgent: input.request.consent.userAgent,
          country: input.request.consent.country
        }),
        testData.userId
      );
      expect(mockHandleSignedDocumentFromFrontend).toHaveBeenCalledWith(
        mockS3Service,
        {
          envelopeId: testData.envelopeId,
          signerId: testData.signerId,
          signedDocumentBase64: input.request.signedDocument
        }
      );
      expect(mockKmsService.sign).toHaveBeenCalledWith({
        documentHash: testData.preparedDocument.documentHash,
        kmsKeyId: process.env.KMS_SIGNER_KEY_ID,
        algorithm: 'RS256'
      });
      expect(mockEnvelopeSignerService.markSignerAsSigned).toHaveBeenCalledWith(
        testData.signerId,
        {
          documentHash: testData.preparedDocument.documentHash,
          signatureHash: testData.kmsResult.signatureHash,
          signedS3Key: testData.preparedDocument.signedDocumentKey,
          kmsKeyId: testData.kmsResult.kmsKeyId,
          algorithm: testData.kmsResult.algorithm,
          ipAddress: testData.securityContext.ipAddress,
          userAgent: testData.securityContext.userAgent,
          consentText: input.request.consent.text
        }
      );
      expect(mockConsentService.linkConsentWithSignature).toHaveBeenCalledWith(testData.consentId, testData.signerId);
      expect(mockSignatureEnvelopeService.updateSignedDocument).toHaveBeenCalledWith(
        testData.envelopeId,
        testData.preparedDocument.signedDocumentKey,
        testData.kmsResult.signatureHash,
        testData.signerId.getValue(),
        testData.userId
      );
      expect(mockSignatureEnvelopeService.updateHashes).toHaveBeenCalledWith(
        testData.envelopeId,
        { sourceSha256: undefined, flattenedSha256: undefined, signedSha256: testData.preparedDocument.documentHash },
        testData.userId
      );
      expect(mockAuditEventService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          envelopeId: testData.envelopeId.getValue(),
          signerId: testData.signerId.getValue(),
          eventType: AuditEventType.SIGNER_SIGNED,
          description: `Document signed by ${testData.testSigner.getFullName()}`,
          userId: testData.userId,
          userEmail: testData.testSigner.getEmail()?.getValue(),
          networkContext: expect.objectContaining({
            ipAddress: testData.securityContext.ipAddress,
            userAgent: testData.securityContext.userAgent,
            country: testData.securityContext.country
          }),
          metadata: expect.objectContaining({
            envelopeId: testData.envelopeId.getValue(),
            signerId: testData.signerId.getValue(),
            signatureId: 'uuid-123',
            signedDocumentKey: testData.preparedDocument.signedDocumentKey,
            consentId: testData.consentId.getValue(),
            documentHash: testData.preparedDocument.documentHash,
            signatureHash: testData.kmsResult.signatureHash,
            kmsKeyId: testData.kmsResult.kmsKeyId
          })
        })
      );
      expect(mockBuildSigningResponse).toHaveBeenCalledWith(
        expect.any(Object),
        testData.testEnvelope,
        { id: 'uuid-123', sha256: testData.kmsResult.signatureHash, timestamp: testData.kmsResult.signedAt.toISOString() },
        testData.signerId,
        testData.envelopeId
      );
      expect(result).toBe(testData.expectedResult);
    });

    it('should sign document successfully with flattened document', async () => {
      const testData = createSignDocumentTestData();
      const input = createSignDocumentInput(testData);

      setupSignDocumentMocks({
        entityFactory: mockEntityFactory,
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        consentService: mockConsentService,
        kmsService: mockKmsService,
        envelopeSignerService: mockEnvelopeSignerService,
        auditEventService: mockAuditEventService,
        handleSignedDocumentFromFrontend: mockHandleSignedDocumentFromFrontend,
        handleFlattenedDocument: mockHandleFlattenedDocument,
        buildSigningResponse: mockBuildSigningResponse,
        uuid: mockUuid
      }, testData);

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValueOnce({
        ...testData.testEnvelope,
        isCompleted: jest.fn().mockReturnValue(false),
        getSigners: jest.fn().mockReturnValue([testData.testSigner])
      });

      const result = await useCase.execute(input);

      expect(mockHandleFlattenedDocument).toHaveBeenCalledWith(
        mockSignatureEnvelopeService,
        mockSignatureEnvelopeService, // envelopeHashService
        mockS3Service,
        {
          envelopeId: testData.envelopeId,
          flattenedKey: input.request.flattenedKey,
          userId: testData.userId
        }
      );
      expect(mockInvitationTokenService.markTokenAsSigned).not.toHaveBeenCalled();
      expect(result).toBe(testData.expectedResult);
    });

    it('should finalize envelope when all signers are complete', async () => {
      const testData = createSignDocumentTestData();
      const input = createSignDocumentInput(testData);
      const completedEnvelope = { ...testData.testEnvelope, isCompleted: jest.fn().mockReturnValue(true) };

      setupSignDocumentMocks({
        entityFactory: mockEntityFactory,
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        consentService: mockConsentService,
        kmsService: mockKmsService,
        envelopeSignerService: mockEnvelopeSignerService,
        auditEventService: mockAuditEventService,
        handleSignedDocumentFromFrontend: mockHandleSignedDocumentFromFrontend,
        handleFlattenedDocument: mockHandleFlattenedDocument,
        buildSigningResponse: mockBuildSigningResponse,
        uuid: mockUuid
      }, testData);

      mockSignatureEnvelopeService.getEnvelopeWithSigners
        .mockResolvedValueOnce({ ...testData.testEnvelope, getSigners: () => [testData.testSigner] })
        .mockResolvedValueOnce(completedEnvelope)
        .mockResolvedValueOnce(completedEnvelope);
      mockSignatureEnvelopeService.completeEnvelope.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.completeEnvelope).toHaveBeenCalledWith(testData.envelopeId, testData.userId);
      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).toHaveBeenCalledTimes(3);
      expect(result).toBe(testData.expectedResult);
    });

    it('should handle consent with missing optional fields', async () => {
      const edgeCaseData = createEdgeCaseData('missing-consent-fields');
      const input = createSignDocumentInput(edgeCaseData, edgeCaseData.inputOverrides);

      setupSignDocumentMocks({
        entityFactory: mockEntityFactory,
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        consentService: mockConsentService,
        kmsService: mockKmsService,
        envelopeSignerService: mockEnvelopeSignerService,
        auditEventService: mockAuditEventService,
        handleSignedDocumentFromFrontend: mockHandleSignedDocumentFromFrontend,
        handleFlattenedDocument: mockHandleFlattenedDocument,
        buildSigningResponse: mockBuildSigningResponse,
        uuid: mockUuid
      }, edgeCaseData);

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValueOnce({
        ...edgeCaseData.testEnvelope,
        isCompleted: jest.fn().mockReturnValue(false),
        getSigners: jest.fn().mockReturnValue([edgeCaseData.testSigner])
      });

      const result = await useCase.execute(input);

      expect(mockConsentService.createConsent).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: edgeCaseData.securityContext.ipAddress,
          userAgent: edgeCaseData.securityContext.userAgent,
          country: edgeCaseData.securityContext.country
        }),
        edgeCaseData.userId
      );
      expect(result).toBe(edgeCaseData.expectedResult);
    });

    it('should throw error when envelope is not found', async () => {
      const errorData = createErrorScenarioData('envelope');
      const input = createSignDocumentInput(errorData);

      setupSignDocumentMocks({
        entityFactory: mockEntityFactory,
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        consentService: mockConsentService,
        kmsService: mockKmsService,
        envelopeSignerService: mockEnvelopeSignerService,
        auditEventService: mockAuditEventService,
        handleSignedDocumentFromFrontend: mockHandleSignedDocumentFromFrontend,
        handleFlattenedDocument: mockHandleFlattenedDocument,
        buildSigningResponse: mockBuildSigningResponse,
        uuid: mockUuid
      }, errorData, errorData.mockOverrides);

      await expect(useCase.execute(input)).rejects.toThrow('Envelope not found');
    });

    it('should throw error when signer is not found', async () => {
      const errorData = createErrorScenarioData('signer');
      const input = createSignDocumentInput(errorData);

      setupSignDocumentMocks({
        entityFactory: mockEntityFactory,
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        consentService: mockConsentService,
        kmsService: mockKmsService,
        envelopeSignerService: mockEnvelopeSignerService,
        auditEventService: mockAuditEventService,
        handleSignedDocumentFromFrontend: mockHandleSignedDocumentFromFrontend,
        handleFlattenedDocument: mockHandleFlattenedDocument,
        buildSigningResponse: mockBuildSigningResponse,
        uuid: mockUuid
      }, errorData, errorData.mockOverrides);

      await expect(useCase.execute(input)).rejects.toThrow('Signer with ID');
    });


    it('should throw error when consent creation fails', async () => {
      const errorData = createErrorScenarioData('consent');
      const input = createSignDocumentInput(errorData);

      setupSignDocumentMocks({
        entityFactory: mockEntityFactory,
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        consentService: mockConsentService,
        kmsService: mockKmsService,
        envelopeSignerService: mockEnvelopeSignerService,
        auditEventService: mockAuditEventService,
        handleSignedDocumentFromFrontend: mockHandleSignedDocumentFromFrontend,
        handleFlattenedDocument: mockHandleFlattenedDocument,
        buildSigningResponse: mockBuildSigningResponse,
        uuid: mockUuid
      }, errorData, errorData.mockOverrides);

      await expect(useCase.execute(input)).rejects.toThrow('Failed to create consent');
    });

    it('should throw error when document preparation fails', async () => {
      const errorData = createErrorScenarioData('document');
      const input = createSignDocumentInput(errorData);

      setupSignDocumentMocks({
        entityFactory: mockEntityFactory,
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        consentService: mockConsentService,
        kmsService: mockKmsService,
        envelopeSignerService: mockEnvelopeSignerService,
        auditEventService: mockAuditEventService,
        handleSignedDocumentFromFrontend: mockHandleSignedDocumentFromFrontend,
        handleFlattenedDocument: mockHandleFlattenedDocument,
        buildSigningResponse: mockBuildSigningResponse,
        uuid: mockUuid
      }, errorData, errorData.mockOverrides);

      await expect(useCase.execute(input)).rejects.toThrow('Failed to prepare document');
    });

    it('should throw error when KMS signing fails', async () => {
      const errorData = createErrorScenarioData('kms');
      const input = createSignDocumentInput(errorData);

      setupSignDocumentMocks({
        entityFactory: mockEntityFactory,
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        consentService: mockConsentService,
        kmsService: mockKmsService,
        envelopeSignerService: mockEnvelopeSignerService,
        auditEventService: mockAuditEventService,
        handleSignedDocumentFromFrontend: mockHandleSignedDocumentFromFrontend,
        handleFlattenedDocument: mockHandleFlattenedDocument,
        buildSigningResponse: mockBuildSigningResponse,
        uuid: mockUuid
      }, errorData, errorData.mockOverrides);

      await expect(useCase.execute(input)).rejects.toThrow('KMS signing failed');
    });

    it('should handle signer with missing optional fields', async () => {
      const edgeCaseData = createEdgeCaseData('missing-signer-fields');
      const input = createSignDocumentInput(edgeCaseData);

      setupSignDocumentMocks({
        entityFactory: mockEntityFactory,
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        consentService: mockConsentService,
        kmsService: mockKmsService,
        envelopeSignerService: mockEnvelopeSignerService,
        auditEventService: mockAuditEventService,
        handleSignedDocumentFromFrontend: mockHandleSignedDocumentFromFrontend,
        handleFlattenedDocument: mockHandleFlattenedDocument,
        buildSigningResponse: mockBuildSigningResponse,
        uuid: mockUuid
      }, edgeCaseData);

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValueOnce({
        ...edgeCaseData.testEnvelope,
        isCompleted: jest.fn().mockReturnValue(false),
        getSigners: jest.fn().mockReturnValue([edgeCaseData.testSigner])
      });

      const result = await useCase.execute(input);

      expect(mockAuditEventService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Document signed by Unknown',
          userEmail: undefined
        })
      );
      expect(result).toBe(edgeCaseData.expectedResult);
    });
  });
});
