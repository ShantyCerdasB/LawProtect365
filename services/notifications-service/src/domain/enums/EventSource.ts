/**
 * @fileoverview EventSource - Enum for EventBridge event sources
 * @summary Defines all event sources for type-safe event routing
 * @description Provides type-safe event source constants to identify
 * which service emitted an event for proper routing and processing.
 */

/**
 * Event sources in EventBridge
 */
export enum EventSource {
  SIGNATURE_SERVICE = 'sign.service',
  AUTH_SERVICE = 'auth-service'
}

