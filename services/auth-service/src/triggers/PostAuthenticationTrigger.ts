/**
 * @fileoverview PostAuthenticationTrigger - Cognito PostAuthentication trigger handler
 * @summary Handles user provisioning and synchronization after successful authentication
 * @description This trigger processes user data from Cognito after successful authentication,
 * including user creation/updates, OAuth account linking, MFA synchronization, and audit events.
 * It ensures idempotent user provisioning and maintains data consistency.
 */

import { LambdaTriggerBase } from '@lawprotect/shared-ts';
import type { PostAuthEvent, PostAuthResult } from '../types/cognito/PostAuthEvent';
import { PostAuthenticationOrchestrator } from '../application/triggers/PostAuthenticationOrchestrator';
import { CompositionRoot } from '../infrastructure/factories/CompositionRoot';

/**
 * PostAuthentication trigger handler that processes Cognito PostAuthentication events
 * @summary Delegates to PostAuthenticationOrchestrator for business logic coordination
 * @description This trigger follows SRP by only handling the Lambda trigger concerns
 * and delegating all business logic to the PostAuthenticationOrchestrator.
 */
export class PostAuthenticationTrigger extends LambdaTriggerBase<PostAuthEvent, PostAuthResult> {
  private orchestrator!: PostAuthenticationOrchestrator;

  /**
   * Process the PostAuthentication event
   * @param event - The Cognito PostAuthentication event
   * @returns Promise that resolves to the processed event
   */
  protected async processEvent(event: PostAuthEvent): Promise<PostAuthResult> {
    const cr = await CompositionRoot.build();

    // Initialize orchestrator with dependencies
    this.orchestrator = new PostAuthenticationOrchestrator(
      cr.userService,
      cr.cognitoService,
      cr.auditService,
      cr.eventPublishingService
    );

    const { cognitoSub } = this.extractUserData(event);
    console.log(`Processing PostAuthentication for user: ${cognitoSub}`);

    const result = await this.orchestrator.processPostAuthentication(event);

    console.log(`PostAuthentication completed for user: ${cognitoSub}`);
    return result;
  }

  /**
   * Extract request ID from the event for logging
   * @param event - The PostAuthentication event
   * @returns Request ID if available, undefined otherwise
   */
  protected getRequestId(event: PostAuthEvent): string | undefined {
    return event.requestContext?.awsRequestId;
  }

  /**
   * Extract user data from the Cognito event (for logging purposes)
   * @param event - The PostAuthentication event
   * @returns Extracted user data
   */
  private extractUserData(event: PostAuthEvent) {
    return {
      cognitoSub: event.userName
    };
  }
}

/**
 * Lambda handler function for PostAuthentication trigger
 * @param event - The Cognito PostAuthentication event
 * @returns PostAuthentication result (echoes back the event)
 */
export const handler = async (event: PostAuthEvent): Promise<PostAuthResult> => {
  const trigger = new PostAuthenticationTrigger();
  return trigger.handler(event);
};
