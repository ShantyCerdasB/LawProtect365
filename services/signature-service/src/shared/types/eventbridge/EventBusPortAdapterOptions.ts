/**
 * @file EventBusPortAdapterOptions.ts
 * @summary Configuration options for EventBusPortAdapter
 * @description Options for configuring the EventBusPortAdapter
 */

/**
 * Configuration options for EventBusPortAdapter.
 */
export interface EventBusPortAdapterOptions {
  /** EventBridge bus name to publish events to. */
  busName: string;
  
  /** Source identifier for events (e.g., "lawprotect.signature-service"). */
  source: string;
  
  /** EventBridge client that implements EventBridgeClientPort. */
  client: any; // EventBridgeClientPort from shared contracts
  
  /** Optional AWS resources to associate with events. */
  resources?: string[];
  
  /** Maximum number of events per batch (default: 10, max: 10). */
  maxEntriesPerBatch?: number;
}
