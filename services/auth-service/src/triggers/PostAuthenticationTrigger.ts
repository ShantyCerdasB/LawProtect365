/**
 * @fileoverview PostAuthenticationTrigger - Cognito PostAuthentication trigger handler
 * @summary Handles user provisioning and synchronization after successful authentication
 * @description This trigger processes user data from Cognito after successful authentication,
 * including user creation/updates, OAuth account linking, MFA synchronization, and audit events.
 * It ensures idempotent user provisioning and maintains data consistency.
 */

import { LambdaTriggerBase } from '@lawprotect/shared-ts';
import type { PostAuthEvent, PostAuthResult } from '../types/cognito/PostAuthEvent';
import { CompositionRoot } from '../infrastructure/factories/CompositionRoot';
import { authenticationFailed } from '../auth-errors/factories';
import { User } from '../domain/entities/User';

/**
 * PostAuthentication trigger handler that processes Cognito PostAuthentication events
 * @summary Coordinates user data processing, OAuth linking, audit events, and event publishing
 * @description This trigger handles the complete flow of user authentication processing including user upsert, OAuth account linking, audit logging, and integration event publishing
 */
export class PostAuthenticationTrigger extends LambdaTriggerBase<PostAuthEvent, PostAuthResult> {
  private cr: any;

  /**
   * Process the PostAuthentication event
   * @param event - The Cognito PostAuthentication event
   * @returns Promise that resolves to the processed event
   */
  protected async processEvent(event: PostAuthEvent): Promise<PostAuthResult> {
    this.cr = await CompositionRoot.build();
    const log = this.cr.logger;

    const { cognitoSub, email, givenName, familyName } = this.extractUserData(event);
    log.info(`Processing PostAuthentication for user: ${cognitoSub}`);

    const cognitoData = await this.getCognitoData(cognitoSub);
    const userResult = await this.upsertUser({ cognitoSub, email, givenName, familyName }, cognitoData);
    
    await this.linkOAuthAccounts(userResult.user, cognitoData.identities);
    await this.createAuditEvents(userResult.user, userResult.created, userResult.mfaChanged);
    await this.publishEvents(userResult.user, userResult.created);

    log.info(`PostAuthentication completed for user: ${userResult.user.getId().toString()}, created: ${userResult.created}, mfaEnabled: ${userResult.user.isMfaEnabled()}`);
    return event;
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
   * Extract user data from the Cognito event
   * @param event - The PostAuthentication event
   * @returns Extracted user data
   */
  private extractUserData(event: PostAuthEvent) {
    const attrs = event.request.userAttributes || {};
    return {
      cognitoSub: event.userName,
      email: attrs.email as string | undefined,
      givenName: attrs.given_name as string | undefined,
      familyName: attrs.family_name as string | undefined
    };
  }

  /**
   * Get Cognito user data including MFA status and identities
   * @param cognitoSub - The Cognito user sub
   * @returns Cognito user data
   */
  private async getCognitoData(cognitoSub: string) {
    try {
      const adminUser = await this.cr.cognitoService.adminGetUser(cognitoSub);
      return this.cr.cognitoService.parseAdminUser(adminUser);
    } catch (error) {
      throw authenticationFailed({
        reason: 'post-auth-cognito-failure',
        cause: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Upsert user in the database
   * @param userData - User data from the event
   * @param cognitoData - Cognito user data
   * @returns User upsert result
   */
  private async upsertUser(userData: any, cognitoData: any) {
    try {
      return await this.cr.userService.upsertOnPostAuth({
        ...userData,
        mfaEnabled: cognitoData.mfaEnabled,
        intendedRole: undefined,
        defaultRole: this.cr.config.defaultRole
      });
    } catch (error) {
      throw authenticationFailed({
        reason: 'post-auth-user-upsert-failure',
        cause: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Link OAuth accounts for the user (non-blocking)
   * @param user - The user entity
   * @param identities - OAuth identities from Cognito
   */
  private async linkOAuthAccounts(user: User, identities: any[]) {
    if (identities.length > 0) {
      await this.cr.userService.linkProviderIdentities(user.getId().toString(), identities).catch((err: unknown) => {
        this.cr.logger.warn(`OAuth linking failed (non-blocking): ${err instanceof Error ? err.message : String(err)}`);
      });
    }
  }

  /**
   * Create audit events for user actions
   * @param user - The user entity
   * @param created - Whether the user was created
   * @param mfaChanged - Whether MFA status changed
   */
  private async createAuditEvents(user: User, created: boolean, mfaChanged: boolean) {
    if (created) {
      await this.cr.auditService.userRegistered(user.getId().toString(), {
        source: 'PostAuthentication',
        role: user.getRole(),
        status: user.getStatus()
      });
    } else {
      if (mfaChanged) {
        if (user.isMfaEnabled()) {
          await this.cr.auditService.mfaEnabled(user.getId().toString());
        } else {
          await this.cr.auditService.mfaDisabled(user.getId().toString());
        }
      }
      await this.cr.auditService.userUpdated(user.getId().toString(), {
        source: 'PostAuthentication',
        role: user.getRole(),
        status: user.getStatus()
      });
    }
  }

  /**
   * Publish integration events (non-blocking)
   * @param user - The user entity
   * @param created - Whether the user was created
   */
  private async publishEvents(user: User, created: boolean) {
    const eventType = created ? 'UserRegistered' : 'UserUpdated';
    const eventData = {
      userId: user.getId().toString(),
      role: user.getRole(),
      status: user.getStatus(),
      mfaEnabled: user.isMfaEnabled(),
      ...(created ? { createdAt: user.getCreatedAt().toISOString() } : { updatedAt: user.getUpdatedAt().toISOString() })
    };

    await this.cr.eventPublisherService.publish(eventType, eventData).catch((err: unknown) => {
      this.cr.logger.warn(`Event publishing failed (non-blocking): ${err instanceof Error ? err.message : String(err)}`);
    });
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
