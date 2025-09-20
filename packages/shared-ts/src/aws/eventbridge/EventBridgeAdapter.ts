/**
 * @fileoverview EventBridgeAdapter - Adapter for EventBridge integration
 * @summary Implements EventBusPort interface using AWS EventBridge
 * @description EventBridgeAdapter implements the EventBusPort interface using AWS EventBridge
 * for publishing domain events. Provides batching, error handling, and proper serialization.
 */

import { mapAwsError, InternalError, ErrorCodes, type DomainEvent } from '../../index.js';
import type { 
  EventBridgeAdapterConfig, 
  EventBridgeAdapterEntry, 
  EventBridgeAdapterClient,
  EventBridgeAdapterPutEventsResponse 
} from './EventBridgeConfig.js';
import { EVENTBRIDGE_ADAPTER_CONSTANTS } from './EventBridgeConfig.js';

/**
 * EventBridge adapter port interface
 * Interface for EventBridge adapter operations
 */
export interface EventBridgeAdapterPort {
  publish(events: readonly DomainEvent[]): Promise<void>;
}

/**
 * EventBridgeAdapter - Implements EventBusPort using AWS EventBridge
 * 
 * Provides reliable event publishing with:
 * - Batching for efficiency
 * - Error handling and retry logic
 * - Proper serialization
 * - Observability and tracing
 */
export class EventBridgeAdapter implements EventBridgeAdapterPort {
  private readonly busName: string;
  private readonly source: string;
  private readonly client: EventBridgeAdapterClient;
  private readonly resources?: string[];
  private readonly batchSize: number;

  constructor(config: EventBridgeAdapterConfig, client: EventBridgeAdapterClient) {
    this.busName = config.busName;
    this.source = config.source;
    this.client = client;
    this.resources = config.resources;
    
    const requested = Math.floor(config.maxEntriesPerBatch ?? EVENTBRIDGE_ADAPTER_CONSTANTS.MAX_ENTRIES_PER_BATCH);
    this.batchSize = Math.min(EVENTBRIDGE_ADAPTER_CONSTANTS.MAX_ENTRIES_PER_BATCH, Math.max(1, requested));
  }

  /**
   * Publishes domain events to EventBridge
   * @param events - Array of domain events to publish
   * @throws InternalError when EventBridge reports partial failures
   * @throws Provider-specific errors normalized by mapAwsError
   */
  async publish(events: readonly DomainEvent[]): Promise<void> {
    if (!events?.length) return;

    // Split events into batches
    const batches = this.chunkArray(events, this.batchSize);

    for (const batch of batches) {
      const entries = batch.map(event => this.toEventBridgeEntry(event));

      try {
        const response = await this.client.putEvents({ Entries: entries });
        await this.handleResponse(response, entries);
      } catch (error) {
        throw mapAwsError(error, 'EventBridgeAdapter.publish');
      }
    }
  }

  /**
   * Converts a domain event to EventBridge entry format
   * @param event - Domain event to convert
   * @returns EventBridge entry
   */
  private toEventBridgeEntry(event: DomainEvent): EventBridgeAdapterEntry {
    const detail = this.serializePayload(event.payload as Record<string, unknown>);
    
    // Validate detail size
    if (detail.length > EVENTBRIDGE_ADAPTER_CONSTANTS.MAX_DETAIL_SIZE) {
      throw new InternalError(
        `Event detail size exceeds maximum allowed size of ${EVENTBRIDGE_ADAPTER_CONSTANTS.MAX_DETAIL_SIZE} bytes`,
        ErrorCodes.COMMON_INTERNAL_ERROR
      );
    }

    return {
      Source: this.source,
      DetailType: event.type,
      Detail: detail,
      EventBusName: this.busName,
      Time: new Date(event.occurredAt),
      Resources: this.resources,
      TraceHeader: event.metadata?.["x-trace-id"]
    };
  }

  /**
   * Serializes event payload to JSON string
   * @param payload - Event payload to serialize
   * @returns JSON string representation
   */
  private serializePayload(payload?: Record<string, unknown>): string {
    if (!payload) return '{}';
    
    try {
      return JSON.stringify(payload);
    } catch (error) {
      throw new InternalError(
        'Failed to serialize event payload',
        ErrorCodes.COMMON_INTERNAL_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Handles EventBridge response and checks for failures
   * @param response - EventBridge response
   * @param entries - Original entries that were sent
   */
  private async handleResponse(
    response: EventBridgeAdapterPutEventsResponse, 
    entries: EventBridgeAdapterEntry[]
  ): Promise<void> {
    const failedCount = response.FailedEntryCount ?? 0;
    
    if (failedCount > 0) {
      const failedEntries = response.Entries ?? [];
      const errorDetails = failedEntries
        .map((entry, index) => ({
          index,
          errorCode: entry.ErrorCode,
          errorMessage: entry.ErrorMessage,
          eventType: entries[index]?.DetailType
        }))
        .filter(entry => entry.errorCode || entry.errorMessage);

      throw new InternalError(
        `EventBridge putEvents reported ${failedCount} failed entr${failedCount === 1 ? "y" : "ies"}`,
        ErrorCodes.COMMON_INTERNAL_ERROR,
        {
          failedCount,
          errorDetails,
          totalEntries: entries.length
        }
      );
    }
  }

  /**
   * Utility method to chunk array into smaller arrays
   * @param array - Array to chunk
   * @param size - Chunk size
   * @returns Array of chunks
   */
  private chunkArray<T>(array: readonly T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Gets the EventBridge configuration
   * @returns Configuration object
   */
  getConfig(): EventBridgeAdapterConfig {
    return {
      busName: this.busName,
      source: this.source,
      maxEntriesPerBatch: this.batchSize,
      resources: this.resources
    };
  }
}
