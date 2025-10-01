/**
 * @fileoverview OutboxStreamHandler - Lambda function for processing DynamoDB Streams events
 * @summary AWS Lambda function that processes outbox events from DynamoDB Streams in real-time
 * @description This Lambda function is triggered by DynamoDB Streams when new events are added
 * to the outbox table. It processes events immediately and publishes them to EventBridge.
 */

import { DynamoDBStreamEvent, Context } from 'aws-lambda';
import { EventServiceFactory } from '../services/EventServiceFactory.js';
import { loadLambdaConfig, createDynamoDBClient, createEventBridgeClient } from './LambdaConfig.js';
import { OutboxStreamProcessor } from './OutboxStreamProcessor.js';

/**
 * Lambda handler for processing outbox events from DynamoDB Streams
 * 
 * This function processes outbox events in real-time when they are inserted
 * into the DynamoDB outbox table. It converts DynamoDB records to domain events
 * and publishes them to EventBridge immediately.
 * 
 * @param event - DynamoDB Stream event containing outbox records
 * @param context - Lambda execution context
 * @returns Promise that resolves when processing is complete
 */
export const outboxStreamHandler = async (
  event: DynamoDBStreamEvent,
  context: Context
): Promise<{ statusCode: number; body: string }> => {
  console.log('OutboxStreamHandler started', { 
    requestId: context.awsRequestId,
    recordCount: event.Records.length,
    event: JSON.stringify(event, null, 2)
  });

  try {
    const streamProcessor = await initializeStreamProcessor();
    const processingResult = await processStreamRecords(event.Records, streamProcessor);
    
    return createSuccessResponse(processingResult, context.awsRequestId);
  } catch (error) {
    return createErrorResponse(error, context.awsRequestId);
  }
};

/**
 * Initialize the stream processor with required dependencies
 * @returns Promise that resolves to configured OutboxStreamProcessor
 */
const initializeStreamProcessor = async (): Promise<OutboxStreamProcessor> => {
  const config = loadLambdaConfig();
  const dynamoDbClient = createDynamoDBClient(config);
  const eventBridgeClient = createEventBridgeClient(config);
  
  const outboxRepository = EventServiceFactory.createOutboxRepository(
    config.outboxTableName,
    dynamoDbClient
  );
  
  const eventBridgeAdapter = EventServiceFactory.createEventBridgeAdapter(
    {
      busName: config.eventBusName,
      source: config.eventSource
    },
    eventBridgeClient
  );
  
  return new OutboxStreamProcessor(outboxRepository, eventBridgeAdapter);
};

/**
 * Process all records in the stream
 * @param records - Array of DynamoDB stream records
 * @param streamProcessor - Configured stream processor
 * @returns Processing result with counts
 */
const processStreamRecords = async (
  records: any[],
  streamProcessor: OutboxStreamProcessor
): Promise<{ processedCount: number; failedCount: number }> => {
  let processedCount = 0;
  let failedCount = 0;

  for (const record of records) {
    const result = await processSingleRecord(record, streamProcessor);
    if (result.success) {
      processedCount++;
    } else {
      failedCount++;
    }
  }

  return { processedCount, failedCount };
};

/**
 * Process a single stream record
 * @param record - Single DynamoDB stream record
 * @param streamProcessor - Configured stream processor
 * @returns Processing result
 */
const processSingleRecord = async (
  record: any,
  streamProcessor: OutboxStreamProcessor
): Promise<{ success: boolean }> => {
  try {
    if (isInsertEvent(record)) {
      await streamProcessor.processEventImmediately(record.dynamodb.NewImage);
      return { success: true };
    }
    return { success: true }; // Skip non-insert events
  } catch (error) {
    logRecordProcessingError(record, error);
    return { success: false };
  }
};

/**
 * Check if record is an INSERT event with valid data
 * @param record - DynamoDB stream record
 * @returns True if record should be processed
 */
const isInsertEvent = (record: any): boolean => {
  return record.eventName === 'INSERT' && record.dynamodb?.NewImage;
};

/**
 * Log error for failed record processing
 * @param record - Failed record
 * @param error - Error that occurred
 */
const logRecordProcessingError = (record: any, error: unknown): void => {
  console.error('Failed to process stream record:', {
    recordId: record.dynamodb?.Keys?.pk?.S,
    error: getErrorMessage(error),
    stack: getErrorStack(error)
  });
};

/**
 * Create success response
 * @param result - Processing result
 * @param requestId - Lambda request ID
 * @returns Success response
 */
const createSuccessResponse = (
  result: { processedCount: number; failedCount: number },
  requestId: string
): { statusCode: number; body: string } => {
  console.log('OutboxStreamHandler completed', {
    requestId,
    processedCount: result.processedCount,
    failedCount: result.failedCount,
    totalRecords: result.processedCount + result.failedCount
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Stream events processed successfully',
      processedCount: result.processedCount,
      failedCount: result.failedCount,
      totalRecords: result.processedCount + result.failedCount,
      requestId
    })
  };
};

/**
 * Create error response
 * @param error - Error that occurred
 * @param requestId - Lambda request ID
 * @returns Error response
 */
const createErrorResponse = (
  error: unknown,
  requestId: string
): { statusCode: number; body: string } => {
  console.error('OutboxStreamHandler failed', {
    requestId,
    error: getErrorMessage(error),
    stack: getErrorStack(error)
  });

  return {
    statusCode: 500,
    body: JSON.stringify({
      message: 'Failed to process stream events',
      error: getErrorMessage(error),
      requestId
    })
  };
};

/**
 * Extract error message from unknown error
 * @param error - Unknown error
 * @returns Error message string
 */
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error);
};

/**
 * Extract error stack from unknown error
 * @param error - Unknown error
 * @returns Error stack string or undefined
 */
const getErrorStack = (error: unknown): string | undefined => {
  return error instanceof Error ? error.stack : undefined;
};
