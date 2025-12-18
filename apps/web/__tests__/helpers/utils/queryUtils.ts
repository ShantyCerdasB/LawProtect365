/**
 * @fileoverview Query Testing Utilities - Utilities for testing React Query hooks
 * @summary Reusable utilities for testing components and hooks that use React Query
 * @description
 * Provides utilities for testing React Query hooks, query states, mutations, and
 * query invalidation. These utilities help test async data fetching and caching behavior.
 */

import React from 'react';
import { QueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { renderHook, type RenderHookResult } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../mocks/reactQueryMocks';

/**
 * @description Options for rendering React Query hooks.
 */
export interface RenderQueryHookOptions {
  queryClient?: QueryClient;
  wrapper?: (props: { children: ReactNode }) => ReactNode;
}

/**
 * @description Renders a React Query hook with a test QueryClient.
 * @param hook Hook function to render
 * @param options Optional configuration for QueryClient and wrapper
 * @returns RenderHookResult with query hook result
 */
export function renderQueryHook<TResult, TError = Error>(
  hook: () => UseQueryResult<TResult, TError>,
  options?: RenderQueryHookOptions
): RenderHookResult<UseQueryResult<TResult, TError>, unknown> {
  const queryClient = options?.queryClient || createTestQueryClient();
  const wrapper = options?.wrapper || (({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );

  return renderHook(hook, { wrapper });
}

/**
 * @description Renders a React Query mutation hook with a test QueryClient.
 * @param hook Hook function to render
 * @param options Optional configuration for QueryClient and wrapper
 * @returns RenderHookResult with mutation hook result
 */
export function renderMutationHook<TData, TError = Error, TVariables = unknown>(
  hook: () => UseMutationResult<TData, TError, TVariables>,
  options?: RenderQueryHookOptions
): RenderHookResult<UseMutationResult<TData, TError, TVariables>, unknown> {
  const queryClient = options?.queryClient || createTestQueryClient();
  const wrapper = options?.wrapper || (({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );

  return renderHook(hook, { wrapper });
}

/**
 * @description Waits for a query to be in a specific state.
 * @param queryClient QueryClient instance
 * @param queryKey Query key to wait for
 * @param expectedState Expected query state ('loading' | 'success' | 'error')
 * @param timeout Timeout in milliseconds
 * @returns Promise that resolves when query reaches expected state
 * @throws Error if query doesn't reach expected state within timeout
 */
export async function waitForQueryState(
  queryClient: QueryClient,
  queryKey: unknown[],
  expectedState: 'loading' | 'success' | 'error',
  timeout: number = 1000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const cache = (queryClient as any).queryCache;
    if (cache) {
      const query = cache.find({ queryKey });
      
      if (expectedState === 'loading' && query?.state?.status === 'pending') {
        return;
      }
      if (expectedState === 'success' && query?.state?.status === 'success') {
        return;
      }
      if (expectedState === 'error' && query?.state?.status === 'error') {
        return;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Query did not reach ${expectedState} state within ${timeout}ms`);
}

/**
 * @description Asserts that a query is in the loading state.
 * @param queryResult Query result from useQuery hook
 * @throws Error if query is not in loading state
 */
export function assertQueryLoading<TData, TError = Error>(
  queryResult: UseQueryResult<TData, TError>
): void {
  expect(queryResult.isLoading).toBe(true);
  expect(queryResult.isFetching).toBe(true);
  expect(queryResult.data).toBeUndefined();
}

/**
 * @description Asserts that a query is in the success state with data.
 * @param queryResult Query result from useQuery hook
 * @param expectedData Optional expected data to assert
 * @throws Error if query is not in success state or data doesn't match
 */
export function assertQuerySuccess<TData, TError = Error>(
  queryResult: UseQueryResult<TData, TError>,
  expectedData?: TData
): void {
  expect(queryResult.isSuccess).toBe(true);
  expect(queryResult.isLoading).toBe(false);
  expect(queryResult.error).toBeNull();
  expect(queryResult.data).toBeDefined();

  if (expectedData !== undefined) {
    expect(queryResult.data).toEqual(expectedData);
  }
}

/**
 * @description Asserts that a query is in the error state.
 * @param queryResult Query result from useQuery hook
 * @param expectedError Optional expected error message or object
 * @throws Error if query is not in error state or error doesn't match
 */
export function assertQueryError<TData, TError = Error>(
  queryResult: UseQueryResult<TData, TError>,
  expectedError?: string | TError
): void {
  expect(queryResult.isError).toBe(true);
  expect(queryResult.isLoading).toBe(false);
  expect(queryResult.data).toBeUndefined();
  expect(queryResult.error).toBeDefined();

  if (expectedError !== undefined) {
    if (typeof expectedError === 'string') {
      expect((queryResult.error as Error).message).toContain(expectedError);
    } else {
      expect(queryResult.error).toEqual(expectedError);
    }
  }
}



