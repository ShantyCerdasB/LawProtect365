/**
 * @fileoverview EventPublisherLambda - Lambda function for processing outbox events
 * @summary AWS Lambda function that processes pending outbox events and publishes them to EventBridge
 * @description This Lambda function is responsible for processing pending outbox events
 * and publishing them to EventBridge. It should be triggered by EventBridge rules
 * on a scheduled basis (e.g., every 5 minutes) to ensure reliable event delivery.
 */

import { EventBridgeEvent, Context } from 'aws-lambda';
import { EventServiceFactory } from '../services/EventServiceFactory.js';
import { loadLambdaConfig, createDynamoDBClient, createEventBridgeClient } from './LambdaConfig.js';

/**
 * EventBridge scheduled event type
 * Triggered by EventBridge rules on a schedule
 */
interface ScheduledEvent extends EventBridgeEvent<'Scheduled Event', any> {
  source: 'aws.events';
  'detail-type': 'Scheduled Event';
}

/**
 * Lambda handler for processing outbox events
 * 
 * This function processes pending outbox events and publishes them to EventBridge.
 * It should be configured to run on a schedule (e.g., every 5 minutes) via
 * EventBridge rules to ensure reliable event delivery.
 * 
 * @param event - EventBridge scheduled event
 * @param context - Lambda execution context
 * @returns Promise that resolves when processing is complete
 */
export const handler = async (
  event: ScheduledEvent,
  context: Context
): Promise<{ statusCode: number; body: string }> => {
  console.log('EventPublisherLambda started', { 
    requestId: context.awsRequestId,
    event: JSON.stringify(event, null, 2)
  });

  try {
    // Load Lambda configuration
    const config = loadLambdaConfig();
    
    // Create AWS clients
    const dynamoDbClient = createDynamoDBClient(config);
    const eventBridgeClient = createEventBridgeClient(config);
    
    // Create event publisher service
    const eventPublisherService = EventServiceFactory.createEventPublisherService({
      outboxRepository: EventServiceFactory.createOutboxRepository(
        config.outboxTableName,
        dynamoDbClient
      ),
      eventBridgeAdapter: EventServiceFactory.createEventBridgeAdapter(
        {
          busName: config.eventBusName,
          source: config.eventSource
        },
        eventBridgeClient
      )
    });

    // Process pending events
    await eventPublisherService.processPendingEvents();
    
    console.log('EventPublisherLambda completed successfully', {
      requestId: context.awsRequestId
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Events processed successfully',
        requestId: context.awsRequestId
      })
    };

  } catch (error) {
    console.error('EventPublisherLambda failed', {
      requestId: context.awsRequestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to process events',
        error: error instanceof Error ? error.message : String(error),
        requestId: context.awsRequestId
      })
    };
  }
};
