/**
 * @file tableDefinitionFactory.ts
 * @summary Factory for creating DynamoDB table definitions
 * @description Factory functions to create DynamoDB table definitions with common patterns,
 * eliminating code duplication and making table creation more maintainable.
 */

/**
 * Common attribute definitions used across multiple tables
 */
const COMMON_ATTRIBUTES = {
  pk: { AttributeName: "pk", AttributeType: "S" },
  sk: { AttributeName: "sk", AttributeType: "S" },
  gsi1pk: { AttributeName: "gsi1pk", AttributeType: "S" },
  gsi1sk: { AttributeName: "gsi1sk", AttributeType: "S" },
  gsi2pk: { AttributeName: "gsi2pk", AttributeType: "S" },
  gsi2sk: { AttributeName: "gsi2sk", AttributeType: "S" },
  gsi3pk: { AttributeName: "gsi3pk", AttributeType: "S" },
  gsi3sk: { AttributeName: "gsi3sk", AttributeType: "S" }
};

/**
 * Common key schema for primary table
 */
const PRIMARY_KEY_SCHEMA = [
  { AttributeName: "pk", KeyType: "HASH" },
  { AttributeName: "sk", KeyType: "RANGE" }
];

/**
 * Common GSI key schemas
 */
const GSI_KEY_SCHEMAS = {
  gsi1: [
    { AttributeName: "gsi1pk", KeyType: "HASH" },
    { AttributeName: "gsi1sk", KeyType: "RANGE" }
  ],
  gsi2: [
    { AttributeName: "gsi2pk", KeyType: "HASH" },
    { AttributeName: "gsi2sk", KeyType: "RANGE" }
  ],
  gsi3: [
    { AttributeName: "gsi3pk", KeyType: "HASH" },
    { AttributeName: "gsi3sk", KeyType: "RANGE" }
  ]
};

/**
 * Common GSI projection
 */
const GSI_PROJECTION = { ProjectionType: "ALL" };

/**
 * Common billing mode
 */
const BILLING_MODE = "PAY_PER_REQUEST";

/**
 * Type alias for GSI names
 */
type GSIName = 'gsi1' | 'gsi2' | 'gsi3';

/**
 * Interface for table configuration
 */
interface TableConfig {
  tableName: string;
  gsis?: GSIName[];
  ttl?: {
    attributeName: string;
    enabled: boolean;
  };
}

/**
 * Interface for custom GSI configuration
 */
interface CustomGSIConfig {
  indexName: string;
  pkAttribute: string;
  skAttribute?: string;
}

/**
 * Type for DynamoDB table definition
 */
type TableDefinition = {
  TableName: string;
  KeySchema: Array<{ AttributeName: string; KeyType: string }>;
  AttributeDefinitions: Array<{ AttributeName: string; AttributeType: string }>;
  GlobalSecondaryIndexes?: Array<{
    IndexName: string;
    KeySchema: Array<{ AttributeName: string; KeyType: string }>;
    Projection: { ProjectionType: string };
  }>;
  BillingMode: string;
  TimeToLiveSpecification?: {
    AttributeName: string;
    Enabled: boolean;
  };
};

/**
 * Creates a basic table definition with common structure
 * 
 * @param tableName - The name of the table to create
 * @returns A basic table definition with primary key schema
 */
function createBaseTableDefinition(tableName: string): TableDefinition {
  return {
    TableName: tableName,
    KeySchema: [...PRIMARY_KEY_SCHEMA],
    AttributeDefinitions: [
      COMMON_ATTRIBUTES.pk,
      COMMON_ATTRIBUTES.sk
    ],
    BillingMode: BILLING_MODE
  };
}

/**
 * Creates GSI definitions based on configuration
 * 
 * @param gsis - Array of GSI names to create
 * @returns Object containing attribute definitions and GSI definitions
 */
function createGSIDefinitions(gsis: GSIName[]): {
  attributeDefinitions: Array<{ AttributeName: string; AttributeType: string }>;
  globalSecondaryIndexes: Array<{
    IndexName: string;
    KeySchema: Array<{ AttributeName: string; KeyType: string }>;
    Projection: { ProjectionType: string };
  }>;
} {
  const attributeDefinitions: Array<{ AttributeName: string; AttributeType: string }> = [
    COMMON_ATTRIBUTES.pk,
    COMMON_ATTRIBUTES.sk
  ];
  const globalSecondaryIndexes: Array<{
    IndexName: string;
    KeySchema: Array<{ AttributeName: string; KeyType: string }>;
    Projection: { ProjectionType: string };
  }> = [];

  for (const gsi of gsis) {
    // Add GSI attributes to attribute definitions
    if (gsi === 'gsi1') {
      attributeDefinitions.push(COMMON_ATTRIBUTES.gsi1pk);
      attributeDefinitions.push(COMMON_ATTRIBUTES.gsi1sk);
    } else if (gsi === 'gsi2') {
      attributeDefinitions.push(COMMON_ATTRIBUTES.gsi2pk);
      attributeDefinitions.push(COMMON_ATTRIBUTES.gsi2sk);
    } else if (gsi === 'gsi3') {
      attributeDefinitions.push(COMMON_ATTRIBUTES.gsi3pk);
      attributeDefinitions.push(COMMON_ATTRIBUTES.gsi3sk);
    }

    // Create GSI definition
    globalSecondaryIndexes.push({
      IndexName: gsi,
      KeySchema: [...GSI_KEY_SCHEMAS[gsi]],
      Projection: { ...GSI_PROJECTION }
    });
  }

  return { attributeDefinitions, globalSecondaryIndexes };
}

