/**
 * @fileoverview DownloadDocumentUseCase Test Helpers - Reusable test utilities for DownloadDocumentUseCase tests
 * @summary Helper functions for testing DownloadDocumentUseCase functionality
 * @description This module provides reusable helper functions for creating test data,
 * setting up mocks, and handling common test scenarios in DownloadDocumentUseCase tests.
 * These helpers eliminate code duplication and improve test maintainability.
 */

import { TestUtils } from './testUtils';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';

/**
 * Interface for test data overrides
 */
export interface DownloadDocumentTestDataOverrides {
  envelopeId?: string;
  userId?: string;
  invitationToken?: string;
  expiresIn?: number;
  securityContext?: NetworkSecurityContext;
}

/**
 * Interface for mock setup overrides
 */
export interface DownloadDocumentMockOverrides {
  downloadDocument?: any;
  validateEnvelopeAccess?: any;
  create?: any;
}

/**
 * Creates test data for DownloadDocumentUseCase tests with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns Complete test data object
 * @example
 * const testData = createDownloadDocumentTestData({ 
 *   userId: 'custom-user-id'
 * });
 */
export function createDownloadDocumentTestData(overrides: DownloadDocumentTestDataOverrides = {}) {
  const envelopeId = TestUtils.generateEnvelopeId();
  const userId = TestUtils.generateUuid();
  const invitationToken = TestUtils.generateUuid();
  
  const securityContext: NetworkSecurityContext = {
    ipAddress: TestUtils.createTestIpAddress(),
    userAgent: TestUtils.createTestUserAgent(),
    country: 'US',
    ...overrides.securityContext
  };

  return {
    envelopeId,
    userId,
    invitationToken,
    expiresIn: 1800,
    securityContext,
    input: {
      envelopeId,
      userId,
      invitationToken,
      expiresIn: 1800,
      securityContext
    }
  };
}

/**
 * Creates expected result for download document tests
 * @param signature - Unique signature for the download URL
 * @param expiresIn - Expiration time in seconds
 * @returns Expected result object
 * @example
 * const expectedResult = createExpectedDownloadResult('abc123', 3600);
 */
export function createExpectedDownloadResult(signature: string, expiresIn: number = 1800) {
  return {
    downloadUrl: `https://s3.amazonaws.com/bucket/signed-document.pdf?signature=${signature}`,
    expiresIn
  };
}

/**
 * Sets up all mocks for DownloadDocumentUseCase tests
 * @param mocks - Mock objects from test setup
 * @param testData - Test data from createDownloadDocumentTestData
 * @param expectedResult - Expected result object
 * @param overrides - Partial mock overrides
 * @example
 * setupDownloadDocumentMocks(mocks, testData, expectedResult, { 
 *   downloadDocument: customResult
 * });
 */
export function setupDownloadDocumentMocks(
  mocks: {
    signatureEnvelopeService: any;
    envelopeAccessService: any;
    auditEventService: any;
  },
  testData: ReturnType<typeof createDownloadDocumentTestData>,
  expectedResult: ReturnType<typeof createExpectedDownloadResult>,
  overrides: DownloadDocumentMockOverrides = {}
): void {
  // Service mocks
  mocks.signatureEnvelopeService.downloadDocument.mockResolvedValue(
    overrides.downloadDocument || expectedResult
  );
  
  mocks.envelopeAccessService.validateEnvelopeAccess.mockResolvedValue(
    overrides.validateEnvelopeAccess || undefined
  );
  
  mocks.auditEventService.create.mockResolvedValue(
    overrides.create || undefined
  );
}

/**
 * Executes a complete DownloadDocument test with standardized setup and assertions
 * @param testData - Test data from createDownloadDocumentTestData
 * @param mocks - Mock objects from test setup
 * @param useCase - Use case instance to test
 * @param expectedResult - Expected result object
 * @param customAssertions - Array of custom assertion functions
 * @example
 * await executeDownloadDocumentTest(testData, mocks, useCase, expectedResult);
 */
export async function executeDownloadDocumentTest(
  testData: ReturnType<typeof createDownloadDocumentTestData>,
  mocks: {
    signatureEnvelopeService: any;
    envelopeAccessService: any;
    auditEventService: any;
  },
  useCase: any,
  expectedResult: ReturnType<typeof createExpectedDownloadResult>,
  customAssertions: Array<() => void> = []
): Promise<void> {
  const result = await useCase.execute(testData.input);

  expect(result).toEqual(expectedResult);
  expect(mocks.signatureEnvelopeService.downloadDocument).toHaveBeenCalledWith(
    testData.envelopeId, 
    testData.expiresIn
  );
  
  for (const assertion of customAssertions) {
    assertion();
  }
}

