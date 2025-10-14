/**
 * @fileoverview PreAuthenticationTrigger - Cognito PreAuthentication trigger handler
 * @summary Handles user validation and MFA requirements before authentication
 * @description This trigger validates user access and MFA requirements before
 * allowing authentication to proceed. It can block access for suspended users
 * or enforce MFA for specific roles.
 */

import { LambdaTriggerBase } from '@lawprotect/shared-ts';
import type { PreAuthEvent, PreAuthResult } from '../types/cognito/PreAuthEvent';
import { PreAuthenticationOrchestrator } from '../application/PreAuthenticationOrchestrator';
import { CompositionRoot } from '../infrastructure/factories/CompositionRoot';

/**
 * PreAuthentication trigger handler that validates user access
 * @summary Validates user status and MFA requirements before authentication
 * @description This trigger follows SRP by only handling the Lambda trigger concerns
 * and delegating all business logic to appropriate services.
 */
export class PreAuthenticationTrigger extends LambdaTriggerBase<PreAuthEvent, PreAuthResult> {
  private orchestrator!: PreAuthenticationOrchestrator;

  /**
   * Process the PreAuthentication event
   * @param event - The Cognito PreAuthentication event
   * @returns Promise that resolves to the processed event
   */
  protected async processEvent(event: PreAuthEvent): Promise<PreAuthResult> {
    const cr = await CompositionRoot.build();

    // Initialize orchestrator with dependencies
    this.orchestrator = new PreAuthenticationOrchestrator(
      cr.userService,
      cr.cognitoService
    );

    const { cognitoSub } = this.extractUserData(event);
    console.log(`Processing PreAuthentication for user: ${cognitoSub}`);

    const result = await this.orchestrator.processPreAuthentication(event);

    console.log(`PreAuthentication completed for user: ${cognitoSub}`);
    return result;
  }

  /**
   * Extract request ID from the event for logging
   * @param event - The PreAuthentication event
   * @returns Request ID if available, undefined otherwise
   */
  protected getRequestId(event: PreAuthEvent): string | undefined {
    return event.requestContext?.awsRequestId;
  }

  /**
   * Extract user data from the Cognito event (for logging purposes)
   * @param event - The PreAuthentication event
   * @returns Extracted user data
   */
  private extractUserData(event: PreAuthEvent) {
    return {
      cognitoSub: event.userName
    };
  }
}

/**
 * Lambda handler function for PreAuthentication trigger
 * @param event - The Cognito PreAuthentication event
 * @returns PreAuthentication result (echoes back the event)
 */
export const handler = async (event: PreAuthEvent): Promise<PreAuthResult> => {
  const trigger = new PreAuthenticationTrigger();
  return trigger.handler(event);
};
