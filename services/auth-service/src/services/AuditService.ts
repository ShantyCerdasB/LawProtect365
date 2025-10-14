/**
 * @fileoverview AuditService - Generic audit service for all services
 * @summary Manages audit trail creation and compliance tracking
 * @description Provides generic audit functionality for user actions, system changes,
 * and compliance tracking across all services in the auth-service.
 */

import { UserAuditEventRepository } from '../repositories/UserAuditEventRepository';
import { UserAuditAction } from '../domain/enums/UserAuditAction';
import { UserAuditEvent } from '../domain/entities/UserAuditEvent';
import { auditEventCreationFailed } from '../auth-errors/factories';

/**
 * Generic audit service for all services
 * 
 * Provides audit trail creation and compliance tracking.
 */
export class AuditService {
  constructor(
    private readonly userAuditEventRepository: UserAuditEventRepository
  ) {}

  /**
   * Records user registration audit event
   * @param userId - User ID
   * @param metadata - Additional metadata
   */
  async userRegistered(userId: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.createAuditEvent({
      userId,
      action: UserAuditAction.USER_REGISTERED,
      description: 'User registered via PostAuthentication trigger',
      metadata: { source: 'PostAuthentication', ...metadata }
    });
  }

  /**
   * Records user update audit event
   * @param userId - User ID
   * @param metadata - Additional metadata
   */
  async userUpdated(userId: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.createAuditEvent({
      userId,
      action: UserAuditAction.PROFILE_UPDATED,
      description: 'User updated via PostAuthentication trigger',
      metadata: { source: 'PostAuthentication', ...metadata }
    });
  }

  /**
   * Records MFA enabled audit event
   * @param userId - User ID
   * @param metadata - Additional metadata
   */
  async mfaEnabled(userId: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.createAuditEvent({
      userId,
      action: UserAuditAction.MFA_ENABLED,
      description: 'MFA enabled',
      metadata: { ...metadata }
    });
  }

  /**
   * Records MFA disabled audit event
   * @param userId - User ID
   * @param metadata - Additional metadata
   */
  async mfaDisabled(userId: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.createAuditEvent({
      userId,
      action: UserAuditAction.MFA_DISABLED,
      description: 'MFA disabled',
      metadata: { ...metadata }
    });
  }

  /**
   * Records role assignment audit event
   * @param userId - User ID
   * @param role - Assigned role
   * @param actorId - Actor who made the change
   * @param metadata - Additional metadata
   */
  async roleAssigned(
    userId: string, 
    role: string, 
    actorId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.createAuditEvent({
      userId,
      action: UserAuditAction.ROLE_ASSIGNED,
      description: `Role assigned: ${role}`,
      actorId,
      metadata: { role, ...metadata }
    });
  }

  /**
   * Records role removal audit event
   * @param userId - User ID
   * @param role - Removed role
   * @param actorId - Actor who made the change
   * @param metadata - Additional metadata
   */
  async roleRemoved(
    userId: string, 
    role: string, 
    actorId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.createAuditEvent({
      userId,
      action: UserAuditAction.ROLE_REMOVED,
      description: `Role removed: ${role}`,
      actorId,
      metadata: { role, ...metadata }
    });
  }

  /**
   * Records user activation audit event
   * @param userId - User ID
   * @param actorId - Actor who made the change
   * @param metadata - Additional metadata
   */
  async userActivated(
    userId: string,
    actorId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.createAuditEvent({
      userId,
      action: UserAuditAction.USER_ACTIVATED,
      description: 'User account activated',
      actorId,
      metadata: { ...metadata }
    });
  }

  /**
   * Records user suspension audit event
   * @param userId - User ID
   * @param actorId - Actor who made the change
   * @param metadata - Additional metadata
   */
  async userSuspended(
    userId: string,
    actorId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.createAuditEvent({
      userId,
      action: UserAuditAction.USER_SUSPENDED,
      description: 'User account suspended',
      actorId,
      metadata: { ...metadata }
    });
  }

  /**
   * Records OAuth account linking audit event
   * @param userId - User ID
   * @param provider - OAuth provider
   * @param providerAccountId - Provider account ID
   * @param metadata - Additional metadata
   */
  async oauthAccountLinked(
    userId: string,
    provider: string,
    providerAccountId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.createAuditEvent({
      userId,
      action: UserAuditAction.OAUTH_ACCOUNT_LINKED,
      description: `OAuth account linked: ${provider}`,
      metadata: { provider, providerAccountId, ...metadata }
    });
  }

  /**
   * Records OAuth account unlinking audit event
   * @param userId - User ID
   * @param provider - OAuth provider
   * @param providerAccountId - Provider account ID
   * @param metadata - Additional metadata
   */
  async oauthAccountUnlinked(
    userId: string,
    provider: string,
    providerAccountId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.createAuditEvent({
      userId,
      action: UserAuditAction.OAUTH_ACCOUNT_UNLINKED,
      description: `OAuth account unlinked: ${provider}`,
      metadata: { provider, providerAccountId, ...metadata }
    });
  }

  /**
   * Records custom audit event
   * @param userId - User ID
   * @param action - Audit action
   * @param description - Event description
   * @param actorId - Actor who performed the action
   * @param metadata - Additional metadata
   */
  async recordCustomEvent(
    userId: string,
    action: UserAuditAction,
    description: string,
    actorId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.createAuditEvent({
      userId,
      action,
      description,
      actorId,
      metadata: { ...metadata }
    });
  }

  /**
   * Records OAuth provider linking audit event
   * @param userId - User ID
   * @param provider - OAuth provider
   * @param providerAccountId - Provider account ID
   * @param metadata - Additional metadata
   */
  async userProviderLinked(
    userId: string, 
    provider: string, 
    providerAccountId: string, 
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.createAuditEvent({
      userId,
      action: UserAuditAction.PROFILE_UPDATED, // Using existing action for now
      description: `OAuth provider ${provider} linked to user account`,
      metadata: { 
        source: 'ProviderLinking', 
        provider,
        providerAccountIdHash: this.hashProviderAccountId(providerAccountId),
        ...metadata 
      }
    });
  }

  /**
   * Creates a generic audit event (private helper)
   * @param params - Audit event parameters
   */
  private async createAuditEvent(params: {
    userId: string;
    action: UserAuditAction;
    description: string;
    actorId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const auditEvent = UserAuditEvent.create(params);
      await this.userAuditEventRepository.create(auditEvent);
    } catch (error) {
      throw auditEventCreationFailed({
        cause: `Failed to create audit event: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Hashes provider account ID for privacy in audit logs
   * @param providerAccountId - The provider account ID
   * @returns Hashed version of the account ID
   */
  private hashProviderAccountId(providerAccountId: string): string {
    // Simple hash for audit purposes - in production, use crypto.createHash
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(providerAccountId).digest('hex').substring(0, 16);
  }
}
