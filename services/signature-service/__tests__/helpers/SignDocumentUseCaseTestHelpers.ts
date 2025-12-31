/**
 * @fileoverview SignDocumentUseCase Test Helpers - Reusable test utilities for SignDocumentUseCase tests
 * @summary Helper functions for testing SignDocumentUseCase functionality
 * @description This module provides reusable helper functions for creating test data,
 * setting up mocks, and handling common test scenarios in SignDocumentUseCase tests.
 * These helpers eliminate code duplication and improve test maintainability.
 */

import { TestUtils } from './testUtils';
import { signatureEnvelopeEntity } from './builders/signatureEnvelope';
import { Email } from '@lawprotect/shared-ts';
import { EnvelopeSigner } from '../../src/domain/entities/EnvelopeSigner';
import { SignDocumentUseCaseInput } from '../../src/domain/types/usecase/orchestrator/SignDocumentUseCase';
import { EnvelopeSignerBuilder } from './builders/EnvelopeSignerBuilder';
import { SignerStatus } from '@prisma/client';
import { SignatureEnvelopeBuilder } from './builders/SignatureEnvelopeBuilder';
import { EnvelopeStatus } from '../../src/domain/value-objects/EnvelopeStatus';

/**
 * Interface for test data overrides
 */
export interface SignDocumentTestDataOverrides {
  envelopeId?: string;
  signerId?: string;
  consentId?: string;
  userId?: string;
  securityContext?: {
    ipAddress?: string;
    userAgent?: string;
    country?: string;
  };
  request?: {
    invitationToken?: string;
    consent?: {
      given?: boolean;
      timestamp?: string;
      text?: string;
      ipAddress?: string;
      userAgent?: string;
      country?: string;
    };
    flattenedKey?: string;
    documentHash?: string;
    signatureHash?: string;
    s3Key?: string;
    kmsKeyId?: string;
    algorithm?: string;
    signedDocument?: string;
  };
}

/**
 * Interface for mock setup overrides
 */
export interface SignDocumentMockOverrides {
  validateUserAccess?: any;
  getEnvelopeWithSigners?: any;
  createConsent?: any;
  markTokenAsSigned?: any;
  handleSignedDocumentFromFrontend?: any;
  handleFlattenedDocument?: any;
  sign?: any;
  markSignerAsSigned?: any;
  linkConsentWithSignature?: any;
  updateSignedDocument?: any;
  updateHashes?: any;
  create?: any;
  completeEnvelope?: any;
  buildSigningResponse?: any;
  uuid?: string;
}

/**
 * Creates test data for SignDocumentUseCase tests with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns Complete test data object
 * @example
 * const testData = createSignDocumentTestData({ 
 *   request: { invitationToken: 'token-123' }
 * });
 */
export function createSignDocumentTestData(overrides: SignDocumentTestDataOverrides = {}) {
  const envelopeId = TestUtils.generateEnvelopeId();
  const signerId = TestUtils.generateSignerId();
  const consentId = TestUtils.generateConsentId();
  const userId = TestUtils.generateUuid();
  
  const securityContext = {
    ipAddress: TestUtils.createTestIpAddress(),
    userAgent: TestUtils.createTestUserAgent(),
    country: 'US',
    ...overrides.securityContext
  };

  const testSigner = EnvelopeSignerBuilder.create()
    .withId(signerId)
    .withEnvelopeId(envelopeId)
    .withUserId(userId)
    .withEmail('signer@example.com')
    .withFullName('John Signer')
    .withIsExternal(false)
    .withStatus(SignerStatus.PENDING)
    .build();
  
  const testEnvelope = SignatureEnvelopeBuilder.create()
    .withId(envelopeId)
    .withCreatedBy(userId)
    .withStatus(EnvelopeStatus.readyForSignature())
    .withSigners([testSigner])
    .build();
  
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

  return {
    envelopeId,
    signerId,
    consentId,
    userId,
    securityContext,
    testEnvelope,
    testSigner,
    testConsent,
    preparedDocument,
    kmsResult,
    expectedResult
  };
}

