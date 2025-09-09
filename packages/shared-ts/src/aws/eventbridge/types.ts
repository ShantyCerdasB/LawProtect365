/**
 * @file types.ts
 * @summary EventBridge implementation types
 * @description Types for EventBridge implementation
 */

export interface EventBusPortAdapterOptions {
  busName: string;
  source: string;
  client: any;
  resources?: string[];
  maxEntriesPerBatch?: number;
}





