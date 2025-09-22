/**
 * @file setup.ts
 * @summary Jest setup for integration tests with hybrid database architecture
 * @description Global setup for integration tests using PostgreSQL with Prisma
 * for main data, DynamoDB Local for outbox events, and LocalStack for AWS services.
 * This provides realistic testing by using actual database services instead of mocks.
 */

import { config } from 'dotenv';
import { startMockJwksServer, stopMockJwksServer } from './integration/helpers/mockJwksServer';
import './integration/helpers/awsLocalStackConfig';
import './integration/helpers/awsRealisticMocks';

// Load environment variables from .env file
config();

// Note: Environment variables are set in globalSetup.ts
// This file only handles per-test-file setup (JWKS server, etc.)

// Ensure DATABASE_URL is configured
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required. Please configure it in your .env file.');
}

/**
 * Jest beforeAll hook to start mock JWKS server and ensure KMS test resources
 * 
 * @description Starts the mock JWKS server for JWT token validation during tests
 * and ensures KMS test key and alias exist in LocalStack for signing operations.
 * 
 * @param timeout - 10 second timeout for server startup and KMS setup
 */
beforeAll(async () => {
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
}, 10000);

/**
 * Jest afterAll hook to stop mock JWKS server
 * 
 * @description Stops the mock JWKS server after all tests complete to clean up resources.
 * 
 * @param timeout - 5 second timeout for server shutdown
 */
afterAll(async () => {
  await stopMockJwksServer();
}, 5000);

/**
 * Jest timeout configuration for integration tests
 * 
 * @description Sets a 60-second timeout for all tests to accommodate database operations,
 * AWS service interactions, and other integration test activities.
 */
jest.setTimeout(60000);