/**
 * @fileoverview EventBridgeConfig - Configuration for EventBridge integration
 * @summary Configuration types and constants for EventBridge
 * @description Defines configuration types and constants for EventBridge integration
 * including bus names, sources, and other EventBridge-specific settings.
 */

/**
 * EventBridge adapter configuration interface
 * Configuration options for EventBridge adapter integration
 */
export interface EventBridgeAdapterConfig {
  /** EventBridge bus name */
  busName: string;
  /** Event source identifier */
  source: string;
  /** Maximum entries per batch (EventBridge limit is 10) */
  maxEntriesPerBatch?: number;
  /** Optional resource ARNs */
  resources?: string[];
  /** AWS region */
  region?: string;
}

/**
 * EventBridge adapter event entry interface
 * Represents a single event entry for EventBridge adapter
 */
export interface EventBridgeAdapterEntry {
  /** Event source */
  Source: string;
  /** Event detail type */
  DetailType: string;
  /** Event detail (JSON string) */
  Detail: string;
  /** Event bus name */
  EventBusName: string;
  /** Event time */
  Time: Date;
  /** Optional resource ARNs */
  Resources?: string[];
  /** Optional trace header */
  TraceHeader?: string;
}

/**
 * EventBridge adapter put events response interface
 * Response from EventBridge adapter putEvents operation
 */
export interface EventBridgeAdapterPutEventsResponse {
  /** Number of failed entries */
  FailedEntryCount?: number;
  /** Array of failed entries */
  Entries?: Array<{
    ErrorCode?: string;
    ErrorMessage?: string;
  }>;
}

/**
 * EventBridge adapter client interface
 * Minimal interface for EventBridge adapter client operations
 */
export interface EventBridgeAdapterClient {
  putEvents(params: {
    Entries: EventBridgeAdapterEntry[];
  }): Promise<EventBridgeAdapterPutEventsResponse>;
}

/**
 * Default EventBridge adapter configuration
 * Default values for EventBridge adapter configuration
 */
export const DEFAULT_EVENTBRIDGE_ADAPTER_CONFIG: Partial<EventBridgeAdapterConfig> = {
  maxEntriesPerBatch: 10,
  region: 'us-east-1'
};

/**
 * EventBridge adapter constants
 * Constants for EventBridge adapter integration
 */
export const EVENTBRIDGE_ADAPTER_CONSTANTS = {
  /** Maximum entries per batch (EventBridge limit) */
  MAX_ENTRIES_PER_BATCH: 10,
  /** Maximum detail size in bytes */
  MAX_DETAIL_SIZE: 256 * 1024, // 256KB
  /** Default event source */
  DEFAULT_SOURCE: 'lawprotect.signature-service',
  /** Default event bus name */
  DEFAULT_BUS_NAME: 'signature-service-bus'
} as const;
