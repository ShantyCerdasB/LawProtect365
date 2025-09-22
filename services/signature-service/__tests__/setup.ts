/**
 * @fileoverview Setup - Jest per-test-file setup for integration tests
 * @summary Configures Jest hooks and mock services for integration tests
 * @description Sets up Jest hooks for mock JWKS server management and configures
 * AWS service mocks for integration tests using PostgreSQL and DynamoDB Local.
 */

import { config } from 'dotenv';
import { startMockJwksServer, stopMockJwksServer } from './integration/mocks/cognito/jwksMock';
// Load all mocks from centralized location
import './integration/mocks';

// Load environment variables from .env file
config();

// Note: Environment variables are set in globalSetup.ts
// This file only handles per-test-file setup (JWKS server, etc.)

// Ensure DATABASE_URL is configured
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required. Please configure it in your .env file.');
}

/**
 * Starts mock JWKS server for JWT token validation during tests
 * 
 * @description Jest beforeAll hook that starts the mock JWKS server for JWT token
 * validation. KMS operations are handled by mocks configured in awsRealisticMocks.
 * 
 * @param timeout - 10 second timeout for server startup
 */
beforeAll(async () => {
  await startMockJwksServer();
  
  // KMS operations are now handled by mocks - no LocalStack setup needed
  console.log('✅ Mock JWKS server started - KMS operations use mocks');
}, 10000);

/**
 * Stops mock JWKS server after all tests complete
 * 
 * @description Jest afterAll hook that stops the mock JWKS server to clean up resources
 * after all tests in the current test file complete.
 * 
 * @param timeout - 5 second timeout for server shutdown
 */
afterAll(async () => {
  await stopMockJwksServer();
}, 5000);

/**
 * Configures Jest timeout for integration tests
 * 
 * @description Sets a 60-second timeout for all tests to accommodate database operations,
 * AWS service interactions, and other integration test activities.
 */
jest.setTimeout(60000);