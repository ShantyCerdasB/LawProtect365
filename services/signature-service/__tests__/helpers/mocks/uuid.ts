/**
 * @fileoverview UUID Mock - Mock implementation for uuid function
 * @summary Provides mock implementations for uuid generation in tests
 * @description This module provides mock implementations for the uuid function
 * to be used in tests where we need to control UUID generation for predictable
 * test results and better test isolation.
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock for the uuid function
 * @param returnValue - The UUID string to return (defaults to generated test UUID)
 * @returns Mock uuid function
 */
export function createUuidMock(returnValue?: string) {
  const mockUuid = jest.fn();
  if (returnValue) {
    mockUuid.mockReturnValue(returnValue);
  } else {
    mockUuid.mockReturnValue('test-uuid-12345');
  }
  return mockUuid;
}

/**
 * Creates a mock for uuid function that returns different values on each call
 * @param values - Array of UUID strings to return in sequence
 * @returns Mock uuid function
 */
export function createUuidMockWithSequence(values: string[]) {
  const mockUuid = jest.fn();
  for (const value of values) {
    mockUuid.mockReturnValueOnce(value);
  }
  return mockUuid;
}

/**
 * Creates a mock for uuid function that throws an error
 * @param error - Error to throw (defaults to generic error)
 * @returns Mock uuid function
 */
export function createUuidMockWithError(error: Error = new Error('UUID generation failed')) {
  const mockUuid = jest.fn();
  mockUuid.mockImplementation(() => {
    throw error;
  });
  return mockUuid;
}
