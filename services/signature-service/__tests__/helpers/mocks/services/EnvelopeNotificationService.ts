/**
 * @fileoverview EnvelopeNotificationService Mock - Reusable mock for EnvelopeNotificationService
 * @summary Mock implementation for EnvelopeNotificationService in tests
 * @description Provides mock implementations for EnvelopeNotificationService methods
 * to be used across different test scenarios. Includes both success and failure
 * mock configurations for comprehensive testing.
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock EnvelopeNotificationService with default implementations
 * @returns Mock EnvelopeNotificationService with jest functions
 */
export function createEnvelopeNotificationServiceMock() {
  return {
    publishEnvelopeCancelled: jest.fn() as jest.MockedFunction<any>,
    publishSignerDeclined: jest.fn() as jest.MockedFunction<any>
  };
}

/**
 * Creates a mock EnvelopeNotificationService with successful publishEnvelopeCancelled
 * @returns Mock EnvelopeNotificationService with successful publishEnvelopeCancelled
 */
export function createEnvelopeNotificationServiceMockWithSuccess() {
  const mockService = createEnvelopeNotificationServiceMock();
  
  mockService.publishEnvelopeCancelled.mockResolvedValue(undefined);
  
  return mockService;
}

/**
 * Creates a mock EnvelopeNotificationService with failing publishEnvelopeCancelled
 * @param error - Error to throw (defaults to generic error)
 * @returns Mock EnvelopeNotificationService with failing publishEnvelopeCancelled
 */
export function createEnvelopeNotificationServiceMockWithFailure(error: Error = new Error('Notification error')) {
  const mockService = createEnvelopeNotificationServiceMock();
  
  mockService.publishEnvelopeCancelled.mockRejectedValue(error);
  
  return mockService;
}
