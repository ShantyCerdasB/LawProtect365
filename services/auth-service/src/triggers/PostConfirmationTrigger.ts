/**
 * @fileoverview PostConfirmationTrigger - Cognito PostConfirmation trigger handler
 * @summary Handles user registration and setup after email/phone confirmation
 * @description This trigger processes user registration after successful confirmation,
 * including user creation, role assignment, provider linking, and audit events.
 */

import type { PostConfirmationEvent, PostConfirmationResult } from '../types/cognito/PostConfirmationEvent';
import { CognitoTriggerBase } from './base/CognitoTriggerBase';
import type { CognitoEventData } from '../domain/value-objects';

/**
 * @description PostConfirmation trigger handler that processes user registration.
 * @summary Delegates to PostConfirmationOrchestrator for user registration
 */
export class PostConfirmationTrigger extends CognitoTriggerBase<PostConfirmationEvent, PostConfirmationResult> {
  /**
   * @description Processes the orchestration logic for PostConfirmation.
   * @param {PostConfirmationEvent} event - The Cognito PostConfirmation event
   * @param {CognitoEventData} eventData - Extracted event data
   * @returns {Promise<PostConfirmationResult>} Promise that resolves to the processed event
   */
  protected async processOrchestration(event: PostConfirmationEvent, eventData: CognitoEventData): Promise<PostConfirmationResult> {
    const orchestrator = this.orchestratorFactory.createPostConfirmationOrchestrator();
    return orchestrator.processPostConfirmationWithData(event, eventData);
  }

  /**
   * @description Gets the name of the trigger for logging purposes.
   * @returns {string} Trigger name
   */
  protected getTriggerName(): string {
    return 'PostConfirmation';
  }
}

/**
 * @description Lambda handler function for PostConfirmation trigger.
 * @param {PostConfirmationEvent} event - The Cognito PostConfirmation event
 * @returns {Promise<PostConfirmationResult>} PostConfirmation result
 */
export const handler = async (event: PostConfirmationEvent): Promise<PostConfirmationResult> => {
  const trigger = new PostConfirmationTrigger();
  return trigger.handler(event);
};
