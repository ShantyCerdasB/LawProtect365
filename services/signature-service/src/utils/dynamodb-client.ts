/**
 * @fileoverview DynamoDB client factory - Creates DynamoDB client from config
 * @summary Factory for creating DynamoDB client instances
 * @description Creates DynamoDB client instances based on configuration
 * for different environments (local, development, production).
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { DdbClientLike } from '@lawprotect/shared-ts';
import type { DynamoDBConfig } from '../config/AppConfig';

/**
 * Creates a DynamoDB client from configuration
 * 
 * @param config - DynamoDB configuration
 * @returns DynamoDB client instance
 */
export function createDynamoDBClient(config: DynamoDBConfig): DdbClientLike {
  const clientConfig: any = {
    region: config.region
  };

  // Add local configuration if needed
  if (config.useLocal && config.endpoint) {
    clientConfig.endpoint = config.endpoint;
    clientConfig.credentials = config.credentials;
  }

  // Create low-level client
  const client = new DynamoDBClient(clientConfig);
  
  // Create document client (higher-level)
  const docClient = DynamoDBDocumentClient.from(client);
  
  // Return as DdbClientLike
  return docClient as unknown as DdbClientLike;
}
