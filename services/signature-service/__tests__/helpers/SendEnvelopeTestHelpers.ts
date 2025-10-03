/**
 * @fileoverview SendEnvelopeUseCase Test Helpers - Reusable test utilities for SendEnvelopeUseCase tests
 * @summary Helper functions for testing SendEnvelopeUseCase functionality
 * @description This module provides reusable helper functions for creating test data,
 * setting up mocks, and handling common test scenarios in SendEnvelopeUseCase tests.
 * These helpers eliminate code duplication and improve test maintainability.
 */

import { TestUtils } from './testUtils';
import { signatureEnvelopeEntity } from './builders/signatureEnvelope';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';

/**
 * Interface for test data overrides
 */
export interface SendEnvelopeTestDataOverrides {
  envelopeId?: string;
  userId?: string;
  securityContext?: NetworkSecurityContext;
  testEnvelope?: any;
  externalSigners?: any[];
  targetSigners?: any[];
  tokenResults?: any[];
}

/**
 * Interface for mock setup overrides
 */
export interface SendEnvelopeMockOverrides {
  sendEnvelope?: any;
  generateInvitationTokensForSigners?: any;
  sendSignerInvitations?: any;
  create?: any;
  selectTargetSigners?: any;
}

/**
 * Creates test data for SendEnvelopeUseCase tests with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns Complete test data object
 * @example
 * const testData = createSendEnvelopeTestData({ 
 *   userId: 'custom-user-id'
 * });
 */
export function createSendEnvelopeTestData(overrides: SendEnvelopeTestDataOverrides = {}) {
  const envelopeId = TestUtils.generateEnvelopeId();
  const userId = TestUtils.generateUuid();
  
  const securityContext: NetworkSecurityContext = {
    ipAddress: TestUtils.createTestIpAddress(),
    userAgent: TestUtils.createTestUserAgent(),
    country: 'US',
    ...overrides.securityContext
  };

  const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
  const externalSigners = [{ getId: () => TestUtils.generateSignerId() } as any];
  const targetSigners = [{ getId: () => TestUtils.generateSignerId() } as any];
  const tokenResults = [
    {
      signerId: TestUtils.generateUuid(),
      email: 'signer@example.com',
      token: 'token-123',
      expiresAt: new Date('2023-12-31T23:59:59Z')
    }
  ];

  // Setup envelope methods
  testEnvelope.getExternalSigners = jest.fn().mockReturnValue(externalSigners) as any;
  testEnvelope.getStatus = jest.fn().mockReturnValue({ getValue: () => 'SENT' }) as any;

  return {
    envelopeId,
    userId,
    securityContext,
    testEnvelope,
    externalSigners,
    targetSigners,
    tokenResults,
    input: {
      envelopeId,
      userId,
      securityContext
    }
  };
}

/**
 * Sets up all mocks for SendEnvelopeUseCase tests
 * @param mocks - Mock objects from test setup
 * @param testData - Test data from createSendEnvelopeTestData
 * @param overrides - Partial mock overrides
 * @example
 * setupSendEnvelopeMocks(mocks, testData, { 
 *   sendEnvelope: customEnvelope
 * });
 */
export function setupSendEnvelopeMocks(
  mocks: {
    signatureEnvelopeService: any;
    invitationTokenService: any;
    envelopeNotificationService: any;
    auditEventService: any;
  },
  testData: ReturnType<typeof createSendEnvelopeTestData>,
  overrides: SendEnvelopeMockOverrides = {}
): void {
  // Mock selectTargetSigners utility
  const { selectTargetSigners } = require('../../src/services/orchestrators/utils/signerSelection');
  selectTargetSigners.mockReturnValue(overrides.selectTargetSigners || testData.targetSigners);

  // Service mocks
  mocks.signatureEnvelopeService.sendEnvelope.mockResolvedValue(
    overrides.sendEnvelope || testData.testEnvelope
  );
  
  mocks.invitationTokenService.generateInvitationTokensForSigners.mockResolvedValue(
    overrides.generateInvitationTokensForSigners || testData.tokenResults
  );
  
  mocks.envelopeNotificationService.sendSignerInvitations.mockResolvedValue(
    overrides.sendSignerInvitations || undefined
  );
  
  mocks.auditEventService.create.mockResolvedValue(
    overrides.create || undefined
  );
}

/**
 * Executes a complete SendEnvelope test with standardized setup and assertions
 * @param testData - Test data from createSendEnvelopeTestData
 * @param mocks - Mock objects from test setup
 * @param useCase - Use case instance to test
 * @param expectedResult - Expected result object
 * @param customAssertions - Array of custom assertion functions
 * @example
 * await executeSendEnvelopeTest(testData, mocks, useCase, { envelope: testData.testEnvelope });
 */
