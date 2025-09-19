/**
 * @file createLocalTables.ts
 * @summary Script to create DynamoDB tables for local development and testing
 * @description This script creates all necessary DynamoDB tables in DynamoDB Local
 * for development and testing purposes. It includes proper table schemas with
 * primary keys, global secondary indexes, and billing configuration.
 */

import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb";

/**
 * Creates a DynamoDB client configured for local development and testing
 * 
 * @description Configures a DynamoDB client with local endpoint and test credentials.
 * Uses environment variables for endpoint and region configuration with sensible defaults.
 * 
 * @returns DynamoDBClient instance configured for local testing
 */
const createDynamoDBClient = (): DynamoDBClient => {
  return new DynamoDBClient({
    endpoint: process.env.AWS_ENDPOINT_URL || "http://localhost:8000",
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: "fake",
      secretAccessKey: "fake"
    }
  });
};

/**
 * DynamoDB table definitions used for local development and integration tests
 * of the signature service. The design follows a single-table pattern where
 * each logical entity shares the same table using partition (pk) and sort (sk)
 * keys, plus multiple GSIs for access patterns required by the tests.
 * 
 * @description Contains 12 table definitions covering all entities in the signature
 * service: envelopes, signers, signatures, documents, parties, inputs, idempotency,
 * outbox, audit, consent, delegation, global parties, and invitation tokens.
 */
