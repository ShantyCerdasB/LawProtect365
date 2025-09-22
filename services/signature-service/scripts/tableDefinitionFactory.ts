/**
 * @file tableDefinitionFactory.ts
 * @summary Factory for creating DynamoDB outbox table definition
 * @description Factory functions to create DynamoDB outbox table definition for
 * reliable messaging patterns used by shared-ts.
 */

/**
 * Common attribute definitions for outbox table
 */
const OUTBOX_ATTRIBUTES = {
  pk: { AttributeName: "pk", AttributeType: "S" },
  sk: { AttributeName: "sk", AttributeType: "S" },
  gsi1pk: { AttributeName: "gsi1pk", AttributeType: "S" },
  gsi1sk: { AttributeName: "gsi1sk", AttributeType: "S" }
};

/**
 * Primary key schema for outbox table
 */
const OUTBOX_PRIMARY_KEY_SCHEMA = [
  { AttributeName: "pk", KeyType: "HASH" },
  { AttributeName: "sk", KeyType: "RANGE" }
];

/**
 * GSI key schema for outbox table
 */
const OUTBOX_GSI_KEY_SCHEMA = [
  { AttributeName: "gsi1pk", KeyType: "HASH" },
  { AttributeName: "gsi1sk", KeyType: "RANGE" }
];

/**
 * GSI projection for outbox table
 */
const OUTBOX_GSI_PROJECTION = { ProjectionType: "ALL" };

/**
 * Billing mode for outbox table
 */
const OUTBOX_BILLING_MODE = "PAY_PER_REQUEST";

/**
 * Creates the outbox table definition for reliable messaging
 * 
 * @description Creates a DynamoDB table definition for the outbox pattern
 * used by shared-ts for reliable event publishing and message delivery guarantees.
 * 
 * @param tableName - The name of the outbox table
 * @returns DynamoDB table definition for outbox
 */
export const createOutboxTableDefinition = (tableName: string = 'test-outbox') => ({
  TableName: tableName,
  KeySchema: OUTBOX_PRIMARY_KEY_SCHEMA,
  AttributeDefinitions: [
    OUTBOX_ATTRIBUTES.pk,
    OUTBOX_ATTRIBUTES.sk,
    OUTBOX_ATTRIBUTES.gsi1pk,
    OUTBOX_ATTRIBUTES.gsi1sk
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'gsi1',
      KeySchema: OUTBOX_GSI_KEY_SCHEMA,
      Projection: OUTBOX_GSI_PROJECTION,
      BillingMode: OUTBOX_BILLING_MODE
    }
  ],
  BillingMode: OUTBOX_BILLING_MODE
});

/**
 * Creates all table definitions for local development and testing
 * 
 * @description Creates an array containing only the outbox table definition
 * for the hybrid architecture where main data is stored in PostgreSQL with Prisma
 * and outbox events are stored in DynamoDB Local.
 * 
 * @returns Array of DynamoDB table definitions
 */
export const createAllTableDefinitions = () => [
  createOutboxTableDefinition('test-outbox')
];