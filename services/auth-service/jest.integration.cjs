/**
 * @file jest.integration.cjs
 * @summary Jest configuration for auth-service with integration tests
 * @description
 * Extends the base Jest configuration from the monorepo root and adds
 * service-specific module name mappings for local aliases. Includes comprehensive
 * test environment configuration for the auth service.
 */

const baseConfig = require('../../jest.base.cjs');

/**
 * Jest configuration object for the auth service
 * 
 * @description Comprehensive Jest configuration that extends the base monorepo
 * configuration with service-specific settings for integration testing with
 * proper module resolution and AWS service mocks.
 * 
 * @type {import('jest').Config}
 */
module.exports = {
  ...baseConfig,

  /**
   * Package root directories for test file discovery
   * 
   * @description Specifies the root directory for Jest to search for test files
   * and resolve module paths relative to the auth service.
   */
  roots: ["<rootDir>"],
  
  /** Only run integration tests in the integration folder */
  testMatch: [
    "<rootDir>/__tests__/integration/**/*.test.ts",
    "<rootDir>/__tests__/integration/**/*.int.test.ts"
  ],

  /**
   * Setup files to run before the test environment is established
   * 
   * @description Loads AWS service mocks before any test environment setup
   * to ensure consistent mocking behavior across all tests.
   */
  setupFiles: ["<rootDir>/__tests__/integration/mocks/index.ts"],
  
  /**
   * Setup files to run after the test environment is established
   * 
   * @description Configures the test environment with AWS service settings
   * and mock JWKS server after Jest environment initialization is complete.
   */
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],

  /**
   * Test timeout configuration for integration tests
   * 
   * @description Extended timeout to accommodate AWS service interactions
   * during integration tests.
   */
  testTimeout: 30000,

  /**
   * Parallel test execution configuration
   * 
   * @description Runs tests in parallel with 50% of available CPU cores
   * to balance performance with resource contention from external services.
   */
  maxWorkers: '50%',

  /**
   * Process management for external service dependencies
   * 
   * @description Ensures Jest exits cleanly even when external services
   * are running and detects open handles for better debugging of resource leaks.
   */
  forceExit: true,
  detectOpenHandles: true,

  /**
   * Test path filtering configuration
   * 
   * @description Excludes disabled test directories and specific test files
   * that are not ready for execution or are temporarily disabled.
   */
  testPathIgnorePatterns: ["<rootDir>/__tests__/integration/disabled/"],

  /**
   * Module name mapping for service-specific aliases
   * 
   * @description Extends the base module name mapper with service-specific
   * path aliases. Uses @/ as the base alias for all service directories,
   * supporting both .js and non-extension imports for ESM compatibility.
   */
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    
    // Service-specific aliases (with .js variants first for ESM compatibility)
    "^@/(.*)\\.js$": "<rootDir>/src/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
