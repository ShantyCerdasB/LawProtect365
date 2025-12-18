/**
 * @fileoverview PreTokenGenerationTrigger - Cognito PreTokenGeneration trigger handler
 * @summary Handles JWT token enrichment with user claims before token issuance
 * @description This trigger enriches JWT tokens with user claims from the database
 * and Cognito, ensuring other microservices have reliable context without blocking login.
 */

import type { PreTokenGenEvent, PreTokenGenResult } from '../types/cognito/PreTokenGenEvent';
import { CognitoTriggerBase } from './base/CognitoTriggerBase';
import type { CognitoEventData } from '../domain/value-objects';

/**
 * @description PreTokenGeneration trigger handler that enriches JWT tokens with user claims.
 * @summary Delegates to PreTokenGenerationOrchestrator for claims enrichment
 */
export class PreTokenGenerationTrigger extends CognitoTriggerBase<PreTokenGenEvent, PreTokenGenResult> {
  /**
   * @description Processes the orchestration logic for PreTokenGeneration.
   * @param {PreTokenGenEvent} event - The Cognito PreTokenGeneration event
   * @param {CognitoEventData} eventData - Extracted event data
   * @returns {Promise<PreTokenGenResult>} Promise that resolves to the processed event with claims
   */
  protected async processOrchestration(event: PreTokenGenEvent, eventData: CognitoEventData): Promise<PreTokenGenResult> {
    const orchestrator = this.orchestratorFactory.createPreTokenGenerationOrchestrator();
    return orchestrator.processPreTokenGenerationWithData(event, eventData);
  }

  /**
   * @description Gets the name of the trigger for logging purposes.
   * @returns {string} Trigger name
   */
  protected getTriggerName(): string {
    return 'PreTokenGeneration';
  }
}

/**
 * @description Lambda handler function for PreTokenGeneration trigger.
 * @param {PreTokenGenEvent} event - The Cognito PreTokenGeneration event
 * @returns {Promise<PreTokenGenResult>} PreTokenGeneration result with enriched claims
 */
export const handler = async (event: PreTokenGenEvent): Promise<PreTokenGenResult> => {
  const trigger = new PreTokenGenerationTrigger();
  return trigger.handler(event);
};
