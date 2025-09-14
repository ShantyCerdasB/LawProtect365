/**
 * @fileoverview EventBridge infrastructure - Barrel exports for EventBridge
 * @summary Centralized exports for EventBridge infrastructure
 * @description Provides centralized access to all EventBridge-related infrastructure
 * including adapters, configuration, and types.
 */

// Configuration and types
export type {
  EventBridgeConfig,
  EventBridgeEntry,
  EventBridgePutEventsResponse,
  EventBridgeClient
} from './EventBridgeConfig';

export {
  DEFAULT_EVENTBRIDGE_CONFIG,
  EVENTBRIDGE_CONSTANTS
} from './EventBridgeConfig';

// Adapter
export type {
  DomainEvent,
  EventBusPort
} from './EventBridgeAdapter';

export {
  EventBridgeAdapter
} from './EventBridgeAdapter';
