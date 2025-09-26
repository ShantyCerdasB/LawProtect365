/**
 * @fileoverview Integration Event Publisher - Publisher for integration events
 * @summary Generic publisher interface and outbox implementation for integration events
 * @description Provides abstraction for publishing integration events to the outbox
 */

import { OutboxRepository } from '../aws/outbox/OutboxRepository.js';

/**
 * Generic publisher for integration events
 */
export interface IntegrationEventPublisher {
  /**
   * Publishes an integration event into the outbox
   * @param event Integration event object (opaque to the publisher)
   * @param dedupId Optional idempotency or deduplication key
   * @returns Resolves when the event is persisted
   */
  publish(event: unknown, dedupId?: string): Promise<void>;
}

/**
 * Outbox-backed publisher implementation
 */
export class OutboxEventPublisher implements IntegrationEventPublisher {
  constructor(private readonly outbox: OutboxRepository) {}

  /**
   * Publishes an integration event to the outbox
   * @param event Integration event to publish
   * @param dedupId Optional deduplication key
   * @returns Promise that resolves when event is persisted
   */
  async publish(event: unknown, dedupId?: string): Promise<void> {
    await this.outbox.save(event as any, dedupId);
  }
}
