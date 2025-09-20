/**
 * @file jest.config.cjs
 * @summary Jest configuration for signature-service with DynamoDB Local integration
 * @description
 * Extends the base Jest configuration from the monorepo root and adds
 * service-specific module name mappings for local aliases. Includes global
 * setup and teardown for DynamoDB Local integration tests, AWS service mocks,
 * and comprehensive test environment configuration for the signature service.
 */

const baseConfig = require('../../jest.base.cjs');

/**
 * Jest configuration object for the signature service
 * 
 * @description Comprehensive Jest configuration that extends the base monorepo
 * configuration with service-specific settings for integration testing with
 * DynamoDB Local, AWS service mocks, and proper module resolution.
 * 
 * @type {import('jest').Config}
 */
module.exports = {
  ...baseConfig,

  /**
   * Package root directories for test file discovery
   * 
   * @description Specifies the root directory for Jest to search for test files
   * and resolve module paths relative to the signature service.
   */
  roots: ["<rootDir>"],
  
  /** Only run integration tests in the integration folder */
  testMatch: ["<rootDir>/__tests__/integration/**/*.test.ts"],

  /**
   * Setup files to run before the test environment is established
   * 
   * @description Loads AWS realistic mocks before any test environment setup
   * to ensure consistent mocking behavior across all tests.
   */
  setupFiles: ["<rootDir>/__tests__/integration/helpers/awsRealisticMocks.ts"],
  
  /**
   * Setup files to run after the test environment is established
   * 
   * @description Configures the test environment with LocalStack endpoints,
   * DynamoDB Local settings, and mock JWKS server after Jest environment
   * initialization is complete.
   */
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],

  /**
   * Global setup and teardown for DynamoDB Local lifecycle management
   * 
   * @description Manages the complete lifecycle of DynamoDB Local including
   * starting the server, creating tables, and cleaning up resources after
   * all tests complete.
   */
  globalSetup: "<rootDir>/__tests__/globalSetup.ts",
  globalTeardown: "<rootDir>/__tests__/globalTeardown.ts",

  /**
   * Test timeout configuration for integration tests
   * 
   * @description Extended timeout to accommodate DynamoDB Local startup,
   * table creation, and AWS service interactions during integration tests.
   */
  testTimeout: 60000,

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
   * (DynamoDB Local, LocalStack) are running and detects open handles
   * for better debugging of resource leaks.
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
