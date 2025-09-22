/**
 * @fileoverview LambdaConfig - Configuration for Lambda functions
 * @summary Configuration types and utilities for AWS Lambda functions
 * @description Provides configuration types and utilities for Lambda functions
 * including environment variables, timeout settings, and resource allocation.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { DynamoDBClientAdapter, EventBridgeClientAdapter } from './adapters/AwsClientAdapters.js';
import { DdbClientLike } from '../aws/ddb.js';
import type { EventBridgeAdapterClient } from '../aws/eventbridge/EventBridgeConfig.js';

/**
 * Lambda configuration interface
 * Configuration options for Lambda functions
 */
export interface LambdaConfig {
  /** AWS region */
  region: string;
  /** DynamoDB table name for outbox */
  outboxTableName: string;
  /** EventBridge bus name */
  eventBusName: string;
  /** Event source identifier */
  eventSource: string;
  /** AWS access key ID */
  accessKeyId?: string;
  /** AWS secret access key */
  secretAccessKey?: string;
}

/**
 * Creates DynamoDB client adapter for Lambda functions
 * @param config - Lambda configuration
 * @returns Configured DynamoDB client adapter
 */
export function createDynamoDBClient(config: LambdaConfig): DdbClientLike {
  const client = new DynamoDBClient({
    region: config.region,
    ...(config.accessKeyId && config.secretAccessKey && {
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    })
  });
  
  return new DynamoDBClientAdapter(client);
}

/**
 * Creates EventBridge client adapter for Lambda functions
 * @param config - Lambda configuration
 * @returns Configured EventBridge client adapter
 */
export function createEventBridgeClient(config: LambdaConfig): EventBridgeAdapterClient {
  const client = new EventBridgeClient({
    region: config.region,
    ...(config.accessKeyId && config.secretAccessKey && {
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    })
  });
  
  return new EventBridgeClientAdapter(client);
}

/**
 * Loads Lambda configuration from environment variables
 * @returns Lambda configuration object
 */
export function loadLambdaConfig(): LambdaConfig {
  return {
    region: process.env.AWS_REGION || 'us-east-1',
    outboxTableName: process.env.OUTBOX_TABLE_NAME || 'outbox',
    eventBusName: process.env.EVENT_BUS_NAME || 'default-bus',
    eventSource: process.env.EVENT_SOURCE || 'lambda.event-publisher',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}
