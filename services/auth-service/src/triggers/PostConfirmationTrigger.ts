/**
 * @fileoverview PostConfirmationTrigger - Cognito PostConfirmation trigger handler
 * @summary Handles user registration and setup after email/phone confirmation
 * @description This trigger processes user registration after successful confirmation,
 * including user creation, role assignment, provider linking, and audit events.
 */

import { LambdaTriggerBase } from '@lawprotect/shared-ts';
import type { PostConfirmationEvent, PostConfirmationResult } from '../types/cognito/PostConfirmationEvent';
import { PostConfirmationOrchestrator } from '../application/PostConfirmationOrchestrator';
import { CompositionRoot } from '../infrastructure/factories/CompositionRoot';
 
/**
 * PostConfirmation trigger handler that processes user registration
 * @summary Delegates to PostConfirmationOrchestrator for user registration
 * @description This trigger follows SRP by only handling the Lambda trigger concerns 
 * and delegating all business logic to the PostConfirmationOrchestrator.
 */
export class PostConfirmationTrigger extends LambdaTriggerBase<PostConfirmationEvent, PostConfirmationResult> {
  private orchestrator!: PostConfirmationOrchestrator;

  /**
   * Process the PostConfirmation event
   * @param event - The Cognito PostConfirmation event
   * @returns Promise that resolves to the processed event
   */
  protected async processEvent(event: PostConfirmationEvent): Promise<PostConfirmationResult> {
    const cr = await CompositionRoot.build();

    // Initialize orchestrator with dependencies
    this.orchestrator = new PostConfirmationOrchestrator(
      cr.userService,
      cr.cognitoService,
      cr.auditService,
      cr.eventPublishingService,
      cr.config,
      cr.logger
    );

    const { cognitoSub } = this.extractUserData(event);
    cr.logger.info('Processing PostConfirmation', { cognitoSub });

    const result = await this.orchestrator.processPostConfirmation(event);

    cr.logger.info('PostConfirmation completed successfully', { cognitoSub });
    return result;
  }

  /**
   * Extract request ID from the event for logging
   * @param event - The PostConfirmation event
   * @returns Request ID if available, undefined otherwise
   */
  protected getRequestId(event: PostConfirmationEvent): string | undefined {
    return event.requestContext?.awsRequestId;
  }

  /**
   * Extract user data from the event
   * @param event - The PostConfirmation event
   * @returns Extracted user data
   */
  private extractUserData(event: PostConfirmationEvent) {
    return {
      cognitoSub: event.userName,
      userAttributes: event.request.userAttributes,
      clientMetadata: event.request.clientMetadata
    };
  }
}

/**
 * Lambda handler function for PostConfirmation trigger
 * @param event - The Cognito PostConfirmation event
 * @returns PostConfirmation result (echoes back the event)
 */
export const handler = async (event: PostConfirmationEvent): Promise<PostConfirmationResult> => {
  const trigger = new PostConfirmationTrigger();
  return trigger.handler(event);
};
