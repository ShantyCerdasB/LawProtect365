/**
 * @file jest.config.cjs
 * @summary Jest setup for TypeScript units and coverage in signature-service with DynamoDB Local.
 * @description
 * Extends the base Jest configuration from the monorepo root and adds
 * service-specific module name mappings for local aliases.
 * Includes global setup and teardown for DynamoDB Local integration tests.
 */

const baseConfig = require('../../jest.base.cjs');

/** @type {import('jest').Config} */
module.exports = {
  ...baseConfig,

  /** Package root for glob resolution */
  roots: ["<rootDir>"],

  /** Setup files to run before tests */
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],

  /** Global setup and teardown for DynamoDB Local */
  globalSetup: "<rootDir>/__tests__/globalSetup.ts",
  globalTeardown: "<rootDir>/__tests__/globalTeardown.ts",

  /** Test timeout for integration tests with DynamoDB Local */
  testTimeout: 60000,

  /**
   * Extend base moduleNameMapper with service-specific aliases.
   * Uses @/ as base alias for all service directories.
   */
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    
    // Service-specific aliases (with .js variants first)
    "^@/(.*)\\.js$": "<rootDir>/src/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
