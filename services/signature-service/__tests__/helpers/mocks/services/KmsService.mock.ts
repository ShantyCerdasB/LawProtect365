/**
 * @fileoverview KmsService Mock - Reusable mock for KmsService
 * @summary Mock implementation for KmsService in tests
 * @description Provides mock implementations for KmsService methods
 * to be used across different test scenarios.
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock KmsService with default implementations
 * @returns Mock KmsService with jest functions
 */
export function createKmsServiceMock() {
  return {
    sign: jest.fn() as jest.MockedFunction<any>,
    verify: jest.fn() as jest.MockedFunction<any>,
    createKey: jest.fn() as jest.MockedFunction<any>,
    deleteKey: jest.fn() as jest.MockedFunction<any>,
    getCertificateChain: jest.fn() as jest.MockedFunction<any>
  };
}
