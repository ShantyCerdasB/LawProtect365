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
    getPendingSigners: jest.fn() as jest.MockedFunction<any>,
    declineSigner: jest.fn() as jest.MockedFunction<any>,
    createViewerParticipant: jest.fn() as jest.MockedFunction<any>,
    markSignerAsSigned: jest.fn() as jest.MockedFunction<any>,
    createSignersForEnvelope: jest.fn() as jest.MockedFunction<any>,
    deleteSigner: jest.fn() as jest.MockedFunction<any>
  };
}

/**
 * Creates a mock EnvelopeSignerService with successful getPendingSigners
 * @param signers - Optional signers to return (defaults to empty array)
 * @returns Mock EnvelopeSignerService with successful getPendingSigners
 */
export function createEnvelopeSignerServiceMockWithSuccess(signers: any[] = []) {
  const mockService = createEnvelopeSignerServiceMock();

  mockService.getPendingSigners.mockResolvedValue(signers);
  mockService.declineSigner.mockResolvedValue(undefined);

  return mockService;
}

/**
 * Creates a mock EnvelopeSignerService with failing getPendingSigners
 * @param error - Error to throw (defaults to generic error)
 * @returns Mock EnvelopeSignerService with failing getPendingSigners
 */
export function createEnvelopeSignerServiceMockWithFailure(error: Error = new Error('Get pending signers failed')) {
  const mockService = createEnvelopeSignerServiceMock();

  mockService.getPendingSigners.mockRejectedValue(error);
  mockService.declineSigner.mockRejectedValue(error);

  return mockService;
}