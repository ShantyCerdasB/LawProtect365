/**
 * @fileoverview PostAuthenticationOrchestrator - Application service for PostAuthentication flow
 * @summary Coordinates the complete PostAuthentication business flow
 * @description This application service orchestrates the PostAuthentication trigger flow,
 * including user data extraction, Cognito integration, user upsert, OAuth linking,
 * audit events, and integration event publishing.
 */

import { User } from '../../domain/entities/User';
import { UserService } from '../../services/UserService';
import { CognitoService } from '../../services/CognitoService';
import { AuditService } from '../../services/AuditService';
import { EventPublishingService } from '../../services/EventPublishingService';
import { PostAuthEvent, PostAuthResult } from '../../types/cognito/PostAuthEvent';
import { authenticationFailed } from '../../auth-errors/factories';

/**
 * Application service that orchestrates the PostAuthentication flow
 * 
 * Coordinates user data processing, OAuth linking, audit events, and event publishing
 * following the Single Responsibility Principle by delegating to specific services.
 */
export class PostAuthenticationOrchestrator {
  constructor(
    private readonly userService: UserService,
    private readonly cognitoService: CognitoService,
    private readonly auditService: AuditService,
    private readonly eventPublishingService: EventPublishingService
  ) {}

  /**
   * Process the complete PostAuthentication flow
   * @param event - The Cognito PostAuthentication event
   * @returns Promise that resolves to the processed event
   */
  async processPostAuthentication(event: PostAuthEvent): Promise<PostAuthResult> {
    const { cognitoSub, email, givenName, familyName } = this.extractUserData(event);

    const cognitoData = await this.getCognitoData(cognitoSub);
    const userResult = await this.upsertUser({ cognitoSub, email, givenName, familyName }, cognitoData);
    
    await this.linkOAuthAccounts(userResult.user, cognitoData.identities);
    await this.createAuditEvents(userResult.user, userResult.created, userResult.mfaChanged);
    await this.publishIntegrationEvents(userResult.user, userResult.created);

    return event;
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
      const adminUser = await this.cognitoService.adminGetUser(cognitoSub);
      return this.cognitoService.parseAdminUser(adminUser);
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
      return await this.userService.upsertOnPostAuth({
        ...userData,
        mfaEnabled: cognitoData.mfaEnabled,
        intendedRole: undefined
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
      await this.userService.linkProviderIdentities(user.getId().toString(), identities).catch((err: unknown) => {
        // Log warning but don't fail the entire flow
        console.warn(`OAuth linking failed (non-blocking): ${err instanceof Error ? err.message : String(err)}`);
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
      await this.auditService.userRegistered(user.getId().toString(), {
        source: 'PostAuthentication',
        role: user.getRole(),
        status: user.getStatus()
      });
    } else {
      if (mfaChanged) {
        if (user.isMfaEnabled()) {
          await this.auditService.mfaEnabled(user.getId().toString());
        } else {
          await this.auditService.mfaDisabled(user.getId().toString());
        }
      }
      await this.auditService.userUpdated(user.getId().toString(), {
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
  private async publishIntegrationEvents(user: User, created: boolean) {
    if (created) {
      await this.eventPublishingService.publishUserRegistered(user, {
        source: 'PostAuthentication'
      });
    } else {
      await this.eventPublishingService.publishUserUpdated(user, {
        source: 'PostAuthentication'
      });
    }
  }

}
