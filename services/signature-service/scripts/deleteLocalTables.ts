/**
 * @file deleteLocalTables.ts
 * @summary Script to delete all DynamoDB Local tables
 * @description Deletes all tables from DynamoDB Local for clean setup
 */

import { DynamoDBClient, DeleteTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const createDynamoDBClient = (): DynamoDBClient => {
  return new DynamoDBClient({
    endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:8000',
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fake',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fake',
    },
  });
};

const deleteTable = async (client: DynamoDBClient, tableName: string): Promise<void> => {
  try {
    await client.send(new DeleteTableCommand({ TableName: tableName }));
    console.log(`✅ Table '${tableName}' deleted successfully`);
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      console.log(`⚠️  Table '${tableName}' does not exist`);
    } else {
      console.error(`❌ Failed to delete table '${tableName}':`, error.message);
    }
  }
};

const main = async (): Promise<void> => {
  console.log('🗑️  Starting DynamoDB Local table deletion...');
  
  const client = createDynamoDBClient();
  
  // List of all table names to delete
  const tableNames = [
    'test-envelopes',
    'test-documents', 
    'test-inputs',
    'test-parties',
    'test-idempotency',
    'test-outbox',
    'test-audit',
    'test-consent',
    'test-delegation',
    'test-global-parties',
    'local-envelopes',
    'local-documents',
    'local-inputs', 
    'local-parties',
    'local-idempotency',
    'local-outbox',
    'local-audit',
    'local-consent',
    'local-delegation',
    'local-global-parties'
  ];
  
  console.log('🗑️  Deleting tables...');
  
  for (const tableName of tableNames) {
    await deleteTable(client, tableName);
  }
  
  console.log('✅ All tables deleted successfully!');
};

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