/**
 * Creates SignDocumentUseCaseInput with sensible defaults
 * @param testData - Test data from createSignDocumentTestData
 * @param overrides - Partial data to override defaults
 * @returns SignDocumentUseCaseInput object
 * @example
 * const input = createSignDocumentInput(testData, { 
 *   request: { invitationToken: 'token-123' }
 * });
 */
export function createSignDocumentInput(
  testData: ReturnType<typeof createSignDocumentTestData>,
  overrides: SignDocumentTestDataOverrides = {}
): SignDocumentUseCaseInput {
  const defaultRequest = {
    envelopeId: testData.envelopeId.getValue(),
    signerId: testData.signerId.getValue(),
    invitationToken: undefined,
    consent: {
      given: true,
      timestamp: '2023-01-01T10:00:00Z',
      text: 'I consent to sign this document',
      ipAddress: testData.securityContext.ipAddress,
      userAgent: testData.securityContext.userAgent,
      country: testData.securityContext.country
    },
    flattenedKey: 's3-key-flattened',
    documentHash: 'hash-123',
    signatureHash: 'signature-hash-123',
    s3Key: 's3-key-signed',
    kmsKeyId: 'kms-key-123',
    algorithm: 'RS256'
  };

  const mergedRequest = {
    ...defaultRequest,
    ...overrides.request,
    consent: {
      ...defaultRequest.consent,
      ...overrides.request?.consent
    }
  };

  return {
    request: mergedRequest,
    userId: testData.userId,
    securityContext: testData.securityContext
  };
}

/**
 * Sets up all mocks for SignDocumentUseCase tests
 * @param mocks - Mock objects from test setup
 * @param testData - Test data from createSignDocumentTestData
 * @param overrides - Partial mock overrides
 * @example
 * setupSignDocumentMocks(mocks, testData, { 
 *   validateUserAccess: mockEnvelope
 * });
 */
export function setupSignDocumentMocks(
  mocks: {
    entityFactory: any;
    signatureEnvelopeService: any;
    invitationTokenService: any;
    consentService: any;
    kmsService: any;
    envelopeSignerService: any;
    auditEventService: any;
    handleSignedDocumentFromFrontend: any;
    handleFlattenedDocument: any;
    buildSigningResponse: any;
    uuid: any;
    pdfEmbedder?: any;
    s3Service?: any;
  },
  testData: ReturnType<typeof createSignDocumentTestData>,
  overrides: SignDocumentMockOverrides = {}
): void {
  // Entity Factory mocks
  mocks.entityFactory.createValueObjects.envelopeId.mockReturnValue(testData.envelopeId);
  mocks.entityFactory.createValueObjects.signerId.mockReturnValue(testData.signerId);
  mocks.entityFactory.createValueObjects.consentId.mockReturnValue(testData.consentId);

  // Service mocks
  if (overrides.validateUserAccess !== undefined) {
    mocks.signatureEnvelopeService.validateUserAccess.mockResolvedValue(overrides.validateUserAccess);
  } else {
    mocks.signatureEnvelopeService.validateUserAccess.mockResolvedValue(testData.testEnvelope);
  }
  
  if (overrides.getEnvelopeWithSigners !== undefined) {
    mocks.signatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(overrides.getEnvelopeWithSigners);
  } else {
    mocks.signatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testData.testEnvelope);
  }
  
  if (overrides.createConsent instanceof Error) {
    mocks.consentService.createConsent.mockRejectedValue(overrides.createConsent);
  } else {
    mocks.consentService.createConsent.mockResolvedValue(
      overrides.createConsent || testData.testConsent
    );
  }
  
  if (overrides.sign instanceof Error) {
    mocks.kmsService.sign.mockRejectedValue(overrides.sign);
  } else {
    mocks.kmsService.sign.mockResolvedValue(
      overrides.sign || testData.kmsResult
    );
  }
  
  if (mocks.kmsService.getCertificateChain) {
    mocks.kmsService.getCertificateChain.mockResolvedValue([]);
  }
  
  
  mocks.envelopeSignerService.markSignerAsSigned.mockResolvedValue(
    overrides.markSignerAsSigned || undefined
  );
  
  mocks.consentService.linkConsentWithSignature.mockResolvedValue(
    overrides.linkConsentWithSignature || undefined
  );
  
  mocks.signatureEnvelopeService.updateSignedDocument.mockResolvedValue(
    overrides.updateSignedDocument || undefined
  );
  
  mocks.signatureEnvelopeService.updateHashes.mockResolvedValue(
    overrides.updateHashes || undefined
  );
  
  mocks.auditEventService.create.mockResolvedValue(
    overrides.create || undefined
  );
  
  // Utility mocks
  mocks.handleSignedDocumentFromFrontend.mockResolvedValue(
    overrides.handleSignedDocumentFromFrontend || testData.preparedDocument
  );
  
  if (overrides.handleFlattenedDocument instanceof Error) {
    mocks.handleFlattenedDocument.mockRejectedValue(overrides.handleFlattenedDocument);
  } else {
    mocks.handleFlattenedDocument.mockResolvedValue(
      overrides.handleFlattenedDocument || testData.preparedDocument
    );
  }
  
  mocks.buildSigningResponse.mockReturnValue(
    overrides.buildSigningResponse || testData.expectedResult
  );
  
  mocks.uuid.mockReturnValue(
    overrides.uuid || 'uuid-123'
  );

  // S3Service mocks
  if (mocks.s3Service) {
    mocks.s3Service.storeSignedDocument.mockResolvedValue({
      documentKey: testData.preparedDocument.signedDocumentKey,
      s3Location: `s3://bucket/${testData.preparedDocument.signedDocumentKey}`,
      contentType: 'application/pdf',
      size: 1024
    });
  }

  // PdfEmbedder mocks
  if (mocks.pdfEmbedder) {
    mocks.pdfEmbedder.embedSignature.mockResolvedValue({
      signedPdfContent: Buffer.from('mock-pdf-content'),
      signatureFieldName: 'Signature1'
    });
  }
}

