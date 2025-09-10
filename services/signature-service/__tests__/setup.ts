/**
 * @file setup.ts
 * @summary Jest setup for integration tests with DynamoDB Local
 * @description Global setup for integration tests using real DynamoDB Local instead of mocks.
 * This provides more realistic testing by using actual DynamoDB operations.
 */

import { startMockJwksServer, stopMockJwksServer } from './integration/helpers/mockJwksServer';
import './integration/helpers/awsMocksMinimal';

// Set test environment variables for DynamoDB Local
process.env.NODE_ENV = 'test';
process.env.AWS_ENDPOINT_URL = 'http://localhost:8000';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'fake';
process.env.AWS_SECRET_ACCESS_KEY = 'fake';

// Set required shared-ts environment variables
process.env.PROJECT_NAME = 'lawprotect365';
process.env.SERVICE_NAME = 'signature-service';
process.env.ENVIRONMENT = 'test';

// Set test table names
process.env.ENVELOPES_TABLE = 'test-envelopes';
process.env.DOCUMENTS_TABLE = 'test-documents';
process.env.INPUTS_TABLE = 'test-inputs';
process.env.PARTIES_TABLE = 'test-parties';
process.env.IDEMPOTENCY_TABLE = 'test-idempotency';
process.env.OUTBOX_TABLE = 'test-outbox';
process.env.AUDIT_TABLE = 'test-audit';
process.env.CONSENT_TABLE = 'test-consent';
process.env.DELEGATION_TABLE = 'test-delegation';
process.env.GLOBAL_PARTIES_TABLE = 'test-global-parties';

// Set other test environment variables
process.env.EVIDENCE_BUCKET = 'test-evidence';
process.env.SIGNED_BUCKET = 'test-signed';
process.env.EVENTS_BUS_NAME = 'test-bus';
process.env.EVENTS_SOURCE = 'lawprotect365.signature-service.test';
process.env.KMS_SIGNER_KEY_ID = 'test-kms-key';
process.env.KMS_SIGNING_ALGORITHM = 'RSASSA_PSS_SHA_256';

// Configure JWT for tests - use mock JWKS server
process.env.JWT_ISSUER = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test';
process.env.JWT_AUDIENCE = 'test-client-id';
process.env.JWKS_URI = 'http://localhost:3000/.well-known/jwks.json';

// Start mock JWKS server before all tests
beforeAll(async () => {
  console.log('🔐 Starting mock JWKS server for tests...');
  await startMockJwksServer();
}, 10000); // 10 second timeout for server startup

// Stop mock JWKS server after all tests
afterAll(async () => {
  console.log('🔐 Stopping mock JWKS server...');
  await stopMockJwksServer();
}, 5000); // 5 second timeout for server shutdown

// Increase timeout for integration tests with DynamoDB Local
jest.setTimeout(60000); // 60 seconds for DynamoDB operations
