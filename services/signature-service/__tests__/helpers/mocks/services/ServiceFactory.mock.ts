/**
 * @fileoverview ServiceFactory Mock - Reusable mock for ServiceFactory
 * @summary Mock implementation for ServiceFactory in tests
 * @description Provides mock implementations for ServiceFactory methods
 * to be used across different test scenarios.
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock ServiceFactory with default implementations
 * @returns Mock ServiceFactory with jest functions
 */
export function createServiceFactoryMock() {
  return {
    createSignatureOrchestrator: jest.fn() as jest.MockedFunction<any>
  };
}
