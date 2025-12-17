/**
 * @fileoverview EventProcessingStrategy - Interface for event processing strategies
 * @summary Defines the contract for event processing strategies
 * @description This interface defines the contract that all event processing strategies
 * must implement. Each strategy handles a specific event type or set of event types.
 */

import type { NotificationRequest } from '../orchestrator';

/**
 * Strategy interface for processing events into notification requests
 * 
 * Each strategy handles a specific event type or set of related event types,
 * converting EventBridge events into notification requests.
 */
export interface EventProcessingStrategy {
  /**
   * @description Determines if this strategy can handle the given event
   * @param {string} eventType - Event type
   * @param {string} source - Event source
   * @returns {boolean} True if this strategy can handle the event
   */
  canHandle(eventType: string, source: string): boolean;

  /**
   * @description Processes an event and returns notification requests
   * @param {Record<string, unknown>} payload - Event payload
   * @param {Record<string, unknown>} [metadata] - Optional event metadata
   * @returns {Promise<NotificationRequest[]>} Array of notification requests
   * @throws {Error} When payload is invalid or processing fails
   */
  process(
    payload: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<NotificationRequest[]>;
}

