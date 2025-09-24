/**
 * @file createLocalTables.ts
 * @summary Script to create DynamoDB outbox table for local development and testing
 * @description This script creates the outbox table in DynamoDB Local for reliable
 * messaging patterns. The outbox table is used by shared-ts for event publishing
 * and ensures message delivery guarantees.
 */

import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { createAllTableDefinitions } from './tableDefinitionFactory';

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
 * of the signature service. The design uses a hybrid architecture where main
 * data is stored in PostgreSQL with Prisma and outbox events are stored in
 * DynamoDB Local for reliable messaging patterns.
 * 
 * @description Contains the outbox table definition used by shared-ts for
 * event publishing and message delivery guarantees. This table follows the
 * outbox pattern to ensure reliable event publishing.
 */
const tableDefinitions = createAllTableDefinitions();

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
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
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
 * Main execution function that orchestrates the outbox table creation process
 * 
 * @description Bootstraps DynamoDB Local by creating the outbox table for
 * reliable messaging patterns. The function is idempotent: if the table already
 * exists, creation is skipped.
 * 
 * @returns Promise<void> Resolves when outbox table is created successfully
 * @throws Exits process with code 1 if table creation fails
 */
const main = async (): Promise<void> => {

  
  const client = createDynamoDBClient();
  
  try {
    // List existing tables
    const existingTables = await listTables(client);

    for (const tableDefinition of tableDefinitions) {
      await createTable(client, tableDefinition);
    }
    
    // List final tables
    const finalTables = await listTables(client);
  
  } catch (error) {
    console.error('❌ Failed to create outbox table:', error);
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
 * Exports the shared utilities and outbox table definition for potential reuse
 * by other modules in the signature service.
 * 
 * @description Re-exports DynamoDB utilities and the outbox table definition
 * for use in other parts of the application.
 */
export { createDynamoDBClient, tableDefinitions, createTable, listTables };