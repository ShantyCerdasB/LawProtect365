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
      action: UserAuditAction.USER_REGISTERED, // Using existing action
      description: 'User updated via PostAuthentication trigger',
      metadata: { source: 'PostAuthentication', ...metadata }
    });
  }

  /**
   * Records MFA toggle audit event
   * @param userId - User ID
   * @param enabled - MFA enabled status
   */
  async mfaToggled(userId: string, enabled: boolean): Promise<void> {
    await this.createAuditEvent({
      userId,
      action: UserAuditAction.MFA_TOGGLED,
      description: `MFA ${enabled ? 'enabled' : 'disabled'}`,
      metadata: { enabled }
    });
  }

  /**
   * Records role change audit event
   * @param userId - User ID
   * @param oldRole - Previous role
   * @param newRole - New role
   * @param actorId - Actor who made the change
   */
  async roleChanged(
    userId: string, 
    oldRole: string, 
    newRole: string, 
    actorId?: string
  ): Promise<void> {
    await this.createAuditEvent({
      userId,
      action: UserAuditAction.ROLE_CHANGED,
      description: `Role changed from ${oldRole} to ${newRole}`,
      actorId,
      metadata: { oldRole, newRole }
    });
  }

  /**
   * Records account status change audit event
   * @param userId - User ID
   * @param oldStatus - Previous status
   * @param newStatus - New status
   * @param actorId - Actor who made the change
   */
  async accountStatusChanged(
    userId: string,
    oldStatus: string,
    newStatus: string,
    actorId?: string
  ): Promise<void> {
    await this.createAuditEvent({
      userId,
      action: UserAuditAction.ACCOUNT_STATUS_CHANGED,
      description: `Account status changed from ${oldStatus} to ${newStatus}`,
      actorId,
      metadata: { oldStatus, newStatus }
    });
  }

  /**
   * Records OAuth account linking audit event
   * @param userId - User ID
   * @param provider - OAuth provider
   * @param providerAccountId - Provider account ID
   */
  async oauthAccountLinked(
    userId: string,
    provider: string,
    providerAccountId: string
  ): Promise<void> {
    await this.createAuditEvent({
      userId,
      action: UserAuditAction.LINKED_IDP,
      description: `OAuth account linked: ${provider}`,
      metadata: { provider, providerAccountId }
    });
  }

  /**
   * Records OAuth account unlinking audit event
   * @param userId - User ID
   * @param provider - OAuth provider
   * @param providerAccountId - Provider account ID
   */
  async oauthAccountUnlinked(
    userId: string,
    provider: string,
    providerAccountId: string
  ): Promise<void> {
    await this.createAuditEvent({
      userId,
      action: UserAuditAction.UNLINKED_IDP,
      description: `OAuth account unlinked: ${provider}`,
      metadata: { provider, providerAccountId }
    });
  }

  /**
   * Creates a generic audit event
   * @param params - Audit event parameters
   */
  private async createAuditEvent(params: {
    userId: string;
    action: UserAuditAction;
    description?: string;
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
}
