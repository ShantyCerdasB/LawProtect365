/**
 * @file OutboxProcessor.ts
 * @summary Worker for processing pending outbox events
 * @description Processes outbox events and publishes them to EventBridge for reliable event delivery
 */

import type { OutboxRepository } from "../../shared/contracts/repositories/outbox";
import type { EventBusPort } from "@lawprotect/shared-ts";
import type { OutboxRecord } from "../../shared/types/outbox/OutboxTypes";

/**
 * Configuration for the outbox processor.
 */
export interface OutboxProcessorOptions {
  /** Maximum number of events to process in a single batch. */
  maxBatchSize?: number;
  /** Maximum time to wait between processing batches (in milliseconds). */
  maxWaitTimeMs?: number;
  /** Number of retry attempts for failed events. */
  maxRetries?: number;
  /** Delay between retry attempts (in milliseconds). */
  retryDelayMs?: number;
}

/**
 * Result of processing a batch of outbox events.
 */
export interface OutboxProcessingResult {
  /** Total events processed. */
  totalEvents: number;
  /** Successfully published events. */
  successfulEvents: number;
  /** Failed events. */
  failedEvents: number;
  /** Processing duration in milliseconds. */
  durationMs: number;
  /** Error details for failed events. */
  errors?: Array<{
    eventId: string;
    error: string;
    retryCount: number;
  }>;
}

/**
 * Worker that processes pending outbox events and publishes them to EventBridge.
 */
export class OutboxProcessor {
  private readonly outboxRepository: OutboxRepository;
  private readonly eventBus: EventBusPort;
  private readonly options: Required<OutboxProcessorOptions>;

  constructor(
    outboxRepository: OutboxRepository,
    eventBus: EventBusPort,
    options: OutboxProcessorOptions = {}
  ) {
    this.outboxRepository = outboxRepository;
    this.eventBus = eventBus;
    this.options = {
      maxBatchSize: options.maxBatchSize ?? 10,
      maxWaitTimeMs: options.maxWaitTimeMs ?? 5000,
      maxRetries: options.maxRetries ?? 3,
      retryDelayMs: options.retryDelayMs ?? 1000,
    };
  }

  /**
   * Processes a single batch of pending outbox events.
   */
  async processBatch(): Promise<OutboxProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Get pending events from outbox
      const pendingEvents = await this.outboxRepository.findPendingEvents({
        limit: this.options.maxBatchSize,
        maxAgeMs: this.options.maxWaitTimeMs,
      });

      if (pendingEvents.length === 0) {
        return {
          totalEvents: 0,
          successfulEvents: 0,
          failedEvents: 0,
          durationMs: Date.now() - startTime,
        };
      }

      const results = await Promise.allSettled(
        pendingEvents.map(event => this.processEvent(event))
      );

      const successfulEvents = results.filter(r => r.status === 'fulfilled').length;
      const failedEvents = results.filter(r => r.status === 'rejected').length;

      const errors = results
        .map((result, index) => {
          if (result.status === 'rejected') {
            return {
              eventId: pendingEvents[index].id,
              error: result.reason?.message || 'Unknown error',
              retryCount: pendingEvents[index].retryCount || 0,
            };
          }
          return null;
        })
        .filter(Boolean);

      return {
        totalEvents: pendingEvents.length,
        successfulEvents,
        failedEvents,
        durationMs: Date.now() - startTime,
        errors,
      };
    } catch (error) {
      return {
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 1,
        durationMs: Date.now() - startTime,
        errors: [{
          eventId: 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: 0,
        }],
      };
    }
  }

  /**
   * Processes a single outbox event.
   */
  private async processEvent(event: OutboxRecord): Promise<void> {
    try {
      // Publish event to EventBridge
      await this.eventBus.publish([{
        type: event.eventType,
        payload: event.eventPayload,
        occurredAt: event.createdAt,
        metadata: {
          outboxId: event.id,
          retryCount: event.retryCount || 0,
        },
      }]);

      // Mark event as processed
      await this.outboxRepository.markAsProcessed(event.id);
    } catch (error) {
      // Increment retry count
      const newRetryCount = (event.retryCount || 0) + 1;
      
      if (newRetryCount >= this.options.maxRetries) {
        // Mark as failed after max retries
        await this.outboxRepository.markAsFailed(event.id, {
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: newRetryCount,
        });
      } else {
        // Mark for retry
        await this.outboxRepository.markForRetry(event.id, newRetryCount);
      }
      
      throw error;
    }
  }

  /**
   * Starts continuous processing of outbox events.
   */
  async startProcessing(): Promise<void> {
    while (true) {
      try {
        const result = await this.processBatch();
        
        if (result.totalEvents > 0) {
          console.log(`Processed ${result.totalEvents} events: ${result.successfulEvents} successful, ${result.failedEvents} failed`);
        }
        
        // Wait before next batch
        await new Promise(resolve => setTimeout(resolve, this.options.maxWaitTimeMs));
      } catch (error) {
        console.error('Error in outbox processing loop:', error);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelayMs));
      }
    }
  }
}

