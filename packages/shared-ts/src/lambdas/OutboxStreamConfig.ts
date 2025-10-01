/**
 * @fileoverview OutboxStreamConfig - Configuration for DynamoDB Streams processing
 * @summary Configuration types and utilities for outbox stream processing
 * @description Provides configuration types and utilities for processing
 * outbox events from DynamoDB Streams with proper error handling and retry logic.
 */

/**
 * Configuration for outbox stream processing
 * Configuration options for processing outbox events from DynamoDB Streams
 */
export interface OutboxStreamConfig {
  /** DynamoDB table name for outbox */
  outboxTableName: string;
  /** EventBridge bus name */
  eventBusName: string;
  /** Event source identifier */
  eventSource: string;
  /** AWS region */
  region: string;
  /** Maximum number of events to process in parallel */
  maxConcurrency?: number;
  /** Maximum number of retries for failed events */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  retryDelayMs?: number;
}

/**
 * Default configuration for outbox stream processing
 */
export const DEFAULT_OUTBOX_STREAM_CONFIG: OutboxStreamConfig = {
  outboxTableName: 'outbox',
  eventBusName: 'default-bus',
  eventSource: 'lambda.outbox-stream',
  region: 'us-east-1',
  maxConcurrency: 10,
  maxRetries: 3,
  retryDelayMs: 1000
};

/**
 * Loads outbox stream configuration from environment variables
 * @returns Outbox stream configuration object
 */
export function loadOutboxStreamConfig(): OutboxStreamConfig {
  return {
    outboxTableName: process.env.OUTBOX_TABLE_NAME || DEFAULT_OUTBOX_STREAM_CONFIG.outboxTableName,
    eventBusName: process.env.EVENT_BUS_NAME || DEFAULT_OUTBOX_STREAM_CONFIG.eventBusName,
    eventSource: process.env.EVENT_SOURCE || DEFAULT_OUTBOX_STREAM_CONFIG.eventSource,
    region: process.env.AWS_REGION || DEFAULT_OUTBOX_STREAM_CONFIG.region,
    maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || '10'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000')
  };
}

/**
 * Validates outbox stream configuration
 * @param config - Configuration to validate
 * @returns True if configuration is valid
 */
export function validateOutboxStreamConfig(config: OutboxStreamConfig): boolean {
  if (!config.outboxTableName || config.outboxTableName.trim() === '') {
    console.error('Invalid configuration: outboxTableName is required');
    return false;
  }

  if (!config.eventBusName || config.eventBusName.trim() === '') {
    console.error('Invalid configuration: eventBusName is required');
    return false;
  }

  if (!config.eventSource || config.eventSource.trim() === '') {
    console.error('Invalid configuration: eventSource is required');
    return false;
  }

  if (!config.region || config.region.trim() === '') {
    console.error('Invalid configuration: region is required');
    return false;
  }

  if (config.maxConcurrency && (config.maxConcurrency < 1 || config.maxConcurrency > 100)) {
    console.error('Invalid configuration: maxConcurrency must be between 1 and 100');
    return false;
  }

  if (config.maxRetries && (config.maxRetries < 0 || config.maxRetries > 10)) {
    console.error('Invalid configuration: maxRetries must be between 0 and 10');
    return false;
  }

  if (config.retryDelayMs && (config.retryDelayMs < 100 || config.retryDelayMs > 60000)) {
    console.error('Invalid configuration: retryDelayMs must be between 100 and 60000');
    return false;
  }

  return true;
}
