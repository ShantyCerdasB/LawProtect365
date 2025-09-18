/**
 * @file setup.ts
 * @summary Jest setup for integration tests with DynamoDB Local and LocalStack
 * @description Global setup for integration tests using real DynamoDB Local and LocalStack AWS services.
 * This provides more realistic testing by using actual AWS services instead of mocks.
 */

import { startMockJwksServer, stopMockJwksServer } from './integration/helpers/mockJwksServer';
import './integration/helpers/awsLocalStackConfig';
import './integration/helpers/awsRealisticMocks';

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
process.env.USE_LOCALSTACK_KMS = 'true';

// Set required shared-ts environment variables
process.env.PROJECT_NAME = 'lawprotect365';
process.env.SERVICE_NAME = 'signature-service';
process.env.ENVIRONMENT = 'test';

// Set test table names
process.env.ENVELOPES_TABLE = 'test-envelopes';
process.env.SIGNERS_TABLE = 'test-signers';
process.env.SIGNATURES_TABLE = 'test-signatures';
process.env.DOCUMENTS_TABLE = 'test-documents';
process.env.INPUTS_TABLE = 'test-inputs';
process.env.PARTIES_TABLE = 'test-parties';
process.env.IDEMPOTENCY_TABLE = 'test-idempotency';
process.env.OUTBOX_TABLE = 'test-outbox';
process.env.AUDIT_TABLE = 'test-audit';
process.env.CONSENT_TABLE = 'test-consent';
process.env.DELEGATION_TABLE = 'test-delegation';
process.env.GLOBAL_PARTIES_TABLE = 'test-global-parties';
process.env.INVITATION_TOKENS_TABLE = 'test-invitation-tokens';
process.env.ENVELOPES_GSI1_NAME = 'gsi1';
process.env.ENVELOPES_GSI2_NAME = 'gsi2';

// Set other test environment variables
process.env.EVIDENCE_BUCKET = 'test-evidence';
process.env.SIGNED_BUCKET = 'test-signed';
process.env.EVENTS_BUS_NAME = 'test-bus';
process.env.EVENTS_SOURCE = 'lawprotect365.signature-service.test';
process.env.KMS_SIGNING_ALGORITHM = 'RSASSA_PSS_SHA_256';

// Disable security validations that can cause flakiness in integration tests
process.env.SECURITY_ENABLE_RATE_LIMITING = 'false';
process.env.SECURITY_ENABLE_IP_VALIDATION = 'false';
process.env.SECURITY_ENABLE_USER_AGENT_VALIDATION = 'false';
process.env.SECURITY_ENABLE_GEOLOCATION_VALIDATION = 'false';
process.env.SECURITY_ENABLE_DEVICE_TRUST_VALIDATION = 'false';
process.env.SECURITY_ENABLE_SUSPICIOUS_ACTIVITY_DETECTION = 'false';
// Set generous business rate limits to avoid accidental 429s
process.env.ENVELOPE_CREATION_RATE_LIMIT = '1000000';
process.env.SIGNER_INVITATION_RATE_LIMIT = '1000000';
process.env.SIGNATURE_ATTEMPT_RATE_LIMIT = '1000000';
process.env.RATE_LIMIT_WINDOW_SECONDS = '60';

// Configure JWT for tests - use improved mock JWKS server
process.env.JWT_ISSUER = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test';
process.env.JWT_AUDIENCE = 'test-client-id';
process.env.JWKS_URI = 'http://localhost:3000/.well-known/jwks.json';

// Start improved mock JWKS server before all tests
beforeAll(async () => {
  console.log('🔐 Starting improved mock JWKS server for tests...');
  await startMockJwksServer();
  // Ensure KMS test key and alias exist in LocalStack
  try {
    const { KMSClient, CreateKeyCommand, CreateAliasCommand }: any = await import('@aws-sdk/client-kms');
    const kmsClient = new KMSClient({ region: process.env.AWS_REGION, endpoint: process.env.AWS_ENDPOINT_URL });
    const createRes = await kmsClient.send(new CreateKeyCommand({ KeyUsage: 'SIGN_VERIFY', CustomerMasterKeySpec: 'RSA_2048' }));
    const keyId = createRes?.KeyMetadata?.KeyId;
    if (keyId) {
      try {
        await kmsClient.send(new CreateAliasCommand({ AliasName: 'alias/test-key-id', TargetKeyId: keyId }));
        console.log('✅ KMS alias ensured: alias/test-key-id');
      } catch (e: any) {
        if (e?.name === 'AlreadyExistsException') {
          console.log('⚠️  KMS alias already exists: alias/test-key-id');
        } else {
          throw e;
        }
      }
    }
  } catch (err) {
    console.warn('⚠️  Failed to ensure KMS test key/alias:', (err as any)?.message);
  }
}, 10000); // 10 second timeout for server startup

// Stop mock JWKS server after all tests
afterAll(async () => {
  console.log('🔐 Stopping mock JWKS server...');
  await stopMockJwksServer();
}, 5000); // 5 second timeout for server shutdown

// Increase timeout for integration tests with DynamoDB Local
jest.setTimeout(60000); // 60 seconds for DynamoDB operations