/**
 * Creates a standardized mock configuration object for SignDocumentUseCase tests
 * @param mocks - Mock objects from test setup
 * @returns Standardized mock configuration object
 * @example
 * const mockConfig = createMockConfiguration(mocks);
 */
export function createMockConfiguration(mocks: {
  entityFactory: any;
  signatureEnvelopeService: any;
  invitationTokenService: any;
  consentService: any;
  kmsService: any;
  envelopeSignerService: any;
  auditEventService: any;
  handleSignedDocumentFromFrontend: any;
  handleFlattenedDocument: any;
  buildSigningResponse: any;
  uuid: any;
  pdfEmbedder?: any;
  s3Service?: any;
}) {
  return {
    entityFactory: mocks.entityFactory,
    signatureEnvelopeService: mocks.signatureEnvelopeService,
    invitationTokenService: mocks.invitationTokenService,
    consentService: mocks.consentService,
    kmsService: mocks.kmsService,
    envelopeSignerService: mocks.envelopeSignerService,
    auditEventService: mocks.auditEventService,
    handleSignedDocumentFromFrontend: mocks.handleSignedDocumentFromFrontend,
    handleFlattenedDocument: mocks.handleFlattenedDocument,
    buildSigningResponse: mocks.buildSigningResponse,
    uuid: mocks.uuid,
    pdfEmbedder: mocks.pdfEmbedder,
    s3Service: mocks.s3Service
  };
}

/**
 * Executes a complete error test scenario with standardized setup
 * @param scenario - Error scenario type
 * @param expectedMessage - Expected error message
 * @param mockConfig - Mock configuration object
 * @param useCase - Use case instance to test
 * @example
 * await executeErrorTest('envelope', 'Envelope not found', mockConfig, useCase);
 */
export async function executeErrorTest(
  scenario: 'envelope' | 'signer' | 'consent' | 'document' | 'kms',
  expectedMessage: string,
  mockConfig: ReturnType<typeof createMockConfiguration>,
  useCase: any
): Promise<void> {
  const errorData = createErrorScenarioData(scenario);
  const input = createSignDocumentInput(errorData);
  
  setupSignDocumentMocks(mockConfig, errorData, errorData.mockOverrides);
  
  await expect(useCase.execute(input)).rejects.toThrow(expectedMessage);
}

/**
 * Creates test scenarios for parametrized testing
 */
