/**
 * @fileoverview ConsentService Mock - Reusable mock for ConsentService
 * @summary Mock implementation for ConsentService in tests
 * @description Provides mock implementations for ConsentService methods
 * to be used across different test scenarios.
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock ConsentService with default implementations
 * @returns Mock ConsentService with jest functions
 */
export function createConsentServiceMock() {
  return {
    createConsent: jest.fn() as jest.MockedFunction<any>,
    linkConsentWithSignature: jest.fn() as jest.MockedFunction<any>
  };
}
