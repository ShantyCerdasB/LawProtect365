/**
 * @fileoverview EnvelopeSignerService Mock - Reusable mock for EnvelopeSignerService
 * @summary Mock implementation for EnvelopeSignerService in tests
 * @description Provides mock implementations for EnvelopeSignerService methods
 * to be used across different test scenarios. Includes both success and failure
 * mock configurations for comprehensive testing.
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock EnvelopeSignerService with default implementations
 * @returns Mock EnvelopeSignerService with jest functions
 */
export function createEnvelopeSignerServiceMock() {
  return {
    declineSigner: jest.fn() as jest.MockedFunction<any>
  };
}

/**
 * Creates a mock EnvelopeSignerService with successful declineSigner
 * @returns Mock EnvelopeSignerService with successful declineSigner
 */
export function createEnvelopeSignerServiceMockWithSuccess() {
  const mockService = createEnvelopeSignerServiceMock();
  
  mockService.declineSigner.mockResolvedValue(undefined);
  
  return mockService;
}

/**
 * Creates a mock EnvelopeSignerService with failing declineSigner
 * @param error - Error to throw (defaults to generic error)
 * @returns Mock EnvelopeSignerService with failing declineSigner
 */
export function createEnvelopeSignerServiceMockWithFailure(error: Error = new Error('Decline signer failed')) {
  const mockService = createEnvelopeSignerServiceMock();
  
  mockService.declineSigner.mockRejectedValue(error);
  
  return mockService;
}
