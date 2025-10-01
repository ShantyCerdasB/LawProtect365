/**
 * @fileoverview EventPublisher - Publisher for processing outbox events
 * @summary Processes pending outbox events and publishes them to EventBridge
 * @description EventPublisher processes pending outbox events and publishes them
 * to EventBridge with proper error handling, retry logic, and observability.
 */

import { mapAwsError, OutboxRepository, type OutboxRecord, type EventBridgeAdapter } from '../index.js';

/**
 * Event publisher service configuration
 * Configuration options for the event publisher service
 */
export interface EventPublisherServiceConfig {
  outboxRepository: OutboxRepository;
  eventBridgeAdapter: EventBridgeAdapter;
  maxBatchSize?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

/**
 * Event publisher service statistics
 * Statistics about event processing
 */
export interface EventPublisherServiceStats {
  processed: number;
  failed: number;
  retried: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

/**
 * EventPublisherService - Processes pending outbox events and publishes them to EventBridge
 * 
 * Implements the outbox pattern by:
 * 1. Pulling pending events from the outbox
 * 2. Publishing them to EventBridge
 * 3. Marking them as dispatched or failed
 * 4. Handling retries and error recovery
 */
export class EventPublisherService {
  private readonly outbox: OutboxRepository;
  private readonly eventBridge: EventBridgeAdapter;
  private readonly maxBatchSize: number;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(config: EventPublisherServiceConfig) {
    this.outbox = config.outboxRepository;
    this.eventBridge = config.eventBridgeAdapter;
    this.maxBatchSize = config.maxBatchSize ?? 10;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 1000;
  }


  /**
   * Processes a single outbox event
   * @param event - Outbox event to process
   */
  private async processEvent(event: OutboxRecord): Promise<void> {
    try {

      // Convert OutboxRecord to DomainEvent format
      const domainEvent = {
        id: event.id,
        type: event.type,
        payload: event.payload,
        occurredAt: event.occurredAt,
        metadata: event.traceId ? { "x-trace-id": event.traceId } : undefined
      };


      // Publish to EventBridge
      await this.eventBridge.publish([domainEvent]);


      // Mark as processed (for DynamoDB Streams)
      await this.outbox.markAsProcessed(event.id);

    } catch (error) {
      // Re-throw with additional context
      throw mapAwsError(error, 'EventPublisher.processEvent');
    }
  }

  /**
   * Handles errors when processing events
   * @param event - Event that failed
   * @param error - Error that occurred
   */
  private async handleEventError(event: OutboxRecord, error: Error): Promise<void> {
    const errorMessage = error.message || 'Unknown error';
    
    // Log error for observability (DynamoDB Streams handles retries automatically)
    console.error(`EventPublisher: Failed to process event ${event.id}:`, {
      eventType: event.type,
      attempts: event.attempts + 1,
      error: errorMessage,
      traceId: event.traceId
    });
  }

  /**
   * Gets current outbox statistics
   * @returns Statistics about outbox status
   */
  async getOutboxStats(): Promise<{
    pending: number;
    dispatched: number;
    failed: number;
  }> {
    try {
      const [pending, dispatched, failed] = await Promise.all([
        this.outbox.countByStatus('pending'),
        this.outbox.countByStatus('dispatched'),
        this.outbox.countByStatus('failed')
      ]);

      return {
        pending: pending.count,
        dispatched: dispatched.count,
        failed: failed.count
      };
    } catch (error) {
      throw mapAwsError(error, 'EventPublisher.getOutboxStats');
    }
  }


}
