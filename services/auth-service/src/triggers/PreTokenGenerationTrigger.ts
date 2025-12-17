/**
 * @fileoverview PreTokenGenerationTrigger - Cognito PreTokenGeneration trigger handler
 * @summary Handles JWT token enrichment with user claims before token issuance
 * @description This trigger enriches JWT tokens with user claims from the database
 * and Cognito, ensuring other microservices have reliable context without blocking login.
 */

import { LambdaTriggerBase } from '@lawprotect/shared-ts';
import type { PreTokenGenEvent, PreTokenGenResult } from '../types/cognito/PreTokenGenEvent';
import { PreTokenGenerationOrchestrator } from '../application/triggers/PreTokenGenerationOrchestrator';
import { CompositionRoot } from '../infrastructure/factories/CompositionRoot';

/**
 * PreTokenGeneration trigger handler that enriches JWT tokens with user claims
 * @summary Delegates to PreTokenGenerationOrchestrator for claims enrichment
 * @description This trigger follows SRP by only handling the Lambda trigger concerns
 * and delegating all business logic to the PreTokenGenerationOrchestrator.
 */
export class PreTokenGenerationTrigger extends LambdaTriggerBase<PreTokenGenEvent, PreTokenGenResult> {
  private orchestrator!: PreTokenGenerationOrchestrator;

  /**
   * Process the PreTokenGeneration event
   * @param event - The Cognito PreTokenGeneration event
   * @returns Promise that resolves to the processed event with claims
   */
  protected async processEvent(event: PreTokenGenEvent): Promise<PreTokenGenResult> {
    const cr = await CompositionRoot.build();

    // Initialize orchestrator with dependencies
    this.orchestrator = new PreTokenGenerationOrchestrator(
      cr.userService,
      cr.cognitoService,
      cr.config
    );

    const { cognitoSub } = this.extractUserData(event);
    console.log(`Processing PreTokenGeneration for user: ${cognitoSub}`);

    const result = await this.orchestrator.processPreTokenGeneration(event);

    console.log(`PreTokenGeneration completed for user: ${cognitoSub}`);
    return result;
  }

  /**
   * Extract request ID from the event for logging
   * @param event - The PreTokenGeneration event
   * @returns Request ID if available, undefined otherwise
   */
  protected getRequestId(event: PreTokenGenEvent): string | undefined {
    return event.requestContext?.awsRequestId;
  }

  /**
   * Extract user data from the event
   * @param event - The PreTokenGeneration event
   * @returns Extracted user data
   */
  private extractUserData(event: PreTokenGenEvent) {
    return {
      cognitoSub: event.userName,
      userAttributes: event.request.userAttributes,
      clientMetadata: event.request.clientMetadata
    };
  }
}

/**
 * Lambda handler function for PreTokenGeneration trigger
 * @param event - The Cognito PreTokenGeneration event
 * @returns PreTokenGeneration result with enriched claims
 */
export const handler = async (event: PreTokenGenEvent): Promise<PreTokenGenResult> => {
  const trigger = new PreTokenGenerationTrigger();
  return trigger.handler(event);
};
