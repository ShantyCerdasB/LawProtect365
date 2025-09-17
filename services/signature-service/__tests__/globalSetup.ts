/**
 * @file globalSetup.ts
 * @summary Global setup for Jest tests with DynamoDB Local
 * @description This file sets up DynamoDB Local for all Jest tests.
 * It starts the DynamoDB Local server, creates tables, and ensures
 * the environment is ready for testing.
 */

import { startDynamoDBLocal, waitForDynamoDBLocal } from '../scripts/startDynamoDB';
import { createTable, tableDefinitions } from '../scripts/createLocalTables';
import { DynamoDBClient, DeleteTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';

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
    process.env.KMS_SIGNER_KEY_ID = 'test-kms-key';
    process.env.KMS_SIGNING_ALGORITHM = 'RSASSA_PSS_SHA_256';
    process.env.JWT_ISSUER = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test';
    process.env.JWT_AUDIENCE = 'test-client-id';
    process.env.JWKS_URI = 'http://localhost:3000/.well-known/jwks.json';
    
    console.log('📋 Test environment variables set');
    
    // Start DynamoDB Local
    console.log('🚀 Starting DynamoDB Local...');
    await startDynamoDBLocal();
    
    // Wait for DynamoDB Local to be ready
    console.log('⏳ Waiting for DynamoDB Local to be ready...');
    await waitForDynamoDBLocal();
    
    // Optionally delete existing test tables to ensure latest GSIs are applied
    try {
      const rawClient = new DynamoDBClient({
        endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:8000',
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: { accessKeyId: 'fake', secretAccessKey: 'fake' }
      });
      const existing = await rawClient.send(new ListTablesCommand({}));
      const toDelete = (existing.TableNames || []).filter(n => n?.startsWith('test-'));
      for (const name of toDelete) {
        try {
          await rawClient.send(new DeleteTableCommand({ TableName: name! }));
        } catch {}
      }
      // small wait for deletion
      await new Promise(r => setTimeout(r, 500));
    } catch {}

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
