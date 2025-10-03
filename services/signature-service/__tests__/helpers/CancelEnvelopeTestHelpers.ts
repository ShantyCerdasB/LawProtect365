/**
 * @fileoverview CancelEnvelopeUseCase Test Helpers - Reusable test utilities for CancelEnvelopeUseCase tests
 * @summary Helper functions for testing CancelEnvelopeUseCase functionality
 * @description This module provides reusable helper functions for creating test data,
 * setting up mocks, and handling common test scenarios in CancelEnvelopeUseCase tests.
 * These helpers eliminate code duplication and improve test maintainability.
 */

import { TestUtils } from './testUtils';
import { signatureEnvelopeEntity } from './builders/signatureEnvelope';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';

/**
 * Interface for test data overrides
 */
export interface CancelEnvelopeTestDataOverrides {
  envelopeId?: string;
  userId?: string;
  securityContext?: NetworkSecurityContext;
  testEnvelope?: any;
}

/**
 * Interface for mock setup overrides
 */
export interface CancelEnvelopeMockOverrides {
  cancelEnvelope?: any;
  getEnvelopeWithSigners?: any;
  publishEnvelopeCancelled?: any;
}

/**
 * Creates test data for CancelEnvelopeUseCase tests with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns Complete test data object
 * @example
 * const testData = createCancelEnvelopeTestData({ 
 *   userId: 'custom-user-id'
 * });
 */
export function createCancelEnvelopeTestData(overrides: CancelEnvelopeTestDataOverrides = {}) {
  const envelopeId = TestUtils.generateEnvelopeId();
  const userId = TestUtils.generateUuid();
  
  const securityContext: NetworkSecurityContext = {
    ipAddress: TestUtils.createTestIpAddress(),
    userAgent: TestUtils.createTestUserAgent(),
    country: 'US',
    ...overrides.securityContext
  };

  const testEnvelope = signatureEnvelopeEntity();

  return {
    envelopeId,
    userId,
    securityContext,
    testEnvelope
  };
}

/**
 * Sets up all mocks for CancelEnvelopeUseCase tests
 * @param mocks - Mock objects from test setup
 * @param testData - Test data from createCancelEnvelopeTestData
 * @param overrides - Partial mock overrides
 * @example
 * setupCancelEnvelopeMocks(mocks, testData, { 
 *   cancelEnvelope: customEnvelope
 * });
 */
export function setupCancelEnvelopeMocks(
  mocks: {
    signatureEnvelopeService: any;
    envelopeNotificationService: any;
  },
  testData: ReturnType<typeof createCancelEnvelopeTestData>,
  overrides: CancelEnvelopeMockOverrides = {}
): void {
  // Service mocks
  mocks.signatureEnvelopeService.cancelEnvelope.mockResolvedValue(
    overrides.cancelEnvelope || testData.testEnvelope
  );
  
  mocks.signatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(
    overrides.getEnvelopeWithSigners || testData.testEnvelope
  );
  
  mocks.envelopeNotificationService.publishEnvelopeCancelled.mockResolvedValue(
    overrides.publishEnvelopeCancelled || undefined
  );
}

/**
 * Executes a complete CancelEnvelope test with standardized setup and assertions
 * @param testData - Test data from createCancelEnvelopeTestData
 * @param mocks - Mock objects from test setup
 * @param useCase - Use case instance to test
 * @param expectedResult - Expected result object
 * @param customAssertions - Array of custom assertion functions
 * @example
 * await executeCancelEnvelopeTest(testData, mocks, useCase, { envelope: testData.testEnvelope });
 */
export async function executeCancelEnvelopeTest(
  testData: ReturnType<typeof createCancelEnvelopeTestData>,
  mocks: {
    signatureEnvelopeService: any;
    envelopeNotificationService: any;
  },
  useCase: any,
  expectedResult: any,
  customAssertions: Array<() => void> = []
): Promise<void> {
  const result = await useCase.execute({
    envelopeId: testData.envelopeId,
    userId: testData.userId,
    securityContext: testData.securityContext
  });

  expect(result).toEqual(expectedResult);
  expect(mocks.signatureEnvelopeService.cancelEnvelope).toHaveBeenCalledWith(
    testData.envelopeId, 
    testData.userId
  );
  
  customAssertions.forEach(assertion => assertion());
}

/**
 * Creates test scenarios for parametrized testing
 */
export const CANCEL_ENVELOPE_TEST_SCENARIOS = {
  successScenarios: [
    { 
      name: 'cancel envelope and dispatch notification', 
      shouldNotify: true,
      expectedNotifications: 1
    },
    { 
      name: 'cancel envelope without notification', 
      shouldNotify: false,
      expectedNotifications: 0
    }
  ],
  
  errorScenarios: [
    { name: 'getEnvelopeWithSigners failure', errorType: 'getEnvelope' as const },
    { name: 'publishEnvelopeCancelled failure', errorType: 'notification' as const },
    { name: 'null envelope in notification flow', errorType: 'nullEnvelope' as const }
  ],
  
  edgeCaseScenarios: [
    { name: 'non-Error objects in catch blocks', errorType: 'nonError' as const }
  ]
} as const;

/**
 * Creates test data for specific error scenarios
 * @param scenario - Error scenario type
 * @returns Test data configured for the error scenario
 * @example
 * const errorData = createCancelEnvelopeErrorScenarioData('getEnvelope');
 */
export function createCancelEnvelopeErrorScenarioData(scenario: 'getEnvelope' | 'notification' | 'nullEnvelope' | 'nonError') {
  const baseData = createCancelEnvelopeTestData();
  
  switch (scenario) {
    case 'getEnvelope':
      return {
        ...baseData,
        mockOverrides: {
          getEnvelopeWithSigners: Promise.reject(new Error('Get envelope failed'))
        }
      };
    
    case 'notification':
      return {
        ...baseData,
        mockOverrides: {
          publishEnvelopeCancelled: Promise.reject(new Error('Notification failed'))
        }
      };
    
    case 'nullEnvelope':
      return {
        ...baseData,
        mockOverrides: {
          getEnvelopeWithSigners: Promise.resolve(null)
        }
      };
    
    case 'nonError':
      return {
        ...baseData,
        mockOverrides: {
          publishEnvelopeCancelled: Promise.reject('String error instead of Error object')
        }
      };
    
    default:
      throw new Error(`Unknown error scenario: ${scenario}`);
  }
}
