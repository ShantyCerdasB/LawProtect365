/**
 * @fileoverview PostAuthenticationTrigger - Cognito PostAuthentication trigger handler
 * @summary Handles user provisioning and synchronization after successful authentication
 * @description This trigger processes user data from Cognito after successful authentication,
 * including user creation/updates, OAuth account linking, MFA synchronization, and audit events.
 * It ensures idempotent user provisioning and maintains data consistency.
 */

import type { PostAuthEvent, PostAuthResult } from '../types/cognito/PostAuthEvent';
import { CompositionRoot } from '../infrastructure/factories/CompositionRoot';
import { authenticationFailed } from '../auth-errors/factories';

/**
 * Cognito PostAuthentication trigger handler
 * 
 * Processes user data after successful authentication, including:
 * - User creation/updates with proper role assignment
 * - OAuth account linking for social identities
 * - MFA status synchronization
 * - Audit trail creation
 * - Integration event publishing
 * 
 * @param event - Cognito PostAuthentication event
 * @returns PostAuthentication result (echoes back the event)
 */
export const handler = async (event: PostAuthEvent): Promise<PostAuthResult> => {
  const cr = await CompositionRoot.build();
  const log = console; // Simple logging for now
  
  try {
    const cognitoSub = event.userName; // Cognito sub
    const attrs = event.request.userAttributes || {};
    const email = attrs.email as string | undefined;
    const givenName = attrs.given_name as string | undefined;
    const familyName = attrs.family_name as string | undefined;

    log.info(`Processing PostAuthentication for user: ${cognitoSub}`);

    // 1) Read Cognito for MFA + identities
    const adminUser = await cr.cognitoService.adminGetUser(cognitoSub);
    const { mfaEnabled, identities } = cr.cognitoService.parseAdminUser(adminUser);

    // 2) Upsert User
    const { user, created, mfaChanged } = await cr.userService.upsertOnPostAuth({
      cognitoSub,
      email,
      givenName,
      familyName,
      mfaEnabled,
      intendedRole: undefined // Will use default role (UNASSIGNED)
    });

    // 3) Link OAuth accounts if present
    if (identities.length > 0) {
      await cr.userService.linkProviderIdentities(user.getId().getValue(), identities).catch(err => {
        log.warn(`OAuth linking failed (non-blocking): ${err instanceof Error ? err.message : String(err)}`);
      });
    }

    // 4) Audit + events
    if (created) {
      await cr.auditService.userRegistered(user.getId().getValue(), { 
        source: 'PostAuthentication',
        role: user.getRole(),
        status: user.getStatus()
      });
      
      // Publish integration event
      await cr.eventPublisherService.publish('UserRegistered', {
        userId: user.getId().getValue(),
        role: user.getRole(),
        status: user.getStatus(),
        mfaEnabled: user.isMfaEnabled(),
        createdAt: user.getCreatedAt().toISOString()
      }).catch(err => {
        log.warn(`Event publishing failed (non-blocking): ${err instanceof Error ? err.message : String(err)}`);
      });
    } else {
      if (mfaChanged) {
        await cr.auditService.mfaToggled(user.getId().getValue(), user.isMfaEnabled());
      }
      
      await cr.auditService.userUpdated(user.getId().getValue(), { 
        source: 'PostAuthentication',
        role: user.getRole(),
        status: user.getStatus()
      });
      
      // Publish integration event
      await cr.eventPublisherService.publish('UserUpdated', {
        userId: user.getId().getValue(),
        role: user.getRole(),
        status: user.getStatus(),
        mfaEnabled: user.isMfaEnabled(),
        updatedAt: user.getUpdatedAt().toISOString()
      }).catch(err => {
        log.warn(`Event publishing failed (non-blocking): ${err instanceof Error ? err.message : String(err)}`);
      });
    }

    log.info(`PostAuthentication completed for user: ${user.getId().getValue()}, created: ${created}, mfaEnabled: ${user.isMfaEnabled()}`);
    return event; // PostAuth returns the same shape
  } catch (err) {
    log.error(`PostAuthentication failed: ${err instanceof Error ? err.message : String(err)}`);
    
    // IMPORTANT: Only throw for critical failures that should block login
    // For non-critical enrichments, we log and continue
    if (err instanceof Error && err.message.includes('cognito')) {
      throw authenticationFailed({ 
        reason: 'post-auth-cognito-failure', 
        cause: err.message 
      });
    }
    
    // For other errors, we still throw to maintain security
    throw authenticationFailed({ 
      reason: 'post-auth-failure', 
      cause: err instanceof Error ? err.message : String(err) 
    });
  }
};
