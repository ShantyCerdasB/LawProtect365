/**
 * @fileoverview PostAuthenticationTrigger - Cognito PostAuthentication trigger handler
 * @summary Handles user provisioning and synchronization after successful authentication
 * @description This trigger processes user data from Cognito after successful authentication,
 * including user creation/updates, OAuth account linking, MFA synchronization, and audit events.
 * It ensures idempotent user provisioning and maintains data consistency.
 */

import type { PostAuthEvent, PostAuthResult } from '../types/cognito/PostAuthEvent';
import { CognitoTriggerBase } from './base/CognitoTriggerBase';
import type { CognitoEventData } from '../domain/value-objects/CognitoEventData';

/**
 * @description PostAuthentication trigger handler that processes Cognito PostAuthentication events.
 * @summary Delegates to PostAuthenticationOrchestrator for business logic coordination
 */
export class PostAuthenticationTrigger extends CognitoTriggerBase<PostAuthEvent, PostAuthResult> {
  /**
   * @description Processes the orchestration logic for PostAuthentication.
   * @param {PostAuthEvent} event - The Cognito PostAuthentication event
   * @param {CognitoEventData} eventData - Extracted event data
   * @returns {Promise<PostAuthResult>} Promise that resolves to the processed event
   */
  protected async processOrchestration(event: PostAuthEvent, eventData: CognitoEventData): Promise<PostAuthResult> {
    const orchestrator = this.orchestratorFactory.createPostAuthenticationOrchestrator();
    return orchestrator.processPostAuthenticationWithData(event, eventData);
  }

  /**
   * @description Gets the name of the trigger for logging purposes.
   * @returns {string} Trigger name
   */
  protected getTriggerName(): string {
    return 'PostAuthentication';
  }
}

/**
 * @description Lambda handler function for PostAuthentication trigger.
 * @param {PostAuthEvent} event - The Cognito PostAuthentication event
 * @returns {Promise<PostAuthResult>} PostAuthentication result
 */
export const handler = async (event: PostAuthEvent): Promise<PostAuthResult> => {
  const trigger = new PostAuthenticationTrigger();
  return trigger.handler(event);
};
