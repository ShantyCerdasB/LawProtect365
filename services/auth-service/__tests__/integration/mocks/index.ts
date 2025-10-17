/**
 * @fileoverview mocks/index - Mock setup for integration tests
 * @summary AWS service mocks and test environment setup
 * @description Sets up AWS service mocks and test environment configuration
 * for integration tests to ensure consistent behavior.
 */

// AWS SDK mocks
jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: jest.fn(),
  AdminGetUserCommand: jest.fn(),
  AdminEnableUserCommand: jest.fn(),
  AdminDisableUserCommand: jest.fn(),
  AdminUserGlobalSignOutCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(),
  PutItemCommand: jest.fn(),
  GetItemCommand: jest.fn(),
  QueryCommand: jest.fn(),
  UpdateItemCommand: jest.fn(),
  DeleteItemCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-eventbridge', () => ({
  EventBridgeClient: jest.fn(),
  PutEventsCommand: jest.fn(),
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';

// Mock console methods to reduce noise in tests
const mockConsole = global.console;
global.console = {
  ...mockConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as any;
