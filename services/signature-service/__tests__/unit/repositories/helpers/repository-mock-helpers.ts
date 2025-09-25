/**
 * @fileoverview RepositoryMockHelpers - Helper functions for mocking repository methods
 * @summary Utility functions for mocking repository methods in tests
 * @description Provides reusable mock helpers for repository testing, especially for methods that use external dependencies like shared-ts functions
 */

import { jest } from '@jest/globals';

/**
 * Mocks a repository method that uses external dependencies
 * @param repository - The repository instance to mock
 * @param methodName - The name of the method to mock
 * @param mockReturnValue - The value to return from the mocked method
 * @returns Jest spy that can be used for assertions and cleanup
 * @example
 * const listSpy = mockRepositoryMethod(repository, 'list', { items: [], nextCursor: null });
 * // ... test logic ...
 * listSpy.mockRestore();
 */
export function mockRepositoryMethod<T extends object>(
  repository: T,
  methodName: keyof T,
  mockReturnValue: any
): any {
  return jest.spyOn(repository, methodName as any).mockResolvedValueOnce(mockReturnValue);
}

/**
 * Mocks a repository method that throws an error
 * @param repository - The repository instance to mock
 * @param methodName - The name of the method to mock
 * @param error - The error to throw
 * @returns Jest spy that can be used for assertions and cleanup
 * @example
 * const listSpy = mockRepositoryMethodError(repository, 'list', new Error('Database error'));
 * // ... test logic ...
 * listSpy.mockRestore();
 */
export function mockRepositoryMethodError<T extends object>(
  repository: T,
  methodName: keyof T,
  error: Error
): any {
  return jest.spyOn(repository, methodName as any).mockRejectedValueOnce(error);
}

/**
 * Creates a mock page result for list methods
 * @param items - Array of items to return
 * @param nextCursor - Optional next cursor value
 * @returns Mock page object
 * @example
 * const mockPage = createMockPage([item1, item2], 'cursor123');
 */
export function createMockPage<T>(items: T[], nextCursor?: string) {
  return {
    items,
    nextCursor
  };
}