export async function executeSendEnvelopeTest(
  testData: ReturnType<typeof createSendEnvelopeTestData>,
  mocks: {
    signatureEnvelopeService: any;
    invitationTokenService: any;
    envelopeNotificationService: any;
    auditEventService: any;
  },
  useCase: any,
  expectedResult: any,
  customAssertions: Array<() => void> = []
): Promise<void> {
  const result = await useCase.execute(testData.input);

  expect(result).toEqual(expectedResult);
  expect(mocks.signatureEnvelopeService.sendEnvelope).toHaveBeenCalledWith(
    testData.envelopeId, 
    testData.userId
  );
  
  for (const assertion of customAssertions) {
    assertion();
  }
}

/**
 * Creates test scenarios for parametrized testing
 */
export const SEND_ENVELOPE_TEST_SCENARIOS = {
  successScenarios: [
    { 
      name: 'send envelope with all options', 
      hasOptions: true,
      expectedNotifications: 1
    },
    { 
      name: 'send envelope with minimal options', 
      hasOptions: false,
      expectedNotifications: 1
    }
  ],
  
  errorScenarios: [
    { name: 'send envelope fails', errorType: 'sendEnvelope' as const },
    { name: 'token generation fails', errorType: 'tokenGeneration' as const },
    { name: 'notification sending fails', errorType: 'notification' as const },
    { name: 'audit event creation fails', errorType: 'auditEvent' as const }
  ],
  
  edgeCaseScenarios: [
    { name: 'multiple external signers', signerCount: 3 },
    { name: 'single external signer', signerCount: 1 }
  ]
} as const;

/**
 * Creates test data for specific error scenarios
 * @param scenario - Error scenario type
 * @returns Test data configured for the error scenario
 * @example
 * const errorData = createSendEnvelopeErrorScenarioData('sendEnvelope');
 */
export function createSendEnvelopeErrorScenarioData(scenario: 'sendEnvelope' | 'tokenGeneration' | 'notification' | 'auditEvent') {
  const baseData = createSendEnvelopeTestData();
  
  switch (scenario) {
    case 'sendEnvelope':
      return {
        ...baseData,
        mockOverrides: {
          sendEnvelope: Promise.reject(new Error('Send envelope failed'))
        }
      };
    
    case 'tokenGeneration':
      return {
        ...baseData,
        mockOverrides: {
          generateInvitationTokensForSigners: Promise.reject(new Error('Token generation failed'))
        }
      };
    
    case 'notification':
      return {
        ...baseData,
        mockOverrides: {
          sendSignerInvitations: Promise.reject(new Error('Notification failed'))
        }
      };
    
    case 'auditEvent':
      return {
        ...baseData,
        mockOverrides: {
          create: Promise.reject(new Error('Audit event creation failed'))
        }
      };
    
    default:
      throw new Error(`Unknown error scenario: ${scenario}`);
  }
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
  invitationTokenService: any;
  envelopeNotificationService: any;
  auditEventService: any;
}) {
  return {
    signatureEnvelopeService: mocks.signatureEnvelopeService,
    invitationTokenService: mocks.invitationTokenService,
    envelopeNotificationService: mocks.envelopeNotificationService,
    auditEventService: mocks.auditEventService
  };
}

/**
 * Executes error test with standardized setup
 * @param scenario - Error scenario type
 * @param expectedMessage - Expected error message
 * @param mockConfig - Mock configuration object
 * @param useCase - Use case instance to test
 * @example
 * await executeSendEnvelopeErrorTest('sendEnvelope', 'Send envelope failed', mockConfig, useCase);
 */
export async function executeSendEnvelopeErrorTest(
  scenario: 'sendEnvelope' | 'tokenGeneration' | 'notification' | 'auditEvent',
  expectedMessage: string,
  mockConfig: ReturnType<typeof createMockConfiguration>,
  useCase: any
): Promise<void> {
  const errorData = createSendEnvelopeErrorScenarioData(scenario);
  setupSendEnvelopeMocks(mockConfig, errorData, errorData.mockOverrides);
  await expect(useCase.execute(errorData.input)).rejects.toThrow(expectedMessage);
}

/**
 * Creates test data for multiple signers scenario
 * @param signerCount - Number of signers to create
 * @returns Test data with multiple signers
 * @example
 * const multiSignerData = createMultiSignerTestData(3);
 */
export function createMultiSignerTestData(signerCount: number) {
  const baseData = createSendEnvelopeTestData();
  
  const externalSigners = Array.from({ length: signerCount }, () => ({
    getId: () => TestUtils.generateSignerId()
  })) as any[];
  
  const targetSigners = Array.from({ length: signerCount }, () => ({
    getId: () => TestUtils.generateSignerId()
  })) as any[];
  
  const tokenResults = Array.from({ length: signerCount }, (_, index) => ({
    signerId: TestUtils.generateUuid(),
    email: `signer${index + 1}@example.com`,
    token: `token-${index + 1}`,
    expiresAt: new Date('2023-12-31T23:59:59Z')
  }));

  baseData.testEnvelope.getExternalSigners = jest.fn().mockReturnValue(externalSigners) as any;

  return {
    ...baseData,
    externalSigners,
    targetSigners,
    tokenResults
  };
}
