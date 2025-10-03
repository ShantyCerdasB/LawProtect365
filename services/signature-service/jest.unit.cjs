/**
 * @file jest.unit.cjs
 * @summary Jest configuration for unit tests (signature-service)
 * @description Extends root jest.base.cjs with minimal overrides for unit tests.
 */

const baseConfig = require('../../jest.base.cjs');

/** @type {import('jest').Config} */
module.exports = {
  ...baseConfig,
  roots: ['<rootDir>'],
  testMatch: ['<rootDir>/__tests__/unit/**/*.test.ts'],

  // Coverage threshold: Custom thresholds per metric
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 94,
      lines: 95,
      statements: 95
    }
  },

  // Unit tests: no global setup/teardown or AWS mocks
  globalSetup: undefined,
  globalTeardown: undefined,
  setupFiles: [],
  setupFilesAfterEnv: [],

  moduleNameMapper: {
    // Mock AWS modules that are not available in test environment - MUST come first
    '^@aws/lambda-invoke-store$': '<rootDir>/__tests__/mocks/@aws/lambda-invoke-store.ts',
    // Mock uuid module to prevent ES modules issues
    '^uuid$': '<rootDir>/__tests__/mocks/uuid.ts',
    ...baseConfig.moduleNameMapper,
    '^@/(.*)\\.js$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};


