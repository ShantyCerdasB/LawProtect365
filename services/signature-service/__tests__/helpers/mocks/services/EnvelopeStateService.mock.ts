/**
 * @fileoverview EnvelopeStateService Mock - Reusable mock for EnvelopeStateService
 * @summary Mock implementation for EnvelopeStateService in tests
 * @description Provides mock implementations for EnvelopeStateService methods
 * to be used across different test scenarios. Includes both success and failure
 * mock configurations for comprehensive testing.
 */

import { jest } from '@jest/globals';
import { EnvelopeId } from '../../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../../src/domain/value-objects/SignerId';

/**
 * Creates a mock EnvelopeStateService with default implementations
 * @returns Mock EnvelopeStateService with jest functions
 */
export function createEnvelopeStateServiceMock() {
  return {
    updateEnvelopeStatusAfterDecline: jest.fn() as jest.MockedFunction<any>,
    completeEnvelope: jest.fn() as jest.MockedFunction<any>,
    updateEnvelopeStatus: jest.fn() as jest.MockedFunction<any>
  };
}

/**
 * Creates a mock EnvelopeStateService with successful operations
 * @returns Mock EnvelopeStateService with successful operations
 */
export function createEnvelopeStateServiceMockWithSuccess() {
  const mockService = createEnvelopeStateServiceMock();
  
  mockService.updateEnvelopeStatusAfterDecline.mockResolvedValue(undefined);
  mockService.completeEnvelope.mockResolvedValue(undefined);
  mockService.updateEnvelopeStatus.mockResolvedValue(undefined);
  
  return mockService;
}

/**
 * Creates a mock EnvelopeStateService with failing operations
 * @param error - Error to throw (defaults to generic error)
 * @returns Mock EnvelopeStateService with failing operations
 */
export function createEnvelopeStateServiceMockWithFailure(error: Error = new Error('State update failed')) {
  const mockService = createEnvelopeStateServiceMock();
  
  mockService.updateEnvelopeStatusAfterDecline.mockRejectedValue(error);
  mockService.completeEnvelope.mockRejectedValue(error);
  mockService.updateEnvelopeStatus.mockRejectedValue(error);
  
  return mockService;
}
