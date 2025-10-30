/**
 * @fileoverview setup.ts - Jest setup for auth-service tests
 * @summary Test environment setup and global configurations
 * @description Configures the test environment with necessary mocks,
 * global variables, and test utilities for auth-service tests.
 */

// Set test environment variables FIRST - before any imports
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://admin:admin@localhost:5432/lawprotect365?schema=public';

// Required environment variables for shared-ts - MUST be set before any imports
process.env.PROJECT_NAME = 'lawprotect';
process.env.SERVICE_NAME = 'auth-service';
process.env.AWS_REGION = 'us-east-1';
process.env.ENV = 'test';

// Additional environment variables that might be required
process.env.JWT_ISSUER = 'https://test.lawprotect.com';
process.env.JWT_AUDIENCE = 'test-audience';

// AWS Configuration for tests
process.env.COGNITO_USER_POOL_ID = 'test-pool-id';
process.env.COGNITO_CLIENT_ID = 'test-client-id';
process.env.EVENTBRIDGE_BUS_NAME = 'test-bus';
process.env.OUTBOX_TABLE_NAME = 'test-outbox';

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as any;

// Global test timeout
jest.setTimeout(30000);