/**
 * Creates test scenarios for parametrized testing
 */
export const DOWNLOAD_DOCUMENT_TEST_SCENARIOS = {
  successScenarios: [
    { 
      name: 'download with all parameters', 
      hasAllParams: true,
      signature: 'abc123',
      expiresIn: 3600
    },
    { 
      name: 'download with minimal parameters', 
      hasAllParams: false,
      signature: 'def456',
      expiresIn: 1800
    },
    { 
      name: 'download with only userId', 
      hasAllParams: false,
      signature: 'ghi789',
      expiresIn: 1800
    },
    { 
      name: 'download with only invitationToken', 
      hasAllParams: false,
      signature: 'jkl012',
      expiresIn: 1800
    },
    { 
      name: 'download with custom expiresIn', 
      hasAllParams: false,
      signature: 'mno345',
      expiresIn: 7200
    },
    { 
      name: 'download with security context only', 
      hasAllParams: false,
      signature: 'pqr678',
      expiresIn: 1800
    }
  ],
  
  errorScenarios: [
    { name: 'service errors', errorType: 'service' as const, message: 'Document not found' },
    { name: 'access denied errors', errorType: 'access' as const, message: 'Access denied' },
    { name: 'envelope not found errors', errorType: 'notFound' as const, message: 'Envelope not found' },
    { name: 'missing authentication', errorType: 'auth' as const, message: 'Either userId or invitationToken must be provided' }
  ]
} as const;

/**
 * Creates test data for specific error scenarios
 * @param scenario - Error scenario type
 * @returns Test data configured for the error scenario
 * @example
 * const errorData = createDownloadDocumentErrorScenarioData('service');
 */
export function createDownloadDocumentErrorScenarioData(scenario: 'service' | 'access' | 'notFound' | 'auth') {
  const baseData = createDownloadDocumentTestData();
  
  switch (scenario) {
    case 'service':
      return {
        ...baseData,
        mockOverrides: {
          downloadDocument: 'Document not found'
        }
      };
    
    case 'access':
      return {
        ...baseData,
        mockOverrides: {
          downloadDocument: 'Access denied'
        }
      };
    
    case 'notFound':
      return {
        ...baseData,
        mockOverrides: {
          downloadDocument: 'Envelope not found'
        }
      };
    
    case 'auth':
      return {
        ...baseData,
        input: {
          envelopeId: baseData.envelopeId,
          securityContext: baseData.securityContext
        },
        mockOverrides: {}
      };
    
    default:
      throw new Error(`Unknown error scenario: ${scenario}`);
  }
}

/**
 * Executes error test with standardized setup
 * @param scenario - Error scenario type
 * @param expectedMessage - Expected error message
 * @param mocks - Mock objects from test setup
 * @param useCase - Use case instance to test
 * @example
 * await executeDownloadDocumentErrorTest('service', 'Document not found', mocks, useCase);
 */
export async function executeDownloadDocumentErrorTest(
  scenario: 'service' | 'access' | 'notFound' | 'auth',
  expectedMessage: string,
  mocks: {
    signatureEnvelopeService: any;
    envelopeAccessService: any;
    auditEventService: any;
  },
  useCase: any
): Promise<void> {
  const errorData = createDownloadDocumentErrorScenarioData(scenario);
  
  if (scenario !== 'auth') {
    // Setup mocks for error scenarios
    mocks.signatureEnvelopeService.downloadDocument.mockRejectedValue(new Error(expectedMessage));
    mocks.envelopeAccessService.validateEnvelopeAccess.mockResolvedValue(undefined);
    mocks.auditEventService.create.mockResolvedValue(undefined);
  }
  
  await expect(useCase.execute(errorData.input)).rejects.toThrow(expectedMessage);
}

/**
 * Creates standardized mock configuration object
 * @param mocks - Mock objects from test setup
 * @returns Standardized mock configuration
 * @example
 * const mockConfig = createMockConfiguration(mocks);
 */
export function createMockConfiguration(mocks: {
  signatureEnvelopeService: any;
  envelopeAccessService: any;
  auditEventService: any;
}) {
  return {
    signatureEnvelopeService: mocks.signatureEnvelopeService,
    envelopeAccessService: mocks.envelopeAccessService,
    auditEventService: mocks.auditEventService
  };
}
