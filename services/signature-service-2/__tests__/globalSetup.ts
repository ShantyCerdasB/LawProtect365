/**
 * @file globalSetup.ts
 * @summary Global setup for Jest tests with DynamoDB Local
 * @description This file sets up DynamoDB Local for all Jest tests.
 * It starts the DynamoDB Local server, creates tables, and ensures
 * the environment is ready for testing.
 */

import { startDynamoDBLocal, waitForDynamoDBLocal, isDynamoDBLocalRunning } from '../scripts/startDynamoDB';
import { createTable, tableDefinitions } from '../scripts/createLocalTables';

/**
 * @description Global setup function for Jest
 * This function runs once before all tests
 */
export default async function globalSetup() {
  console.log('🚀 Starting global test setup...');
  
  try {
    // Set test environment variables
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
    process.env.JWT_ISSUER = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test';
    process.env.JWT_AUDIENCE = 'test-client-id';
    process.env.JWKS_URI = 'http://localhost:3000/.well-known/jwks.json';
    
    console.log('📋 Test environment variables set');
    
    // Start DynamoDB Local only if not running
    const alreadyRunning = await isDynamoDBLocalRunning();
    if (alreadyRunning) {
      console.log('✅ DynamoDB Local is already running');
    } else {
      console.log('🚀 Starting DynamoDB Local...');
      await startDynamoDBLocal();
      console.log('⏳ Waiting for DynamoDB Local to be ready...');
      await waitForDynamoDBLocal();
    }
    
    // Create test tables
    console.log('📝 Creating test tables...');
    const { createDynamoDBClient } = await import('../scripts/createLocalTables');
    const client = createDynamoDBClient();
    
    // Create tables with test prefixes
    const testTableDefinitions = tableDefinitions.map(table => ({
      ...table,
      TableName: table.TableName.replace('local-', 'test-')
    }));
    
    for (const tableDefinition of testTableDefinitions) {
      await createTable(client, tableDefinition);
    }
    
    console.log('✅ Global test setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  }
}
