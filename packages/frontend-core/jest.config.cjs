/**
 * @file jest.config.cjs
 * @summary Jest setup for TypeScript units and coverage in frontend-core package.
 * @description
 * Extends the base Jest configuration from the monorepo root and adds
 * package-specific module name mappings for local aliases.
 */

const baseConfig = require('../../jest.base.cjs');

/** @type {import('jest').Config} */
module.exports = {
  ...baseConfig,

  /** Package root for glob resolution */
  roots: ['<rootDir>'],

  /**
   * Override base moduleNameMapper with package-specific aliases.
   * The frontend-core package has its own internal aliases that point to its own src.
   */
  moduleNameMapper: {
    // strip .js on relative imports (./foo.js -> ./foo) - MUST come first
    '^(\\.{1,2}/.*)\\.js$': '$1',

    // Mock @tanstack/react-query to avoid requiring the real dependency in this workspace
    '^@tanstack/react-query$': '<rootDir>/__mocks__/@tanstack/react-query.js',

    // frontend-core internal aliases - must come before baseConfig mappings
    '^@foundation/(.*)\\.js$': '<rootDir>/src/foundation/$1',
    '^@foundation/(.*)$': '<rootDir>/src/foundation/$1',

    '^@ports/(.*)\\.js$': '<rootDir>/src/ports/$1',
    '^@ports/(.*)$': '<rootDir>/src/ports/$1',

    '^@modules/(.*)\\.js$': '<rootDir>/src/modules/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  },

  /** Test file globs */
  testMatch: ['<rootDir>/__tests__/**/*.test.ts', '<rootDir>/__tests__/**/*.test.tsx'],

  /** Test environment - use node for most tests */
  testEnvironment: 'node',
};
