/**
 * @fileoverview OutboxStreamProcessor - Processor for DynamoDB Stream events
 * @summary Processes outbox events from DynamoDB Streams and publishes them to EventBridge
 * @description This processor converts DynamoDB stream records to domain events and
 * publishes them to EventBridge with proper error handling and retry logic.
 */

import { OutboxRepository } from '../aws/outbox/OutboxRepository.js';
import { EventBridgeAdapter } from '../aws/eventbridge/EventBridgeAdapter.js';
import { mapAwsError } from '../index.js';
import type { OutboxRecord } from '../aws/outbox/outbox-mappers.js';

/**
 * Processor for outbox events from DynamoDB Streams
 * 
 * This processor handles the conversion of DynamoDB stream records to domain events
 * and publishes them to EventBridge. It provides error handling and retry logic
 * for reliable event processing.
 */
export class OutboxStreamProcessor {
  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly eventBridgeAdapter: EventBridgeAdapter
  ) {}

  /**
   * Processes an outbox event immediately from DynamoDB stream record
   * @param dynamoDbRecord - DynamoDB stream record containing the event
   * @returns Promise that resolves when event is processed
   */
  async processEventImmediately(dynamoDbRecord: any): Promise<void> {
    try {
      // Convert DynamoDB record to OutboxRecord
      const outboxRecord = this.convertDynamoDbRecord(dynamoDbRecord);
      
      if (!outboxRecord) {
        console.warn('Skipping invalid outbox record:', dynamoDbRecord);
        return;
      }

      // Create domain event from outbox record
      const domainEvent = {
        id: outboxRecord.id,
        type: outboxRecord.type,
        payload: outboxRecord.payload,
        occurredAt: outboxRecord.occurredAt,
        metadata: outboxRecord.traceId ? { "x-trace-id": outboxRecord.traceId } : undefined
      };

      // Publish to EventBridge
      await this.eventBridgeAdapter.publish([domainEvent]);

      console.log('Event processed successfully:', {
        eventId: outboxRecord.id,
        eventType: outboxRecord.type,
        traceId: outboxRecord.traceId
      });

    } catch (error) {
      console.error('Failed to process outbox event:', {
        dynamoDbRecord,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Re-throw with additional context
      throw mapAwsError(error, 'OutboxStreamProcessor.processEventImmediately');
    }
  }

  /**
   * Converts DynamoDB stream record to OutboxRecord
   * @param dynamoDbRecord - DynamoDB stream record
   * @returns OutboxRecord or null if invalid
   */
  private convertDynamoDbRecord(dynamoDbRecord: any): OutboxRecord | null {
    try {
      // Extract values from DynamoDB record
      const id = dynamoDbRecord.id?.S;
      const type = dynamoDbRecord.type?.S;
      const payload = dynamoDbRecord.payload?.S ? JSON.parse(dynamoDbRecord.payload.S) : {};
      const occurredAt = dynamoDbRecord.occurredAt?.S;
      const traceId = dynamoDbRecord.traceId?.S;
      const status = dynamoDbRecord.status?.S;
      const attempts = dynamoDbRecord.attempts?.N ? parseInt(dynamoDbRecord.attempts.N) : 0;
      const createdAt = dynamoDbRecord.createdAt?.S;
      const updatedAt = dynamoDbRecord.updatedAt?.S;

      if (!id || !type || !occurredAt) {
        console.warn('Invalid outbox record - missing required fields:', {
          id, type, occurredAt
        });
        return null;
      }

      return {
        id,
        type,
        payload,
        occurredAt,
        traceId,
        status: status || 'pending',
        attempts
      };

    } catch (error) {
      console.error('Failed to convert DynamoDB record to OutboxRecord:', {
        dynamoDbRecord,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Gets processing statistics
   * @returns Statistics about event processing
   */
  async getProcessingStats(): Promise<{
    totalEvents: number;
    processedEvents: number;
    failedEvents: number;
  }> {
    try {
      const stats = await this.outboxRepository.getOutboxStats();
      return {
        totalEvents: stats.pending + stats.dispatched + stats.failed,
        processedEvents: stats.dispatched,
        failedEvents: stats.failed
      };
    } catch (error) {
      console.error('Failed to get processing stats:', error);
      return {
        totalEvents: 0,
        processedEvents: 0,
        failedEvents: 0
      };
    }
  }
}
