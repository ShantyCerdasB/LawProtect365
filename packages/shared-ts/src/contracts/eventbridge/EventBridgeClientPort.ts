/**
 * @file EventBridgeClientPort.ts
 * @summary Complete port interface for EventBridge operations
 * @description Defines a comprehensive contract for EventBridge client implementations
 */

/**
 * EventBridge event entry structure.
 */
export interface EventBridgeEntry {
  /** Event source (e.g., "signature-service"). */
  Source: string;
  /** Event detail type (e.g., "Consent.Created"). */
  DetailType: string;
  /** Event detail payload (JSON string). */
  Detail: string;
  /** Event bus name or ARN. */
  EventBusName?: string;
  /** Time when the event occurred. */
  Time?: Date;
  /** AWS region where the event was created. */
  Region?: string;
  /** Optional resources associated with the event. */
  Resources?: string[];
  /** Optional trace header for distributed tracing. */
  TraceHeader?: string;
}

/**
 * Request for putting events to EventBridge.
 */
export interface PutEventsRequest {
  /** Array of events to publish. */
  Entries: EventBridgeEntry[];
}

/**
 * Response from EventBridge putEvents operation.
 */
export interface PutEventsResponse {
  /** Number of failed entries. */
  FailedEntryCount: number;
  /** Array of failed entries with error details. */
  FailedEntries?: Array<{
    /** The failed event entry. */
    Entry: EventBridgeEntry;
    /** Error code for the failure. */
    ErrorCode: string;
    /** Error message describing the failure. */
    ErrorMessage: string;
  }>;
  /** Array of successful entry IDs. */
  Entries?: Array<{
    /** The event entry. */
    Entry: EventBridgeEntry;
    /** Event ID assigned by EventBridge. */
    EventId: string;
  }>;
}

/**
 * EventBridge client port interface.
 * Provides a complete abstraction for EventBridge operations.
 */
export interface EventBridgeClientPort {
  /**
   * Publishes events to EventBridge.
   * @param request - The putEvents request containing event entries.
   * @returns Promise resolving to the putEvents response.
   */
  putEvents(request: PutEventsRequest): Promise<PutEventsResponse>;
}

/**
 * EventBridge configuration options.
 */
export interface EventBridgeConfig {
  /** AWS region for EventBridge operations. */
  region: string;
  /** Maximum number of events per batch (1-10). */
  maxBatchSize?: number;
  /** Retry configuration for failed operations. */
  retryConfig?: {
    /** Maximum number of retry attempts. */
    maxAttempts: number;
    /** Base delay between retries in milliseconds. */
    baseDelayMs: number;
    /** Maximum delay between retries in milliseconds. */
    maxDelayMs: number;
  };
  /** Event bus configuration. */
  eventBus?: {
    /** Default event bus name or ARN. */
    name: string;
    /** Default event source. */
    source: string;
    /** Default resources to attach to events. */
    resources?: string[];
  };
}
