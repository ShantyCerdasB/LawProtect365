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
  /** Maximum number of events to process in parallel */
  maxConcurrency?: number;
  /** Maximum number of retries for failed events */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  retryDelayMs?: number;
}

/**
 * Creates DynamoDB client adapter for Lambda functions
 * @param config - Lambda configuration
 * @returns Configured DynamoDB client adapter
 */
export function createDynamoDBClient(config: LambdaConfig): DdbClientLike {
  const client = new DynamoDBClient({
    region: config.region
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
    region: config.region
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
    eventSource: process.env.EVENT_SOURCE || 'lambda.outbox-stream',
    maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || '10'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000')
  };
}