const tableDefinitions = [
  {
    TableName: "test-envelopes",
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
      { AttributeName: "gsi1pk", AttributeType: "S" },
      { AttributeName: "gsi1sk", AttributeType: "S" },
      { AttributeName: "gsi2pk", AttributeType: "S" },
      { AttributeName: "gsi2sk", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "gsi1",
        KeySchema: [
          { AttributeName: "gsi1pk", KeyType: "HASH" },
          { AttributeName: "gsi1sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      },
      {
        IndexName: "gsi2",
        KeySchema: [
          { AttributeName: "gsi2pk", KeyType: "HASH" },
          { AttributeName: "gsi2sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "test-signers",
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
      { AttributeName: "gsi1pk", AttributeType: "S" },
      { AttributeName: "gsi1sk", AttributeType: "S" },
      { AttributeName: "gsi2pk", AttributeType: "S" },
      { AttributeName: "gsi2sk", AttributeType: "S" },
      { AttributeName: "gsi3pk", AttributeType: "S" },
      { AttributeName: "gsi3sk", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "gsi1",
        KeySchema: [
          { AttributeName: "gsi1pk", KeyType: "HASH" },
          { AttributeName: "gsi1sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      },
      {
        IndexName: "gsi2",
        KeySchema: [
          { AttributeName: "gsi2pk", KeyType: "HASH" },
          { AttributeName: "gsi2sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      },
      {
        IndexName: "gsi3",
        KeySchema: [
          { AttributeName: "gsi3pk", KeyType: "HASH" },
          { AttributeName: "gsi3sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "test-signatures",
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
      { AttributeName: "gsi1pk", AttributeType: "S" },
      { AttributeName: "gsi1sk", AttributeType: "S" },
      { AttributeName: "gsi2pk", AttributeType: "S" },
      { AttributeName: "gsi2sk", AttributeType: "S" },
      { AttributeName: "gsi3pk", AttributeType: "S" },
      { AttributeName: "gsi3sk", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "gsi1",
        KeySchema: [
          { AttributeName: "gsi1pk", KeyType: "HASH" },
          { AttributeName: "gsi1sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      },
      {
        IndexName: "gsi2",
        KeySchema: [
          { AttributeName: "gsi2pk", KeyType: "HASH" },
          { AttributeName: "gsi2sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      },
      {
        IndexName: "gsi3",
        KeySchema: [
          { AttributeName: "gsi3pk", KeyType: "HASH" },
          { AttributeName: "gsi3sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "test-documents",
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
      { AttributeName: "gsi1pk", AttributeType: "S" },
      { AttributeName: "gsi1sk", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "gsi1",
        KeySchema: [
          { AttributeName: "gsi1pk", KeyType: "HASH" },
          { AttributeName: "gsi1sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "test-parties",
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
      { AttributeName: "gsi1pk", AttributeType: "S" },
      { AttributeName: "gsi1sk", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "gsi1",
        KeySchema: [
          { AttributeName: "gsi1pk", KeyType: "HASH" },
          { AttributeName: "gsi1sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "test-inputs",
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
      { AttributeName: "gsi1pk", AttributeType: "S" },
      { AttributeName: "gsi1sk", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "gsi1",
        KeySchema: [
          { AttributeName: "gsi1pk", KeyType: "HASH" },
          { AttributeName: "gsi1sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "test-idempotency",
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" }
    ],
    BillingMode: "PAY_PER_REQUEST",
    TimeToLiveSpecification: {
      AttributeName: "ttl",
      Enabled: true
    }
  },
  {
    TableName: "test-outbox",
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
      { AttributeName: "gsi1pk", AttributeType: "S" },
      { AttributeName: "gsi1sk", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "gsi1",
        KeySchema: [
          { AttributeName: "gsi1pk", KeyType: "HASH" },
          { AttributeName: "gsi1sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "test-audit",
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
      { AttributeName: "gsi1pk", AttributeType: "S" },
      { AttributeName: "gsi1sk", AttributeType: "S" },
      { AttributeName: "gsi2pk", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "gsi1",
        KeySchema: [
          { AttributeName: "gsi1pk", KeyType: "HASH" },
          { AttributeName: "gsi1sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      },
      {
        IndexName: "gsi2",
        KeySchema: [
          { AttributeName: "gsi2pk", KeyType: "HASH" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "test-consent",
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
      { AttributeName: "gsi1pk", AttributeType: "S" },
      { AttributeName: "gsi1sk", AttributeType: "S" },
      { AttributeName: "gsi2pk", AttributeType: "S" },
      { AttributeName: "gsi2sk", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "GSI1",
        KeySchema: [
          { AttributeName: "gsi1pk", KeyType: "HASH" },
          { AttributeName: "gsi1sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      },
      {
        IndexName: "GSI2",
        KeySchema: [
          { AttributeName: "gsi2pk", KeyType: "HASH" },
          { AttributeName: "gsi2sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "test-delegation",
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
      { AttributeName: "gsi1pk", AttributeType: "S" },
      { AttributeName: "gsi1sk", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "gsi1",
        KeySchema: [
          { AttributeName: "gsi1pk", KeyType: "HASH" },
          { AttributeName: "gsi1sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "test-global-parties",
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
      { AttributeName: "gsi1pk", AttributeType: "S" },
      { AttributeName: "gsi1sk", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "gsi1",
        KeySchema: [
          { AttributeName: "gsi1pk", KeyType: "HASH" },
          { AttributeName: "gsi1sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "test-invitation-tokens",
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
      { AttributeName: "gsi1pk", AttributeType: "S" },
      { AttributeName: "gsi1sk", AttributeType: "S" },
      { AttributeName: "gsi2pk", AttributeType: "S" },
      { AttributeName: "gsi2sk", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "gsi1",
        KeySchema: [
          { AttributeName: "gsi1pk", KeyType: "HASH" },
          { AttributeName: "gsi1sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      },
      {
        IndexName: "gsi2",
        KeySchema: [
          { AttributeName: "gsi2pk", KeyType: "HASH" },
          { AttributeName: "gsi2sk", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    BillingMode: "PAY_PER_REQUEST"
  }
];

/**
 * Creates a single DynamoDB table with the provided definition
 * 
 * @description Attempts to create a DynamoDB table using the provided client and
 * table definition. Handles the case where the table already exists gracefully
 * by logging a warning instead of throwing an error.
 * 
 * @param client - DynamoDB client instance for table operations
 * @param tableDefinition - Complete table definition including schema, indexes, and billing
 * @returns Promise<void> Resolves when table creation is attempted
 * @throws Error if table creation fails for reasons other than already existing
 */
const createTable = async (client: DynamoDBClient, tableDefinition: any): Promise<void> => {
  try {
    await client.send(new CreateTableCommand(tableDefinition));
    console.log(`✅ Table '${tableDefinition.TableName}' created successfully`);
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log(`⚠️  Table '${tableDefinition.TableName}' already exists`);
    } else {
      console.error(`❌ Failed to create table '${tableDefinition.TableName}':`, error.message);
      throw error;
    }
  }
};

/**
 * Lists all existing tables in the DynamoDB instance
 * 
 * @description Retrieves a list of all table names from the DynamoDB instance
 * using the provided client. Returns an empty array if no tables exist or if
 * the operation fails.
 * 
 * @param client - DynamoDB client instance for table operations
 * @returns Promise<string[]> Array of table names
 * @throws Error if the list tables operation fails
 */
const listTables = async (client: DynamoDBClient): Promise<string[]> => {
  try {
    const result = await client.send(new ListTablesCommand({}));
    return result.TableNames || [];
  } catch (error: any) {
    console.error('❌ Failed to list tables:', error.message);
    throw error;
  }
};

/**
 * Main execution function that orchestrates the table creation process
 * 
 * @description Bootstraps DynamoDB Local by creating the tables declared in
 * `tableDefinitions`. The function is idempotent: if a table already exists,
 * creation is skipped and the script proceeds with the remaining tables.
 * 
 * @returns Promise<void> Resolves when all tables are created successfully
 * @throws Exits process with code 1 if any table creation fails
 */
const main = async (): Promise<void> => {
  console.log('🚀 Starting DynamoDB Local table creation...');
  
  const client = createDynamoDBClient();
  
  try {
    // List existing tables
    const existingTables = await listTables(client);
    console.log(`📋 Found ${existingTables.length} existing tables:`, existingTables);
    
    // Create all tables
    console.log('📝 Creating tables...');
    for (const tableDefinition of tableDefinitions) {
      await createTable(client, tableDefinition);
    }
    
    console.log('✅ All tables created successfully!');
    
    // List final tables
    const finalTables = await listTables(client);
    console.log(`📋 Final table count: ${finalTables.length}`);
    
  } catch (error) {
    console.error('❌ Failed to create tables:', error);
    process.exit(1);
  }
};

/**
 * Executes the main function when this script is run directly from the command line
 */
if (require.main === module) {
  main().catch(console.error);
}

/**
 * Exports the shared utilities and table definitions for potential reuse
 * by other modules in the signature service.
 * 
 * @description Re-exports DynamoDB utilities and the local table definitions
 * for use in other parts of the application.
 */
export { createDynamoDBClient, tableDefinitions, createTable, listTables };