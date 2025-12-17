/**
 * @fileoverview StrategyRegistry - Registry for event processing strategies
 * @summary Manages and routes events to appropriate strategies
 * @description This registry maintains a collection of event processing strategies
 * and routes events to the appropriate strategy based on event type and source.
 */

import type { EventProcessingStrategy } from '../types/strategy';
import type { NotificationRequest } from '../types/orchestrator';
import { eventTypeUnknown } from '../../notification-errors';

/**
 * Registry for event processing strategies
 * 
 * Maintains a collection of strategies and routes events to the appropriate
 * strategy based on event type and source.
 */
export class StrategyRegistry {
  private strategies: EventProcessingStrategy[] = [];

  /**
   * @description Registers a strategy with the registry
   * @param {EventProcessingStrategy} strategy - Strategy to register
   */
  register(strategy: EventProcessingStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * @description Registers multiple strategies
   * @param {EventProcessingStrategy[]} strategies - Strategies to register
   */
  registerAll(strategies: EventProcessingStrategy[]): void {
    this.strategies.push(...strategies);
  }

  /**
   * @description Finds a strategy that can handle the given event
   * @param {string} eventType - Event type
   * @param {string} source - Event source
   * @returns {EventProcessingStrategy | undefined} Strategy that can handle the event, or undefined
   */
  findStrategy(eventType: string, source: string): EventProcessingStrategy | undefined {
    return this.strategies.find(strategy => strategy.canHandle(eventType, source));
  }

  /**
   * @description Processes an event using the appropriate strategy
   * @param {string} eventType - Event type
   * @param {string} source - Event source
   * @param {Record<string, unknown>} payload - Event payload
   * @param {Record<string, unknown>} [metadata] - Optional event metadata
   * @returns {Promise<NotificationRequest[]>} Array of notification requests
   * @throws {eventTypeUnknown} When no strategy can handle the event
   */
  async process(
    eventType: string,
    source: string,
    payload: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<NotificationRequest[]> {
    const strategy = this.findStrategy(eventType, source);

    if (!strategy) {
      throw eventTypeUnknown({ eventType, source });
    }

    return await strategy.process(payload, metadata);
  }
}

