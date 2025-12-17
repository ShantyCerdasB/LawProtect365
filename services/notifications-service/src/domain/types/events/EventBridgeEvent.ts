/**
 * @fileoverview EventBridgeEvent - Type definition for EventBridge events
 * @summary Defines the structure of events received from AWS EventBridge
 * @description This type represents the standard EventBridge event structure
 * as received by Lambda functions. It is part of the domain layer to ensure
 * type safety when processing events from external systems.
 */

/**
 * EventBridge event structure as received by Lambda
 * @description Standard AWS EventBridge event format that Lambda functions receive
 */
export interface EventBridgeEvent {
  /** Event version (e.g., "0") */
  version: string;
  /** Unique event identifier */
  id: string;
  /** Event detail type (e.g., "ENVELOPE_INVITATION") */
  'detail-type': string;
  /** Event source (e.g., "signature-service") */
  source: string;
  /** AWS account ID where the event originated */
  account: string;
  /** ISO 8601 timestamp when the event occurred */
  time: string;
  /** AWS region where the event originated */
  region: string;
  /** Event payload (JSON object) */
  detail: Record<string, unknown>;
  /** Optional resource ARNs associated with the event */
  resources?: string[];
}

