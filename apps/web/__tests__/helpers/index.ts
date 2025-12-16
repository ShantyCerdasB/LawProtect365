/**
 * @fileoverview Test Helpers - Barrel export for test utilities
 * @summary Centralized exports for test helpers and mocks
 * @description
 * Main entry point for all test helpers, mocks, fixtures, factories, and utilities.
 * Import from this file to access all testing infrastructure in a single import.
 * 
 * Note: Legacy files (mocks.ts, fixtures.ts, test-helpers.ts) are deprecated.
 * Use utilities from ./utils, ./mocks, ./fixtures, and ./factories instead.
 */

export * from './mocks/index';
export * from './fixtures/index';
export * from './factories';
export {
  renderWithProviders,
  createQueryClientWrapper,
  createRouterWrapper,
  createAppWrapper,
} from './utils/renderUtils';
export * from './utils/assertions';
export * from './utils/waitUtils';
export * from './utils/queryUtils';
export * from './utils/formUtils';











