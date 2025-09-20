/**
 * @fileoverview EnvelopeService types - Type definitions for EnvelopeService operations
 * @summary Service-specific types for envelope business logic
 * @description Defines interfaces and types specific to EnvelopeService operations
 * including result types, utility interfaces, and service-specific data structures.
 */

// Note: ListResult types are already defined in infrastructure types

/**
 * Parameters for event publishing operations
 */
export interface EventPublishParams {
  /** Event type to publish */
  readonly eventType: string;
  /** Event payload data */
  readonly payload: Record<string, unknown>;
  /** Whether to publish only if multiple signers exist */
  readonly requireMultipleSigners?: boolean;
}

/**
 * Result of event publishing operation
 */
export interface EventPublishResult {
  /** Whether the event was published */
  readonly published: boolean;
  /** Error message if publishing failed */
  readonly error?: string;
}
