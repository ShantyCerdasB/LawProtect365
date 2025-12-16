/**
 * @fileoverview Query Factories - Factory functions for creating React Query test data
 * @summary Reusable factories for creating mock query states and responses
 * @description
 * Provides factory functions that create mock React Query states (loading, success, error)
 * to avoid duplicating query mock setup across test files.
 */

import type { UseQueryResult } from '@tanstack/react-query';

/**
 * @description Creates a mock successful query result.
 * @param data Data to return in the query result
 * @param overrides Optional properties to override defaults
 * @returns Mock UseQueryResult with success state
 */
export function createMockQuerySuccess<T>(
  data: T,
  overrides?: Partial<UseQueryResult<T>>
): UseQueryResult<T> {
  return {
    data,
    isLoading: false,
    isError: false,
    isSuccess: true,
    error: null,
    isFetching: false,
    isRefetching: false,
    refetch: jest.fn(),
    ...overrides,
  } as UseQueryResult<T>;
}

/**
 * @description Creates a mock loading query result.
 * @param overrides Optional properties to override defaults
 * @returns Mock UseQueryResult with loading state
 */
export function createMockQueryLoading<T>(
  overrides?: Partial<UseQueryResult<T>>
): UseQueryResult<T> {
  return {
    data: undefined,
    isLoading: true,
    isError: false,
    isSuccess: false,
    error: null,
    isFetching: true,
    isRefetching: false,
    refetch: jest.fn(),
    ...overrides,
  } as UseQueryResult<T>;
}

/**
 * @description Creates a mock error query result.
 * @param error Error to return in the query result
 * @param overrides Optional properties to override defaults
 * @returns Mock UseQueryResult with error state
 */
export function createMockQueryError<T>(
  error: Error,
  overrides?: Partial<UseQueryResult<T>>
): UseQueryResult<T> {
  return {
    data: undefined,
    isLoading: false,
    isError: true,
    isSuccess: false,
    error,
    isFetching: false,
    isRefetching: false,
    refetch: jest.fn(),
    ...overrides,
  } as UseQueryResult<T>;
}
