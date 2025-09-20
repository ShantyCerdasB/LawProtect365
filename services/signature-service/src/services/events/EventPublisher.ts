/**
 * @fileoverview EventPublisher - Publisher for processing outbox events
 * @summary Processes pending outbox events and publishes them to EventBridge
 * @description EventPublisher processes pending outbox events and publishes them
 * to EventBridge with proper error handling, retry logic, and observability.
 */

import { mapAwsError } from '@lawprotect/shared-ts';
import { OutboxRepository, type OutboxRecord } from '@lawprotect/shared-ts';
import type { EventBridgeAdapter } from '../../infrastructure/eventbridge/EventBridgeAdapter';

/**
 * Event publisher configuration
 * Configuration options for the event publisher
 */
export interface EventPublisherConfig {
  outboxRepository: OutboxRepository;
  eventBridgeAdapter: EventBridgeAdapter;
  maxBatchSize?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

/**
 * Event publisher statistics
 * Statistics about event processing
 */
export interface EventPublisherStats {
  processed: number;
  failed: number;
  retried: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

/**
 * EventPublisher - Processes pending outbox events and publishes them to EventBridge
 * 
 * Implements the outbox pattern by:
 * 1. Pulling pending events from the outbox
 * 2. Publishing them to EventBridge
 * 3. Marking them as dispatched or failed
 * 4. Handling retries and error recovery
 */
export class EventPublisher {
  private readonly outbox: OutboxRepository;
  private readonly eventBridge: EventBridgeAdapter;
  private readonly maxBatchSize: number;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(config: EventPublisherConfig) {
    this.outbox = config.outboxRepository;
    this.eventBridge = config.eventBridgeAdapter;
    this.maxBatchSize = config.maxBatchSize ?? 10;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 1000;
  }

  /**
   * Processes pending outbox events and publishes them to EventBridge
   * @param maxBatch - Maximum number of events to process in this batch
   * @returns Statistics about the processing run
   */
  async processPendingEvents(maxBatch?: number): Promise<EventPublisherStats> {
    const batchSize = Math.min(maxBatch ?? this.maxBatchSize, 100);
    const stats: EventPublisherStats = {
      processed: 0,
      failed: 0,
      retried: 0,
      startTime: new Date()
    };

    try {
      
      // Pull pending events from outbox
      const pendingEvents = await this.outbox.pullPending(batchSize);
      
      
      if (pendingEvents.length === 0) {
        stats.endTime = new Date();
        stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
        return stats;
      }

      // Process each event
      for (const event of pendingEvents) {
        try {
          await this.processEvent(event);
          stats.processed++;
        } catch (error) {
          await this.handleEventError(event, error as Error);
          stats.failed++;
          
          // Check if we should retry
          if (event.attempts < this.maxRetries) {
            stats.retried++;
          }
        }
      }

      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
      
      return stats;
    } catch (error) {
      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
      throw mapAwsError(error, 'EventPublisher.processPendingEvents');
    }
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


      // Mark as dispatched
      await this.outbox.markDispatched(event.id);

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
    
    // Mark as failed in outbox
    await this.outbox.markFailed(event.id, errorMessage);

    // Log error for observability
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

  /**
   * Processes events continuously until no more pending events
   * @param maxIterations - Maximum number of iterations to prevent infinite loops
   * @returns Total statistics across all iterations
   */
  async processAllPendingEvents(maxIterations: number = 10): Promise<EventPublisherStats> {
    const totalStats: EventPublisherStats = {
      processed: 0,
      failed: 0,
      retried: 0,
      startTime: new Date()
    };

    for (let i = 0; i < maxIterations; i++) {
      const batchStats = await this.processPendingEvents();
      
      totalStats.processed += batchStats.processed;
      totalStats.failed += batchStats.failed;
      totalStats.retried += batchStats.retried;

      // If no events were processed, we're done
      if (batchStats.processed === 0) {
        break;
      }

      // Small delay between batches to prevent overwhelming the system
      if (i < maxIterations - 1) {
        await this.delay(this.retryDelayMs);
      }
    }

    totalStats.endTime = new Date();
    totalStats.duration = totalStats.endTime.getTime() - totalStats.startTime.getTime();
    
    return totalStats;
  }

  /**
   * Utility method to delay execution
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
