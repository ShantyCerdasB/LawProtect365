/**
 * @fileoverview Router Factories - Factory functions for creating router test configurations
 * @summary Reusable factories for setting up React Router in tests
 * @description
 * Provides factory functions that create router configurations and mock navigation functions
 * for testing components that use React Router.
 */

import type { NavigateFunction } from 'react-router-dom';

/**
 * @description Creates a mock navigate function for testing.
 * @returns Mock NavigateFunction
 */
export function createMockNavigate(): NavigateFunction {
  return jest.fn() as unknown as NavigateFunction;
}

/**
 * @description Creates router test configuration with initial route.
 * @param path Initial path to set in the router
 * @returns Router configuration object
 */
export function createRouterConfig(path: string = '/') {
  return {
    initialEntries: [path],
    initialIndex: 0,
  };
}

/**
 * @description Creates router test configuration with multiple initial routes.
 * @param paths Array of paths to set in the router
 * @returns Router configuration object
 */
export function createRouterConfigWithHistory(paths: string[]) {
  return {
    initialEntries: paths,
    initialIndex: paths.length - 1,
  };
}
