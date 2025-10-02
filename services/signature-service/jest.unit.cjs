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

  // Unit tests: no global setup/teardown or AWS mocks
  globalSetup: undefined,
  globalTeardown: undefined,
  setupFiles: [],
  setupFilesAfterEnv: [],

  // Service-local alias without duplicating base mappers
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^@/(.*)\\.js$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock AWS modules that are not available in test environment
    '^@aws/lambda-invoke-store$': '<rootDir>/__tests__/mocks/@aws/lambda-invoke-store.ts',
  },
};


