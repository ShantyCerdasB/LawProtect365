/**
 * @file setup.ts
 * @summary Jest setup for integration tests with DynamoDB Local and LocalStack
 * @description Global setup for integration tests using real DynamoDB Local and LocalStack AWS services.
 * This provides more realistic testing by using actual AWS services instead of mocks.
 */

import { startMockJwksServer } from './integration/helpers/mockJwksServer';
import './integration/helpers/awsLocalStackConfig';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'us-east-1';

// DynamoDB Local configuration (separate from LocalStack)
process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';
process.env.DYNAMODB_ACCESS_KEY_ID = 'fake';
process.env.DYNAMODB_SECRET_ACCESS_KEY = 'fake';

// LocalStack configuration for other AWS services
process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';

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
process.env.KMS_SIGNING_ALGORITHM = 'RSASSA_PSS_SHA_256';

// Configure JWT for tests - use improved mock JWKS server
process.env.JWT_ISSUER = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test';
process.env.JWT_AUDIENCE = 'test-client-id';
process.env.JWKS_URI = 'http://localhost:3000/.well-known/jwks.json';

// Start improved mock JWKS server before all tests (only if not already running)
beforeAll(async () => {
  console.log('🔐 Starting improved mock JWKS server for tests...');
  try {
    const res = await fetch('http://localhost:3000/health');
    if (res.ok) {
      console.log('🔐 Mock JWKS server already running');
      return;
    }
  } catch (_e) {
    // Not running, start it
  }
  await startMockJwksServer();
}, 10000);

// Do not stop JWKS server to keep keys stable across suites/runs
afterAll(async () => {
  console.log('ℹ️  Leaving mock JWKS server running');
}, 5000);

// Increase timeout for integration tests with DynamoDB Local
jest.setTimeout(60000); // 60 seconds for DynamoDB operations
