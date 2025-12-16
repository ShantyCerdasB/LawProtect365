/**
 * @fileoverview EventServiceFactory - Factory for creating event-related services
 * @summary Centralized factory for creating outbox, EventBridge, and event publisher services
 * @description Provides a centralized way to create event-related services with proper
 * dependency injection and configuration. This factory ensures consistent service
 * creation across all microservices that need event publishing capabilities.
 */

import { DdbClientLike } from '../aws/ddb.js';
import { EventBridgeAdapterClient, EventBridgeAdapterConfig } from '../aws/eventbridge/EventBridgeConfig.js';
import { OutboxRepository } from '../aws/outbox/OutboxRepository.js';
import { EventBridgeAdapter } from '../aws/eventbridge/EventBridgeAdapter.js';

/**
 * Factory for creating event-related services
 * 
 * This factory provides methods to create outbox and EventBridge services
 * with proper dependency injection and configuration.
 */
export class EventServiceFactory {
  /**
   * Creates an OutboxRepository instance
   * @param tableName - The DynamoDB table name for the outbox
   * @param ddbClient - The DynamoDB client instance
   * @returns Configured OutboxRepository instance
   */
  static createOutboxRepository(tableName: string, ddbClient: DdbClientLike): OutboxRepository {
    return new OutboxRepository(tableName, ddbClient);
  }

  /**
   * Creates an EventBridgeAdapter instance
   * @param config - EventBridge adapter configuration
   * @param client - EventBridge client instance
   * @returns Configured EventBridgeAdapter instance
   */
  static createEventBridgeAdapter(
    config: EventBridgeAdapterConfig, 
    client: EventBridgeAdapterClient
  ): EventBridgeAdapter {
    return new EventBridgeAdapter(config, client);
  }
}
