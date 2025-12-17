/**
 * @fileoverview NotificationEventProcessor - Processes EventBridge events into notification requests
 * @summary Maps EventBridge events to notification requests using Strategy Pattern
 * @description Processes different event types from signature-service and auth-service
 * using registered strategies. This processor delegates to strategies for actual processing.
 */

import type { ProcessNotificationRequest } from '../../../domain/types/orchestrator';
import type { NotificationRequest } from '../../../domain/types/orchestrator';
import { StrategyRegistry } from '../../../domain/strategies';

/**
 * Processes EventBridge events and converts them to notification requests using Strategy Pattern.
 * 
 * This processor uses a StrategyRegistry to route events to appropriate strategies.
 * Each strategy handles a specific event type or set of event types.
 */
export class NotificationEventProcessor {
  constructor(private readonly strategyRegistry: StrategyRegistry) {}

  /**
   * @description Processes an EventBridge event and returns notification requests
   * @param {ProcessNotificationRequest} request - EventBridge event data
   * @returns {Promise<NotificationRequest[]>} Array of notification requests
   * @throws {eventTypeUnknown} When event type is not recognized
   * @throws {eventValidationFailed} When event payload is invalid
   */
  async processEvent(request: ProcessNotificationRequest): Promise<NotificationRequest[]> {
    const { eventType, source, payload, metadata } = request;

    return await this.strategyRegistry.process(eventType, source, payload, metadata);
  }
}
