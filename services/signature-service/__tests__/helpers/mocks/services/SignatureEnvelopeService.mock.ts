/**
 * @fileoverview SignatureEnvelopeService Mock - Reusable mock for SignatureEnvelopeService
 * @summary Mock implementation for SignatureEnvelopeService in tests
 * @description Provides mock implementations for SignatureEnvelopeService methods
 * to be used across different test scenarios. Includes both success and failure
 * mock configurations for comprehensive testing.
 */

import { jest } from '@jest/globals';
import { SignatureEnvelope } from '../../../../src/domain/entities/SignatureEnvelope';
import { signatureEnvelopeEntity } from '../../builders/signatureEnvelope';

/**
 * Creates a mock SignatureEnvelopeService with default implementations
 * @returns Mock SignatureEnvelopeService with jest functions
 */
export function createSignatureEnvelopeServiceMock() {
  return {
    cancelEnvelope: jest.fn() as jest.MockedFunction<any>,
    getEnvelopeWithSigners: jest.fn() as jest.MockedFunction<any>,
    createEnvelope: jest.fn() as jest.MockedFunction<any>,
    validateUserAccess: jest.fn() as jest.MockedFunction<any>,
    updateEnvelopeStatusAfterDecline: jest.fn() as jest.MockedFunction<any>,
    downloadDocument: jest.fn() as jest.MockedFunction<any>,
    listEnvelopes: jest.fn() as jest.MockedFunction<any>,
    sendEnvelope: jest.fn() as jest.MockedFunction<any>,
    updateSignedDocument: jest.fn() as jest.MockedFunction<any>,
    updateHashes: jest.fn() as jest.MockedFunction<any>,
    completeEnvelope: jest.fn() as jest.MockedFunction<any>,
    updateEnvelope: jest.fn() as jest.MockedFunction<any>,
    create: jest.fn() as jest.MockedFunction<any>
  };
}

/**
 * Creates a mock SignatureEnvelopeService with successful cancelEnvelope
 * @param envelope - Optional envelope to return (defaults to generated test envelope)
 * @returns Mock SignatureEnvelopeService with successful cancelEnvelope
 */
export function createSignatureEnvelopeServiceMockWithSuccess(envelope?: SignatureEnvelope) {
  const mockService = createSignatureEnvelopeServiceMock();
  const testEnvelope = envelope || signatureEnvelopeEntity();
  
  mockService.cancelEnvelope.mockResolvedValue(testEnvelope);
  mockService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
  
  return mockService;
}

/**
 * Creates a mock SignatureEnvelopeService with failing cancelEnvelope
 * @param error - Error to throw (defaults to generic error)
 * @returns Mock SignatureEnvelopeService with failing cancelEnvelope
 */
export function createSignatureEnvelopeServiceMockWithFailure(error: Error = new Error('Service error')) {
  const mockService = createSignatureEnvelopeServiceMock();
  
  mockService.cancelEnvelope.mockRejectedValue(error);
  mockService.getEnvelopeWithSigners.mockResolvedValue(null);
  
  return mockService;
}

/**
 * Creates a mock SignatureEnvelopeService with successful cancel but failing getEnvelopeWithSigners
 * @param envelope - Envelope to return from cancelEnvelope
 * @param error - Error to throw from getEnvelopeWithSigners
 * @returns Mock SignatureEnvelopeService with mixed success/failure
 */
export function createSignatureEnvelopeServiceMockWithPartialFailure(
  envelope: SignatureEnvelope,
  error: Error = new Error('Get envelope error')
) {
  const mockService = createSignatureEnvelopeServiceMock();
  
  mockService.cancelEnvelope.mockResolvedValue(envelope);
  mockService.getEnvelopeWithSigners.mockRejectedValue(error);
  
  return mockService;
}
