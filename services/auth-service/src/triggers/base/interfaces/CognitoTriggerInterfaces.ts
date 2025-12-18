/**
 * @fileoverview CognitoTrigger Interfaces - Type definitions for trigger base classes
 * @summary Defines interfaces for Cognito trigger base functionality
 * @description
 * Contains TypeScript interfaces for Cognito trigger base classes,
 * ensuring type safety and consistency across trigger implementations.
 */

import type { CognitoEventData } from '../../../domain/value-objects/CognitoEventData';

/**
 * @description Interface for trigger orchestration processing.
 * @template TEvent - Type of the Cognito trigger event
 * @template TResult - Type of the trigger result
 */
export interface ITriggerOrchestration<TEvent, TResult> {
  /**
   * @description Processes the orchestration logic for the trigger.
   * @param {TEvent} event - The Cognito trigger event
   * @param {CognitoEventData} eventData - Extracted event data
   * @returns {Promise<TResult>} Promise that resolves to the processed result
   */
  processOrchestration(event: TEvent, eventData: CognitoEventData): Promise<TResult>;
}