export const SIGN_DOCUMENT_TEST_SCENARIOS = {
  successScenarios: [
    { 
      name: 'frontend-signed document', 
      hasInvitationToken: true,
      documentType: 'frontend' as const
    },
    { 
      name: 'flattened document', 
      hasInvitationToken: false,
      documentType: 'flattened' as const
    },
    { 
      name: 'finalize envelope', 
      hasInvitationToken: false,
      documentType: 'flattened' as const,
      isCompleted: true
    }
  ],
  
  errorScenarios: [
    { name: 'envelope not found', errorType: 'envelope' as const, message: 'Envelope not found' },
    { name: 'signer not found', errorType: 'signer' as const, message: 'Signer with ID' },
    { name: 'consent creation fails', errorType: 'consent' as const, message: 'Failed to create consent' },
    { name: 'document preparation fails', errorType: 'document' as const, message: 'Failed to prepare document' },
    { name: 'KMS signing fails', errorType: 'kms' as const, message: 'KMS signing failed' }
  ],
  
  edgeCaseScenarios: [
    { name: 'missing optional consent fields', missingFields: ['ipAddress', 'userAgent', 'country'] },
    { name: 'missing optional signer fields', missingFields: ['email', 'fullName'] }
  ]
} as const;

/**
 * Creates test data for specific error scenarios
 * @param scenario - Error scenario type
 * @returns Test data configured for the error scenario
 * @example
 * const errorData = createErrorScenarioData('envelope');
 */
export function createErrorScenarioData(scenario: 'envelope' | 'signer' | 'consent' | 'document' | 'kms') {
  const baseData = createSignDocumentTestData();
  
  switch (scenario) {
    case 'envelope':
      return {
        ...baseData,
        mockOverrides: {
          validateUserAccess: Promise.resolve(null)
        }
      };
    
    case 'signer':
      const envelopeWithoutSigners = SignatureEnvelopeBuilder.create()
        .withId(baseData.envelopeId)
        .withCreatedBy(baseData.userId)
        .withStatus(EnvelopeStatus.readyForSignature())
        .withSigners([])
        .build();
      return {
        ...baseData,
        mockOverrides: {
          getEnvelopeWithSigners: envelopeWithoutSigners
        }
      };
    
    case 'consent':
      return {
        ...baseData,
        mockOverrides: {
          createConsent: new Error('Failed to create consent')
        }
      };
    
    case 'document':
      return {
        ...baseData,
        mockOverrides: {
          handleFlattenedDocument: new Error('Failed to prepare document')
        }
      };
    
    case 'kms':
      return {
        ...baseData,
        mockOverrides: {
          sign: new Error('KMS signing failed')
        }
      };
    
    default:
      throw new Error(`Unknown error scenario: ${scenario}`);
  }
}

/**
 * Creates test data for edge cases
 * @param edgeCase - Edge case type
 * @returns Test data configured for the edge case
 * @example
 * const edgeData = createEdgeCaseData('missing-signer-fields');
 */
export function createEdgeCaseData(edgeCase: 'missing-consent-fields' | 'missing-signer-fields') {
  const baseData = createSignDocumentTestData();
  
  switch (edgeCase) {
    case 'missing-consent-fields':
      return {
        ...baseData,
        inputOverrides: {
          request: {
            consent: {
              given: true,
              timestamp: '2023-01-01T10:00:00Z',
              text: 'I consent to sign this document'
              // Missing optional fields
            }
          }
        }
      };
    
    case 'missing-signer-fields':
      const signerWithoutFields = EnvelopeSignerBuilder.create()
        .withId(baseData.signerId)
        .withEnvelopeId(baseData.envelopeId)
        .withUserId(baseData.userId)
        .withEmail(undefined)
        .withFullName(undefined)
        .withIsExternal(false)
        .withStatus(SignerStatus.PENDING)
        .build();
      const envelopeWithoutSignerFields = SignatureEnvelopeBuilder.create()
        .withId(baseData.envelopeId)
        .withCreatedBy(baseData.userId)
        .withStatus(EnvelopeStatus.readyForSignature())
        .withSigners([signerWithoutFields])
        .build();
      return {
        ...baseData,
        testSigner: signerWithoutFields,
        testEnvelope: envelopeWithoutSignerFields,
        inputOverrides: {}
      };
    
    default:
      throw new Error(`Unknown edge case: ${edgeCase}`);
  }
}
