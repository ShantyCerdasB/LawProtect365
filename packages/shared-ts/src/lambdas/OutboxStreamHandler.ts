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
    // Load Lambda configuration
    const config = loadLambdaConfig();
    
    // Create AWS clients
    const dynamoDbClient = createDynamoDBClient(config);
    const eventBridgeClient = createEventBridgeClient(config);
    
    // Create outbox repository and event bridge adapter
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
    
    // Create stream processor
    const streamProcessor = new OutboxStreamProcessor(
      outboxRepository,
      eventBridgeAdapter
    );

    // Process each record in the stream
    let processedCount = 0;
    let failedCount = 0;

    for (const record of event.Records) {
      try {
        if (record.eventName === 'INSERT' && record.dynamodb?.NewImage) {
          await streamProcessor.processEventImmediately(record.dynamodb.NewImage);
          processedCount++;
        }
      } catch (error) {
        console.error('Failed to process stream record:', {
          recordId: record.dynamodb?.Keys?.pk?.S,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        failedCount++;
      }
    }
    
    console.log('OutboxStreamHandler completed', {
      requestId: context.awsRequestId,
      processedCount,
      failedCount,
      totalRecords: event.Records.length
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Stream events processed successfully',
        processedCount,
        failedCount,
        totalRecords: event.Records.length,
        requestId: context.awsRequestId
      })
    };

  } catch (error) {
    console.error('OutboxStreamHandler failed', {
      requestId: context.awsRequestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to process stream events',
        error: error instanceof Error ? error.message : String(error),
        requestId: context.awsRequestId
      })
    };
  }
};
