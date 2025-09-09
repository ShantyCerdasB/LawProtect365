/**
 * @file eventbridge.ts
 * @summary EventBridge-specific types and interfaces
 * @description Shared types for EventBridge operations and event publishing
 */

/**
 * @summary EventBridge client interface
 * @description Minimal interface for EventBridge client operations.
 */
export interface EventBridgeClientLike {
  /**
   * @summary Put events on EventBridge
   * @description Publishes events to an EventBridge event bus.
   * @param params - Event publishing parameters
   * @returns Promise resolving to put events result
   */
  putEvents(params: {
    /** Event bus name */
    readonly Entries: Array<{
      /** Event source */
      readonly Source: string;
      /** Event detail type */
      readonly DetailType: string;
      /** Event detail */
      readonly Detail: string;
      /** Event bus name */
      readonly EventBusName?: string;
      /** Optional time */
      readonly Time?: Date;
    }>;
  }): Promise<{
    /** Failed entry count */
    readonly FailedEntryCount: number;
    /** Failed entries */
    readonly Entries?: Array<{
      /** Error code */
      readonly ErrorCode?: string;
      /** Error message */
      readonly ErrorMessage?: string;
    }>;
  }>;
}

/**
 * @summary EventBridge publisher options
 * @description Configuration options for EventBridge publisher.
 */
export interface EventBridgePublisherOptions {
  /** Event bus name */
  readonly busName: string;
  /** Event source */
  readonly source: string;
  /** AWS region */
  readonly region: string;
  /** Optional client configuration */
  readonly clientConfig?: {
    /** Maximum retry attempts */
    readonly maxAttempts?: number;
    /** Request timeout in milliseconds */
    readonly requestTimeout?: number;
  };
}

/**
 * @summary Domain event structure
 * @description Structure for domain events published to EventBridge.
 */
export interface DomainEvent {
  /** Event source */
  readonly source: string;
  /** Event detail type */
  readonly detailType: string;
  /** Event detail */
  readonly detail: Record<string, unknown>;
  /** Event bus name */
  readonly eventBusName?: string;
  /** Event time */
  readonly time?: Date;
}

/**
 * @summary Event publishing parameters
 * @description Parameters for publishing events to EventBridge.
 */
export interface EventPublishParams {
  /** Event detail type */
  readonly detailType: string;
  /** Event detail */
  readonly detail: Record<string, unknown>;
  /** Optional event bus name */
  readonly eventBusName?: string;
  /** Optional event time */
  readonly time?: Date;
}

/**
 * @summary Event publishing result
 * @description Result of publishing events to EventBridge.
 */
export interface EventPublishResult {
  /** Whether the event was published successfully */
  readonly success: boolean;
  /** Number of failed entries */
  readonly failedEntryCount: number;
  /** Error information if publishing failed */
  readonly error?: {
    /** Error code */
    readonly code: string;
    /** Error message */
    readonly message: string;
  };
}

/**
 * @summary Event bus configuration
 * @description Configuration for EventBridge event buses.
 */
export interface EventBusConfig {
  /** Event bus name */
  readonly name: string;
  /** Event bus ARN */
  readonly arn: string;
  /** Event bus policy */
  readonly policy?: string;
  /** Event bus tags */
  readonly tags?: Record<string, string>;
}






