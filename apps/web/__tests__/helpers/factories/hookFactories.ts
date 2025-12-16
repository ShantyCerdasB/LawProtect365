/**
 * @fileoverview Hook Factories - Factory functions for creating hook test configurations
 * @summary Reusable factories for setting up hook test environments
 * @description
 * Provides factory functions that create configurations for testing React hooks.
 * These factories help standardize hook test setup and reduce duplication.
 */

import type { QueryClient } from '@tanstack/react-query';

/**
 * @description Configuration for creating a test QueryClient.
 */
export interface TestQueryClientConfig {
  retry?: boolean;
  cacheTime?: number;
  staleTime?: number;
  defaultOptions?: {
    queries?: {
      retry?: boolean;
      cacheTime?: number;
      staleTime?: number;
    };
  };
}

/**
 * @description Creates a test QueryClient configuration.
 * @param config Optional configuration overrides
 * @returns QueryClient configuration object
 */
export function createTestQueryClientConfig(
  config?: TestQueryClientConfig
): TestQueryClientConfig {
  return {
    retry: false,
    cacheTime: 0,
    staleTime: 0,
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
    },
    ...config,
  };
}

/**
 * @description Creates router test configuration.
 */
export interface RouterTestConfig {
  initialEntries?: string[];
  initialIndex?: number;
}

/**
 * @description Creates a router test configuration.
 * @param config Optional configuration overrides
 * @returns Router configuration object
 */
export function createRouterTestConfig(config?: RouterTestConfig): RouterTestConfig {
  return {
    initialEntries: ['/'],
    initialIndex: 0,
    ...config,
  };
}
