/**
 * @fileoverview GlobalSetup - Jest global setup for integration test environment
 * @summary Initializes complete test environment with PostgreSQL and DynamoDB Local
 * @description Configures and starts the complete test environment for Jest integration tests.
 * Sets up PostgreSQL database with Prisma migrations, starts DynamoDB Local for outbox events,
 * and configures all necessary environment variables for testing.
 */

import { config } from 'dotenv';
import { startDynamoDBLocal, waitForDynamoDBLocal } from '../scripts/startDynamoDB';
import { createTable, tableDefinitions } from '../scripts/createLocalTables';
import { runMigrations, seedDatabase } from '../scripts/setupLocalDatabase';
import { DynamoDBClient, DeleteTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';

// Load environment variables from .env file
config();

/**
 * Initializes the complete test environment for Jest integration tests
 * 
 * @description Executes once before all tests to prepare the test environment.
 * Configures environment variables, runs database migrations, starts DynamoDB Local
 * for outbox events, and creates necessary database tables.
 * 
 * @returns Promise<void> Resolves when test environment is fully prepared
 * @throws Error when setup fails, causing all tests to be skipped
 */
export default async function globalSetup(): Promise<void> {
  try {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.AWS_REGION = 'us-east-1';
    
    // Set required shared-ts environment variables
    process.env.PROJECT_NAME = 'lawprotect365';
    process.env.SERVICE_NAME = 'signature-service';
    process.env.ENVIRONMENT = 'test';
    
    // Set database configuration (Prisma) - uses real database from .env
    // DATABASE_URL should be configured in .env file
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required. Please configure it in your .env file.');
    }
    
    // Set S3 configuration (LocalStack)
    process.env.S3_BUCKET_NAME = 'test-evidence';
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_ACCESS_KEY_ID = 'test';
    process.env.S3_SECRET_ACCESS_KEY = 'test';
    
    // Set KMS configuration (LocalStack)
    process.env.KMS_SIGNER_KEY_ID = 'alias/test-key-id';
    process.env.KMS_SIGNING_ALGORITHM = 'RSASSA_PSS_SHA_256';
    process.env.KMS_REGION = 'us-east-1';
    process.env.KMS_ACCESS_KEY_ID = 'test';
    process.env.KMS_SECRET_ACCESS_KEY = 'test';
    
    // Set EventBridge configuration (LocalStack)
    process.env.EVENTBRIDGE_BUS_NAME = 'test-bus';
    process.env.EVENTBRIDGE_SOURCE = 'lawprotect365.signature-service.test';
    
    // Set outbox table (DynamoDB Local)
    process.env.OUTBOX_TABLE = 'test-outbox';
    
    // Set JWT configuration
    process.env.JWT_ISSUER = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test';
    process.env.JWT_AUDIENCE = 'test-client-id';
    process.env.JWKS_URI = 'http://localhost:3000/.well-known/jwks.json';
    
    // Set required environment variables for shared-ts validation
    process.env.PROJECT_NAME = 'lawprotect365';
    process.env.SERVICE_NAME = 'signature-service';
    process.env.AWS_REGION = 'us-east-1';
    process.env.ENV = 'dev';
    process.env.LOG_LEVEL = 'info';
    
    // AWS services now use mocks (no LocalStack needed)
    // process.env.AWS_ENDPOINT_URL = 'http://localhost:4566'; // Removed - using mocks
    // process.env.USE_LOCALSTACK_KMS = 'true'; // Removed - using mocks
    // process.env.USE_LOCALSTACK_EVENTBRIDGE = 'true'; // Removed - using mocks
    
    // Set DynamoDB Local configuration (for outbox only)
    process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';
    process.env.DYNAMODB_ACCESS_KEY_ID = 'fake';
    process.env.DYNAMODB_SECRET_ACCESS_KEY = 'fake';
    
    await runMigrations();
    await seedDatabase();
    
    // Start DynamoDB Local for outbox

    await startDynamoDBLocal();
    
    // Wait for DynamoDB Local to be ready

    await waitForDynamoDBLocal();
    
    // Clean existing outbox tables
    try {
      const rawClient = new DynamoDBClient({
        endpoint: 'http://localhost:8000',
        region: 'us-east-1',
        credentials: { accessKeyId: 'fake', secretAccessKey: 'fake' }
      });
      const existing = await rawClient.send(new ListTablesCommand({}));
      const toDelete = (existing.TableNames || []).filter(n => n?.startsWith('test-'));
      for (const name of toDelete) {
        try {
          await rawClient.send(new DeleteTableCommand({ TableName: name! }));
        } catch {}
      }
      await new Promise(r => setTimeout(r, 500));
    } catch {}


    const { createDynamoDBClient } = await import('../scripts/createLocalTables');
    const client = createDynamoDBClient();
    
    for (const tableDefinition of tableDefinitions) {
      await createTable(client, tableDefinition);
    }
    
    
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  }
}