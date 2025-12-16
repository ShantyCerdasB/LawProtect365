/**
 * @fileoverview React Query Mocks - Mock implementations for React Query
 * @summary Reusable mocks and utilities for testing React Query hooks
 * @description
 * Provides mock implementations and utilities for testing components and hooks
 * that use React Query. Includes QueryClient factories and mock query states.
 */

import { QueryClient } from '@tanstack/react-query';
import type { TestQueryClientConfig } from '../factories/hookFactories';
import { createTestQueryClientConfig } from '../factories/hookFactories';

/**
 * @description Creates a QueryClient configured for testing.
 * @param config Optional configuration overrides
 * @returns QueryClient instance with test-friendly defaults
 */
export function createTestQueryClient(
  config?: TestQueryClientConfig
): QueryClient {
  const testConfig = createTestQueryClientConfig(config);
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: testConfig.retry ?? false,
        cacheTime: testConfig.cacheTime ?? 0,
        staleTime: testConfig.staleTime ?? 0,
        ...testConfig.defaultOptions?.queries,
      },
    },
  });
}
