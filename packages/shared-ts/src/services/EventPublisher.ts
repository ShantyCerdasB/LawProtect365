/**
 * @fileoverview EventPublisher - Publisher for processing outbox events
 * @summary Processes pending outbox events and publishes them to EventBridge
 * @description EventPublisher processes pending outbox events and publishes them
 * to EventBridge with proper error handling, retry logic, and observability.
 */

import { mapAwsError, OutboxRepository } from '../index.js';

/**
 * Event publisher service configuration
 * Configuration options for the event publisher service
 */
export interface EventPublisherServiceConfig {
  outboxRepository: OutboxRepository;
  eventBridgeAdapter: any; // EventBridge adapter for publishing events
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
  private readonly eventBridge: any;

  constructor(config: EventPublisherServiceConfig) {
    this.outbox = config.outboxRepository;
    this.eventBridge = config.eventBridgeAdapter;
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
   * Dispatches up to `maxBatch` pending outbox events via EventBridge
   * @param maxBatch - Maximum number of events to process
   */
  async dispatchPending(maxBatch: number): Promise<void> {
    try {
      const events = await (this.outbox as any).pullPending(maxBatch);
      if (!events?.length) return;

      for (const r of events) {
        const domainEvent = {
          id: r.id,
          type: r.type,
          payload: r.payload,
          occurredAt: r.occurredAt,
          metadata: r.traceId ? { 'x-trace-id': r.traceId } : undefined
        };

        try {
          await this.eventBridge.publish([domainEvent]);
          await (this.outbox as any).markAsProcessed(r.id);
        } catch (err) {
          await (this.outbox as any).markFailed(r.id, (err as Error)?.message ?? String(err));
        }
      }
    } catch (error) {
      throw mapAwsError(error, 'EventPublisher.dispatchPending');
    }
  }
}
