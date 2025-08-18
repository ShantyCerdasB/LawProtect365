import type { DomainEvent } from "./DomainEvent.js";

/**
 * Event bus port for publishing and subscribing to domain events.
 * Adapters integrate with EventBridge, SNS/SQS, Kafka, or similar brokers.
 */
export interface EventBusPort {
  /**
   * Publishes one or more events atomically per best effort.
   * @param events Events to publish.
   */
  publish(events: readonly DomainEvent[]): Promise<void>;

  /**
   * Optional subscription API for process managers or consumers.
   * Implementations may require broker-specific configuration.
   * @param topic Logical topic or event pattern.
   * @param handler Async event handler.
   */
  subscribe?(
    topic: string,
    handler: (event: DomainEvent) => Promise<void>
  ): Promise<void>;
}
