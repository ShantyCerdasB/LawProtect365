/**
 * @fileoverview PreAuthenticationTrigger - Cognito PreAuthentication trigger handler
 * @summary Handles user validation and MFA requirements before authentication
 * @description This trigger validates user access and MFA requirements before
 * allowing authentication to proceed. It can block access for suspended users
 * or enforce MFA for specific roles.
 */

import type { PreAuthEvent, PreAuthResult } from '../types/cognito/PreAuthEvent';
import { CognitoTriggerBase } from './base/CognitoTriggerBase';
import type { CognitoEventData } from '../domain/value-objects';

/**
 * @description PreAuthentication trigger handler that validates user access.
 * @summary Validates user status and MFA requirements before authentication
 */
export class PreAuthenticationTrigger extends CognitoTriggerBase<PreAuthEvent, PreAuthResult> {
  /**
   * @description Processes the orchestration logic for PreAuthentication.
   * @param {PreAuthEvent} event - The Cognito PreAuthentication event
   * @param {CognitoEventData} eventData - Extracted event data
   * @returns {Promise<PreAuthResult>} Promise that resolves to the processed event
   */
  protected async processOrchestration(event: PreAuthEvent, eventData: CognitoEventData): Promise<PreAuthResult> {
    const orchestrator = this.orchestratorFactory.createPreAuthenticationOrchestrator();
    return orchestrator.processPreAuthenticationWithData(event, eventData);
  }

  /**
   * @description Gets the name of the trigger for logging purposes.
   * @returns {string} Trigger name
   */
  protected getTriggerName(): string {
    return 'PreAuthentication';
  }
}

/**
 * @description Lambda handler function for PreAuthentication trigger.
 * @param {PreAuthEvent} event - The Cognito PreAuthentication event
 * @returns {Promise<PreAuthResult>} PreAuthentication result
 */
export const handler = async (event: PreAuthEvent): Promise<PreAuthResult> => {
  const trigger = new PreAuthenticationTrigger();
  return trigger.handler(event);
};