/**
 * Creates a complete table definition based on configuration
 * 
 * @param config - Table configuration object
 * @returns Complete DynamoDB table definition
 */
export function createTableDefinition(config: TableConfig): TableDefinition {
  const baseTable = createBaseTableDefinition(config.tableName);
  
  if (!config.gsis || config.gsis.length === 0) {
    return baseTable;
  }

  const { attributeDefinitions, globalSecondaryIndexes } = createGSIDefinitions(config.gsis);
  
  const tableDefinition: TableDefinition = {
    ...baseTable,
    AttributeDefinitions: attributeDefinitions,
    GlobalSecondaryIndexes: globalSecondaryIndexes
  };

  // Add TTL if configured
  if (config.ttl?.enabled) {
    return {
      ...tableDefinition,
      TimeToLiveSpecification: {
        AttributeName: config.ttl.attributeName,
        Enabled: true
      }
    };
  }

  return tableDefinition;
}

/**
 * Creates a table definition with custom GSI configuration
 * 
 * @param tableName - The name of the table to create
 * @param customGSIs - Array of custom GSI configurations
 * @returns Complete DynamoDB table definition with custom GSIs
 */
export function createCustomTableDefinition(
  tableName: string,
  customGSIs: CustomGSIConfig[]
): TableDefinition {
  const attributeDefinitions: Array<{ AttributeName: string; AttributeType: string }> = [
    COMMON_ATTRIBUTES.pk,
    COMMON_ATTRIBUTES.sk
  ];
  const globalSecondaryIndexes: Array<{
    IndexName: string;
    KeySchema: Array<{ AttributeName: string; KeyType: string }>;
    Projection: { ProjectionType: string };
  }> = [];

  for (const gsi of customGSIs) {
    // Add custom attributes
    attributeDefinitions.push({ AttributeName: gsi.pkAttribute, AttributeType: "S" });
    if (gsi.skAttribute) {
      attributeDefinitions.push({ AttributeName: gsi.skAttribute, AttributeType: "S" });
    }

    // Create GSI definition
    const keySchema = [
      { AttributeName: gsi.pkAttribute, KeyType: "HASH" }
    ];
    
    if (gsi.skAttribute) {
      keySchema.push({ AttributeName: gsi.skAttribute, KeyType: "RANGE" });
    }

    globalSecondaryIndexes.push({
      IndexName: gsi.indexName,
      KeySchema: keySchema,
      Projection: { ...GSI_PROJECTION }
    });
  }

  return {
    TableName: tableName,
    KeySchema: [...PRIMARY_KEY_SCHEMA],
    AttributeDefinitions: attributeDefinitions,
    GlobalSecondaryIndexes: globalSecondaryIndexes,
    BillingMode: BILLING_MODE
  };
}

/**
 * Predefined table configurations for the signature service
 */
export const TABLE_CONFIGS = {
  ENVELOPES: { tableName: "test-envelopes", gsis: ['gsi1', 'gsi2'] as GSIName[] },
  SIGNERS: { tableName: "test-signers", gsis: ['gsi1', 'gsi2', 'gsi3'] as GSIName[] },
  SIGNATURES: { tableName: "test-signatures", gsis: ['gsi1', 'gsi2', 'gsi3'] as GSIName[] },
  DOCUMENTS: { tableName: "test-documents", gsis: ['gsi1'] as GSIName[] },
  PARTIES: { tableName: "test-parties", gsis: ['gsi1'] as GSIName[] },
  INPUTS: { tableName: "test-inputs", gsis: ['gsi1'] as GSIName[] },
  IDEMPOTENCY: { 
    tableName: "test-idempotency", 
    gsis: [] as GSIName[],
    ttl: { attributeName: "ttl", enabled: true }
  },
  OUTBOX: { tableName: "test-outbox", gsis: ['gsi1'] as GSIName[] },
  AUDIT: { tableName: "test-audit", gsis: ['gsi1'] as GSIName[] },
  CONSENT: { tableName: "test-consent", gsis: ['gsi1', 'gsi2'] as GSIName[] },
  DELEGATION: { tableName: "test-delegation", gsis: ['gsi1'] as GSIName[] },
  GLOBAL_PARTIES: { tableName: "test-global-parties", gsis: ['gsi1'] as GSIName[] },
  INVITATION_TOKENS: { tableName: "test-invitation-tokens", gsis: ['gsi1', 'gsi2'] as GSIName[] }
};

/**
 * Creates all table definitions for the signature service
 * 
 * @returns Array of complete DynamoDB table definitions
 */
export function createAllTableDefinitions(): TableDefinition[] {
  const tables: TableDefinition[] = [];

  // Standard tables
  for (const [key, config] of Object.entries(TABLE_CONFIGS)) {
    if (key === 'AUDIT') {
      // Special case for audit table with custom GSI2
      tables.push(createCustomTableDefinition(config.tableName, [
        { indexName: "gsi1", pkAttribute: "gsi1pk", skAttribute: "gsi1sk" },
        { indexName: "gsi2", pkAttribute: "gsi2pk" }
      ]));
    } else if (key === 'CONSENT') {
      // Special case for consent table with uppercase GSI names
      tables.push(createCustomTableDefinition(config.tableName, [
        { indexName: "GSI1", pkAttribute: "gsi1pk", skAttribute: "gsi1sk" },
        { indexName: "GSI2", pkAttribute: "gsi2pk", skAttribute: "gsi2sk" }
      ]));
    } else {
      tables.push(createTableDefinition(config));
    }
  }

  return tables;
}