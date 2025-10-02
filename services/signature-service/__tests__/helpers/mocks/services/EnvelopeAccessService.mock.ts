/**
 * @fileoverview EnvelopeAccessService Mock - Reusable mock for EnvelopeAccessService
 * @summary Mock implementation for EnvelopeAccessService in tests
 * @description Provides mock implementations for EnvelopeAccessService methods
 * to be used across different test scenarios. Includes both success and failure
 * mock configurations for comprehensive testing.
 */

import { jest } from '@jest/globals';
import { SignatureEnvelope } from '../../../../src/domain/entities/SignatureEnvelope';
import { signatureEnvelopeEntity } from '../../builders/signatureEnvelope';

/**
 * Creates a mock EnvelopeAccessService with default implementations
 * @returns Mock EnvelopeAccessService with jest functions
 */
export function createEnvelopeAccessServiceMock() {
  return {
    validateUserAccess: jest.fn() as jest.MockedFunction<any>,
    validateEnvelopeAccess: jest.fn() as jest.MockedFunction<any>,
    validateExternalUserAccess: jest.fn() as jest.MockedFunction<any>
  };
}

/**
 * Creates a mock EnvelopeAccessService with successful validation
 * @param envelope - Optional envelope to return (defaults to generated test envelope)
 * @returns Mock EnvelopeAccessService with successful validation
 */
export function createEnvelopeAccessServiceMockWithSuccess(envelope?: SignatureEnvelope) {
  const mockService = createEnvelopeAccessServiceMock();
  const testEnvelope = envelope || signatureEnvelopeEntity();
  
  mockService.validateUserAccess.mockResolvedValue(testEnvelope);
  mockService.validateEnvelopeAccess.mockResolvedValue(testEnvelope);
  mockService.validateExternalUserAccess.mockResolvedValue(testEnvelope);
  
  return mockService;
}

/**
 * Creates a mock EnvelopeAccessService with failing validation
 * @param error - Error to throw (defaults to generic error)
 * @returns Mock EnvelopeAccessService with failing validation
 */
export function createEnvelopeAccessServiceMockWithFailure(error: Error = new Error('Access denied')) {
  const mockService = createEnvelopeAccessServiceMock();
  
  mockService.validateUserAccess.mockRejectedValue(error);
  mockService.validateEnvelopeAccess.mockRejectedValue(error);
  mockService.validateExternalUserAccess.mockRejectedValue(error);
  
  return mockService;
}
