import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { SignDocumentUseCase } from '../../../../../src/services/orchestrators/use-cases/SignDocumentUseCase';
import { SignDocumentUseCaseInput, SignDocumentUseCaseResult } from '../../../../../src/domain/types/usecase/orchestrator/SignDocumentUseCase';
import { EnvelopeId } from '../../../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../../../src/domain/value-objects/SignerId';
import { ConsentId } from '../../../../../src/domain/value-objects/ConsentId';
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

// Mock the EntityFactory
jest.mock('../../../../../src/domain/factories/EntityFactory', () => ({
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
    mockEntityFactory = require('../../../../../src/domain/factories/EntityFactory').EntityFactory;
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
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const consentId = TestUtils.generateConsentId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SignDocumentUseCaseInput = {
        request: {
          envelopeId: envelopeId.getValue(),
          signerId: signerId.getValue(),
          invitationToken: 'token-123',
          consent: {
            given: true,
            timestamp: '2023-01-01T10:00:00Z',
            text: 'I consent to sign this document',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            country: 'US'
          },
          signedDocument: 'base64-encoded-document',
          documentHash: 'hash-123',
          signatureHash: 'signature-hash-123',
          s3Key: 's3-key-signed',
          kmsKeyId: 'kms-key-123',
          algorithm: 'RS256'
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const testSigner = { 
        getId: () => signerId, 
        getEmail: () => Email.fromString('signer@example.com'),
        getFullName: () => 'John Signer'
      } as EnvelopeSigner;
      const testConsent = { getId: () => consentId };
      const preparedDocument = {
        signedDocumentKey: 's3-key-signed',
        documentHash: 'hash-123'
      };
      const kmsResult = {
        signatureHash: 'signature-hash-123',
        kmsKeyId: 'kms-key-123',
        algorithm: 'RS256',
        signedAt: new Date('2023-01-01T10:00:00Z')
      };
      const expectedResult = {
        success: true,
        envelopeId: envelopeId.getValue(),
        signatureId: 'signature-123',
        signedAt: '2023-01-01T10:00:00Z'
      };

      mockEntityFactory.createValueObjects.envelopeId.mockReturnValue(envelopeId);
      mockEntityFactory.createValueObjects.signerId.mockReturnValue(signerId);
      mockEntityFactory.createValueObjects.consentId.mockReturnValue(consentId);
      mockSignatureEnvelopeService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockInvitationTokenService.markTokenAsSigned.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue({
        ...testEnvelope,
        getSigners: jest.fn().mockReturnValue([testSigner]),
        isCompleted: jest.fn().mockReturnValue(false)
      });
      mockConsentService.createConsent.mockResolvedValue(testConsent);
      (mockHandleSignedDocumentFromFrontend as any).mockResolvedValue(preparedDocument);
      mockKmsService.sign.mockResolvedValue(kmsResult);
      mockEnvelopeSignerService.markSignerAsSigned.mockResolvedValue(undefined);
      mockConsentService.linkConsentWithSignature.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.updateSignedDocument.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.updateHashes.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValueOnce({
        ...testEnvelope,
        isCompleted: jest.fn().mockReturnValue(false),
        getSigners: jest.fn().mockReturnValue([testSigner])
      });
      mockBuildSigningResponse.mockReturnValue(expectedResult);
      mockUuid.mockReturnValue('uuid-123');

      const result = await useCase.execute(input);

      expect(mockEntityFactory.createValueObjects.envelopeId).toHaveBeenCalledWith(input.request.envelopeId);
      expect(mockEntityFactory.createValueObjects.signerId).toHaveBeenCalledWith(input.request.signerId);
      expect(mockSignatureEnvelopeService.validateUserAccess).toHaveBeenCalledWith(
        envelopeId,
        userId,
        input.request.invitationToken
      );
      expect(mockInvitationTokenService.markTokenAsSigned).toHaveBeenCalledWith(
        input.request.invitationToken,
        signerId.getValue(),
        securityContext
      );
      expect(mockConsentService.createConsent).toHaveBeenCalledWith(
        expect.objectContaining({
          id: consentId,
          envelopeId,
          signerId,
          signatureId: undefined,
          consentGiven: input.request.consent.given,
          consentTimestamp: new Date(input.request.consent.timestamp),
          consentText: input.request.consent.text,
          ipAddress: input.request.consent.ipAddress,
          userAgent: input.request.consent.userAgent,
          country: input.request.consent.country
        }),
        userId
      );
      expect(mockHandleSignedDocumentFromFrontend).toHaveBeenCalledWith(
        mockS3Service,
        {
          envelopeId,
          signerId,
          signedDocumentBase64: input.request.signedDocument
        }
      );
      expect(mockKmsService.sign).toHaveBeenCalledWith({
        documentHash: preparedDocument.documentHash,
        kmsKeyId: process.env.KMS_SIGNER_KEY_ID,
        algorithm: 'RS256'
      });
      expect(mockEnvelopeSignerService.markSignerAsSigned).toHaveBeenCalledWith(
        signerId,
        {
          documentHash: preparedDocument.documentHash,
          signatureHash: kmsResult.signatureHash,
          signedS3Key: preparedDocument.signedDocumentKey,
          kmsKeyId: kmsResult.kmsKeyId,
          algorithm: kmsResult.algorithm,
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          consentText: input.request.consent.text
        }
      );
      expect(mockConsentService.linkConsentWithSignature).toHaveBeenCalledWith(consentId, signerId);
      expect(mockSignatureEnvelopeService.updateSignedDocument).toHaveBeenCalledWith(
        envelopeId,
        preparedDocument.signedDocumentKey,
        kmsResult.signatureHash,
        signerId.getValue(),
        userId
      );
      expect(mockSignatureEnvelopeService.updateHashes).toHaveBeenCalledWith(
        envelopeId,
        { sourceSha256: undefined, flattenedSha256: undefined, signedSha256: preparedDocument.documentHash },
        userId
      );
      expect(mockAuditEventService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          envelopeId: envelopeId.getValue(),
          signerId: signerId.getValue(),
          eventType: AuditEventType.SIGNER_SIGNED,
          description: `Document signed by ${testSigner.getFullName()}`,
          userId,
          userEmail: testSigner.getEmail()?.getValue(),
          networkContext: expect.objectContaining({
            ipAddress: securityContext.ipAddress,
            userAgent: securityContext.userAgent,
            country: securityContext.country
          }),
          metadata: expect.objectContaining({
            envelopeId: envelopeId.getValue(),
            signerId: signerId.getValue(),
            signatureId: 'uuid-123',
            signedDocumentKey: preparedDocument.signedDocumentKey,
            consentId: consentId.getValue(),
            documentHash: preparedDocument.documentHash,
            signatureHash: kmsResult.signatureHash,
            kmsKeyId: kmsResult.kmsKeyId
          })
        })
      );
      expect(mockBuildSigningResponse).toHaveBeenCalledWith(
        expect.any(Object),
        testEnvelope,
        { id: 'uuid-123', sha256: kmsResult.signatureHash, timestamp: kmsResult.signedAt.toISOString() },
        signerId,
        envelopeId
      );
      expect(result).toBe(expectedResult);
    });

    it('should sign document successfully with flattened document', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const consentId = TestUtils.generateConsentId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SignDocumentUseCaseInput = {
        request: {
          envelopeId: envelopeId.getValue(),
          signerId: signerId.getValue(),
          invitationToken: undefined,
          consent: {
            given: true,
            timestamp: '2023-01-01T10:00:00Z',
            text: 'I consent to sign this document'
          },
          flattenedKey: 's3-key-flattened',
          documentHash: 'hash-123',
          signatureHash: 'signature-hash-123',
          s3Key: 's3-key-signed',
          kmsKeyId: 'kms-key-123',
          algorithm: 'RS256'
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const testSigner = { 
        getId: () => signerId, 
        getEmail: () => Email.fromString('signer@example.com'),
        getFullName: () => 'John Signer'
      } as EnvelopeSigner;
      const testConsent = { getId: () => consentId };
      const preparedDocument = {
        signedDocumentKey: 's3-key-signed',
        documentHash: 'hash-123'
      };
      const kmsResult = {
        signatureHash: 'signature-hash-123',
        kmsKeyId: 'kms-key-123',
        algorithm: 'RS256',
        signedAt: new Date('2023-01-01T10:00:00Z')
      };
      const expectedResult = {
        success: true,
        envelopeId: envelopeId.getValue(),
        signatureId: 'signature-123',
        signedAt: '2023-01-01T10:00:00Z'
      };

      mockEntityFactory.createValueObjects.envelopeId.mockReturnValue(envelopeId);
      mockEntityFactory.createValueObjects.signerId.mockReturnValue(signerId);
      mockEntityFactory.createValueObjects.consentId.mockReturnValue(consentId);
      mockSignatureEnvelopeService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue({
        ...testEnvelope,
        getSigners: jest.fn().mockReturnValue([testSigner]),
        isCompleted: jest.fn().mockReturnValue(false)
      });
      mockConsentService.createConsent.mockResolvedValue(testConsent);
      (mockHandleFlattenedDocument as any).mockResolvedValue(preparedDocument);
      mockKmsService.sign.mockResolvedValue(kmsResult);
      mockEnvelopeSignerService.markSignerAsSigned.mockResolvedValue(undefined);
      mockConsentService.linkConsentWithSignature.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.updateSignedDocument.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.updateHashes.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValueOnce({
        ...testEnvelope,
        isCompleted: jest.fn().mockReturnValue(false),
        getSigners: jest.fn().mockReturnValue([testSigner])
      });
      mockBuildSigningResponse.mockReturnValue(expectedResult);
      mockUuid.mockReturnValue('uuid-123');

      const result = await useCase.execute(input);

      expect(mockHandleFlattenedDocument).toHaveBeenCalledWith(
        mockSignatureEnvelopeService,
        mockSignatureEnvelopeService, // envelopeHashService
        mockS3Service,
        {
          envelopeId,
          flattenedKey: input.request.flattenedKey,
          userId
        }
      );
      expect(mockInvitationTokenService.markTokenAsSigned).not.toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });

    it('should finalize envelope when all signers are complete', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const consentId = TestUtils.generateConsentId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SignDocumentUseCaseInput = {
        request: {
          envelopeId: envelopeId.getValue(),
          signerId: signerId.getValue(),
          invitationToken: undefined,
          consent: {
            given: true,
            timestamp: '2023-01-01T10:00:00Z',
            text: 'I consent to sign this document'
          },
          flattenedKey: 's3-key-flattened',
          documentHash: 'hash-123',
          signatureHash: 'signature-hash-123',
          s3Key: 's3-key-signed',
          kmsKeyId: 'kms-key-123',
          algorithm: 'RS256'
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const testSigner = { 
        getId: () => signerId, 
        getEmail: () => Email.fromString('signer@example.com'),
        getFullName: () => 'John Signer'
      } as EnvelopeSigner;
      const testConsent = { getId: () => consentId };
      const preparedDocument = {
        signedDocumentKey: 's3-key-signed',
        documentHash: 'hash-123'
      };
      const kmsResult = {
        signatureHash: 'signature-hash-123',
        kmsKeyId: 'kms-key-123',
        algorithm: 'RS256',
        signedAt: new Date('2023-01-01T10:00:00Z')
      };
      const completedEnvelope = { ...testEnvelope, isCompleted: jest.fn().mockReturnValue(true) };
      const expectedResult = {
        success: true,
        envelopeId: envelopeId.getValue(),
        signatureId: 'signature-123',
        signedAt: '2023-01-01T10:00:00Z'
      };

      mockEntityFactory.createValueObjects.envelopeId.mockReturnValue(envelopeId);
      mockEntityFactory.createValueObjects.signerId.mockReturnValue(signerId);
      mockEntityFactory.createValueObjects.consentId.mockReturnValue(consentId);
      mockSignatureEnvelopeService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners
        .mockResolvedValueOnce({ ...testEnvelope, getSigners: () => [testSigner] })
        .mockResolvedValueOnce(completedEnvelope)
        .mockResolvedValueOnce(completedEnvelope);
      mockConsentService.createConsent.mockResolvedValue(testConsent);
      (mockHandleFlattenedDocument as any).mockResolvedValue(preparedDocument);
      mockKmsService.sign.mockResolvedValue(kmsResult);
      mockEnvelopeSignerService.markSignerAsSigned.mockResolvedValue(undefined);
      mockConsentService.linkConsentWithSignature.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.updateSignedDocument.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.updateHashes.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.completeEnvelope.mockResolvedValue(undefined);
      mockBuildSigningResponse.mockReturnValue(expectedResult);
      mockUuid.mockReturnValue('uuid-123');

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.completeEnvelope).toHaveBeenCalledWith(envelopeId, userId);
      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).toHaveBeenCalledTimes(3);
      expect(result).toBe(expectedResult);
    });

    it('should handle consent with missing optional fields', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const consentId = TestUtils.generateConsentId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SignDocumentUseCaseInput = {
        request: {
          envelopeId: envelopeId.getValue(),
          signerId: signerId.getValue(),
          invitationToken: undefined,
          consent: {
            given: true,
            timestamp: '2023-01-01T10:00:00Z',
            text: 'I consent to sign this document'
            // Missing optional fields
          },
          flattenedKey: 's3-key-flattened',
          documentHash: 'hash-123',
          signatureHash: 'signature-hash-123',
          s3Key: 's3-key-signed',
          kmsKeyId: 'kms-key-123',
          algorithm: 'RS256'
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const testSigner = { 
        getId: () => signerId, 
        getEmail: () => Email.fromString('signer@example.com'),
        getFullName: () => 'John Signer'
      } as EnvelopeSigner;
      const testConsent = { getId: () => consentId };
      const preparedDocument = {
        signedDocumentKey: 's3-key-signed',
        documentHash: 'hash-123'
      };
      const kmsResult = {
        signatureHash: 'signature-hash-123',
        kmsKeyId: 'kms-key-123',
        algorithm: 'RS256',
        signedAt: new Date('2023-01-01T10:00:00Z')
      };
      const expectedResult = {
        success: true,
        envelopeId: envelopeId.getValue(),
        signatureId: 'signature-123',
        signedAt: '2023-01-01T10:00:00Z'
      };

      mockEntityFactory.createValueObjects.envelopeId.mockReturnValue(envelopeId);
      mockEntityFactory.createValueObjects.signerId.mockReturnValue(signerId);
      mockEntityFactory.createValueObjects.consentId.mockReturnValue(consentId);
      mockSignatureEnvelopeService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue({
        ...testEnvelope,
        getSigners: jest.fn().mockReturnValue([testSigner]),
        isCompleted: jest.fn().mockReturnValue(false)
      });
      mockConsentService.createConsent.mockResolvedValue(testConsent);
      (mockHandleFlattenedDocument as any).mockResolvedValue(preparedDocument);
      mockKmsService.sign.mockResolvedValue(kmsResult);
      mockEnvelopeSignerService.markSignerAsSigned.mockResolvedValue(undefined);
      mockConsentService.linkConsentWithSignature.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.updateSignedDocument.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.updateHashes.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValueOnce({
        ...testEnvelope,
        isCompleted: jest.fn().mockReturnValue(false),
        getSigners: jest.fn().mockReturnValue([testSigner])
      });
      mockBuildSigningResponse.mockReturnValue(expectedResult);
      mockUuid.mockReturnValue('uuid-123');

      const result = await useCase.execute(input);

      expect(mockConsentService.createConsent).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          country: securityContext.country
        }),
        userId
      );
      expect(result).toBe(expectedResult);
    });

    it('should throw error when envelope is not found', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SignDocumentUseCaseInput = {
        request: {
          envelopeId: envelopeId.getValue(),
          signerId: signerId.getValue(),
          invitationToken: undefined,
          consent: {
            given: true,
            timestamp: '2023-01-01T10:00:00Z',
            text: 'I consent to sign this document'
          },
          flattenedKey: 's3-key-flattened',
          documentHash: 'hash-123',
          signatureHash: 'signature-hash-123',
          s3Key: 's3-key-signed',
          kmsKeyId: 'kms-key-123',
          algorithm: 'RS256'
        },
        userId,
        securityContext
      };

      mockEntityFactory.createValueObjects.envelopeId.mockReturnValue(envelopeId);
      mockEntityFactory.createValueObjects.signerId.mockReturnValue(signerId);
      mockSignatureEnvelopeService.validateUserAccess.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow('Envelope not found');
    });

    it('should throw error when signer is not found', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SignDocumentUseCaseInput = {
        request: {
          envelopeId: envelopeId.getValue(),
          signerId: signerId.getValue(),
          invitationToken: undefined,
          consent: {
            given: true,
            timestamp: '2023-01-01T10:00:00Z',
            text: 'I consent to sign this document'
          },
          flattenedKey: 's3-key-flattened',
          documentHash: 'hash-123',
          signatureHash: 'signature-hash-123',
          s3Key: 's3-key-signed',
          kmsKeyId: 'kms-key-123',
          algorithm: 'RS256'
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });

      mockEntityFactory.createValueObjects.envelopeId.mockReturnValue(envelopeId);
      mockEntityFactory.createValueObjects.signerId.mockReturnValue(signerId);
      mockSignatureEnvelopeService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue({
        ...testEnvelope,
        getSigners: jest.fn().mockReturnValue([]), // No signers
        isCompleted: jest.fn().mockReturnValue(false)
      });

      await expect(useCase.execute(input)).rejects.toThrow('Signer with ID');
    });


    it('should throw error when consent creation fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const consentId = TestUtils.generateConsentId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SignDocumentUseCaseInput = {
        request: {
          envelopeId: envelopeId.getValue(),
          signerId: signerId.getValue(),
          invitationToken: undefined,
          consent: {
            given: true,
            timestamp: '2023-01-01T10:00:00Z',
            text: 'I consent to sign this document'
          },
          flattenedKey: 's3-key-flattened',
          documentHash: 'hash-123',
          signatureHash: 'signature-hash-123',
          s3Key: 's3-key-signed',
          kmsKeyId: 'kms-key-123',
          algorithm: 'RS256'
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const testSigner = { 
        getId: () => signerId, 
        getEmail: () => Email.fromString('signer@example.com'),
        getFullName: () => 'John Signer'
      } as EnvelopeSigner;

      mockEntityFactory.createValueObjects.envelopeId.mockReturnValue(envelopeId);
      mockEntityFactory.createValueObjects.signerId.mockReturnValue(signerId);
      mockEntityFactory.createValueObjects.consentId.mockReturnValue(consentId);
      mockSignatureEnvelopeService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue({
        ...testEnvelope,
        getSigners: jest.fn().mockReturnValue([testSigner]),
        isCompleted: jest.fn().mockReturnValue(false)
      });
      mockConsentService.createConsent.mockRejectedValue(new Error('Failed to create consent'));

      await expect(useCase.execute(input)).rejects.toThrow('Failed to create consent');
    });

    it('should throw error when document preparation fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const consentId = TestUtils.generateConsentId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SignDocumentUseCaseInput = {
        request: {
          envelopeId: envelopeId.getValue(),
          signerId: signerId.getValue(),
          invitationToken: undefined,
          consent: {
            given: true,
            timestamp: '2023-01-01T10:00:00Z',
            text: 'I consent to sign this document'
          },
          flattenedKey: 's3-key-flattened',
          documentHash: 'hash-123',
          signatureHash: 'signature-hash-123',
          s3Key: 's3-key-signed',
          kmsKeyId: 'kms-key-123',
          algorithm: 'RS256'
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const testSigner = { 
        getId: () => signerId, 
        getEmail: () => Email.fromString('signer@example.com'),
        getFullName: () => 'John Signer'
      } as EnvelopeSigner;
      const testConsent = { getId: () => consentId };

      mockEntityFactory.createValueObjects.envelopeId.mockReturnValue(envelopeId);
      mockEntityFactory.createValueObjects.signerId.mockReturnValue(signerId);
      mockEntityFactory.createValueObjects.consentId.mockReturnValue(consentId);
      mockSignatureEnvelopeService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue({
        ...testEnvelope,
        getSigners: jest.fn().mockReturnValue([testSigner]),
        isCompleted: jest.fn().mockReturnValue(false)
      });
      mockConsentService.createConsent.mockResolvedValue(testConsent);
      (mockHandleFlattenedDocument as any).mockRejectedValue(new Error('Failed to prepare document'));

      await expect(useCase.execute(input)).rejects.toThrow('Failed to prepare document');
    });

    it('should throw error when KMS signing fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const consentId = TestUtils.generateConsentId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SignDocumentUseCaseInput = {
        request: {
          envelopeId: envelopeId.getValue(),
          signerId: signerId.getValue(),
          invitationToken: undefined,
          consent: {
            given: true,
            timestamp: '2023-01-01T10:00:00Z',
            text: 'I consent to sign this document'
          },
          flattenedKey: 's3-key-flattened',
          documentHash: 'hash-123',
          signatureHash: 'signature-hash-123',
          s3Key: 's3-key-signed',
          kmsKeyId: 'kms-key-123',
          algorithm: 'RS256'
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const testSigner = { 
        getId: () => signerId, 
        getEmail: () => Email.fromString('signer@example.com'),
        getFullName: () => 'John Signer'
      } as EnvelopeSigner;
      const testConsent = { getId: () => consentId };
      const preparedDocument = {
        signedDocumentKey: 's3-key-signed',
        documentHash: 'hash-123'
      };

      mockEntityFactory.createValueObjects.envelopeId.mockReturnValue(envelopeId);
      mockEntityFactory.createValueObjects.signerId.mockReturnValue(signerId);
      mockEntityFactory.createValueObjects.consentId.mockReturnValue(consentId);
      mockSignatureEnvelopeService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue({
        ...testEnvelope,
        getSigners: jest.fn().mockReturnValue([testSigner]),
        isCompleted: jest.fn().mockReturnValue(false)
      });
      mockConsentService.createConsent.mockResolvedValue(testConsent);
      (mockHandleFlattenedDocument as any).mockResolvedValue(preparedDocument);
      mockKmsService.sign.mockRejectedValue(new Error('KMS signing failed'));

      await expect(useCase.execute(input)).rejects.toThrow('KMS signing failed');
    });

    it('should handle signer with missing optional fields', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const consentId = TestUtils.generateConsentId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SignDocumentUseCaseInput = {
        request: {
          envelopeId: envelopeId.getValue(),
          signerId: signerId.getValue(),
          invitationToken: undefined,
          consent: {
            given: true,
            timestamp: '2023-01-01T10:00:00Z',
            text: 'I consent to sign this document'
          },
          flattenedKey: 's3-key-flattened',
          documentHash: 'hash-123',
          signatureHash: 'signature-hash-123',
          s3Key: 's3-key-signed',
          kmsKeyId: 'kms-key-123',
          algorithm: 'RS256'
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const testSigner = { 
        getId: () => signerId, 
        getEmail: () => undefined, // Missing email
        getFullName: () => undefined // Missing full name
      } as EnvelopeSigner;
      const testConsent = { getId: () => consentId };
      const preparedDocument = {
        signedDocumentKey: 's3-key-signed',
        documentHash: 'hash-123'
      };
      const kmsResult = {
        signatureHash: 'signature-hash-123',
        kmsKeyId: 'kms-key-123',
        algorithm: 'RS256',
        signedAt: new Date('2023-01-01T10:00:00Z')
      };
      const expectedResult = {
        success: true,
        envelopeId: envelopeId.getValue(),
        signatureId: 'signature-123',
        signedAt: '2023-01-01T10:00:00Z'
      };

      mockEntityFactory.createValueObjects.envelopeId.mockReturnValue(envelopeId);
      mockEntityFactory.createValueObjects.signerId.mockReturnValue(signerId);
      mockEntityFactory.createValueObjects.consentId.mockReturnValue(consentId);
      mockSignatureEnvelopeService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue({
        ...testEnvelope,
        getSigners: jest.fn().mockReturnValue([testSigner]),
        isCompleted: jest.fn().mockReturnValue(false)
      });
      mockConsentService.createConsent.mockResolvedValue(testConsent);
      (mockHandleFlattenedDocument as any).mockResolvedValue(preparedDocument);
      mockKmsService.sign.mockResolvedValue(kmsResult);
      mockEnvelopeSignerService.markSignerAsSigned.mockResolvedValue(undefined);
      mockConsentService.linkConsentWithSignature.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.updateSignedDocument.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.updateHashes.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValueOnce({
        ...testEnvelope,
        isCompleted: jest.fn().mockReturnValue(false),
        getSigners: jest.fn().mockReturnValue([testSigner])
      });
      mockBuildSigningResponse.mockReturnValue(expectedResult);
      mockUuid.mockReturnValue('uuid-123');

      const result = await useCase.execute(input);

      expect(mockAuditEventService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Document signed by Unknown',
          userEmail: undefined
        })
      );
      expect(result).toBe(expectedResult);
    });
  });
});
