/**
 * @fileoverview EventPublishingService - Service for publishing integration events
 * @summary Centralized service for publishing integration events across all triggers
 * @description This service encapsulates the logic for publishing integration events
 * using the Outbox pattern, providing a clean interface for all triggers and use cases.
 */

import { IntegrationEventPublisher, nowIso } from '@lawprotect/shared-ts';
import { User } from '../domain/entities/User';

/**
 * Service for publishing integration events
 * 
 * Provides a centralized way to publish integration events across all triggers
 * and use cases, following the Single Responsibility Principle.
 */
export class EventPublishingService {
  constructor(private readonly eventPublisher: IntegrationEventPublisher) {}

  /**
   * Publishes user registration event
   * @param user - The user entity
   * @param metadata - Additional metadata
   */
  async publishUserRegistered(user: User, metadata?: Record<string, unknown>): Promise<void> {
    await this.publishUserEvent('UserRegistered', user, {
      createdAt: user.getCreatedAt().toISOString(),
      ...metadata
    });
  }

  /**
   * Publishes user update event
   * @param user - The user entity
   * @param metadata - Additional metadata
   */
  async publishUserUpdated(user: User, metadata?: Record<string, unknown>): Promise<void> {
    await this.publishUserEvent('UserUpdated', user, {
      updatedAt: user.getUpdatedAt().toISOString(),
      ...metadata
    });
  }

  /**
   * Publishes user role change event
   * @param user - The user entity
   * @param oldRole - Previous role
   * @param newRole - New role
   * @param metadata - Additional metadata
   */
  async publishUserRoleChanged(
    user: User, 
    oldRole: string, 
    newRole: string, 
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.publishUserEvent('UserRoleChanged', user, {
      oldRole,
      newRole,
      ...metadata
    });
  }

  /**
   * Publishes user status change event
   * @param user - The user entity
   * @param oldStatus - Previous status
   * @param newStatus - New status
   * @param metadata - Additional metadata
   */
  async publishUserStatusChanged(
    user: User, 
    oldStatus: string, 
    newStatus: string, 
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.publishUserEvent('UserStatusChanged', user, {
      oldStatus,
      newStatus,
      ...metadata
    });
  }

  /**
   * Publishes MFA status change event
   * @param user - The user entity
   * @param mfaEnabled - Whether MFA is enabled
   * @param metadata - Additional metadata
   */
  async publishMfaStatusChanged(
    user: User, 
    mfaEnabled: boolean, 
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.publishUserEvent('MfaStatusChanged', user, {
      mfaEnabled,
      ...metadata
    });
  }

  /**
   * Publishes OAuth account linked event
   * @param user - The user entity
   * @param provider - OAuth provider
   * @param providerAccountId - Provider account ID
   * @param metadata - Additional metadata
   */
  async publishOAuthAccountLinked(
    user: User, 
    provider: string, 
    providerAccountId: string, 
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.publishUserEvent('OAuthAccountLinked', user, {
      provider,
      providerAccountId,
      ...metadata
    });
  }

  /**
   * Publishes OAuth account unlinked event
   * @param user - The user entity
   * @param provider - OAuth provider
   * @param providerAccountId - Provider account ID
   * @param metadata - Additional metadata
   */
  async publishOAuthAccountUnlinked(
    user: User, 
    provider: string, 
    providerAccountId: string, 
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.publishUserEvent('OAuthAccountUnlinked', user, {
      provider,
      providerAccountId,
      ...metadata
    });
  }

  /**
   * Generic method to publish user-related events
   * @param eventType - Type of event to publish
   * @param user - The user entity
   * @param additionalData - Additional event data
   */
  private async publishUserEvent(
    eventType: string, 
    user: User, 
    additionalData: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      const eventData = {
        userId: user.getId().toString(),
        email: user.getEmail()?.toString(),
        role: user.getRole(),
        status: user.getStatus(),
        mfaEnabled: user.isMfaEnabled(),
        firstName: user.getFirstName(),
        lastName: user.getLastName(),
        timestamp: nowIso(),
        ...additionalData
      };

      await this.eventPublisher.publish({
        type: eventType,
        source: 'auth-service',
        data: eventData
      }, user.getId().toString());
    } catch (error) {
      // Log warning but don't fail the entire flow
      console.warn(`Integration event publishing failed (non-blocking): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Publishes a custom event with full control over the event structure
   * @param eventType - Type of event to publish
   * @param eventData - Complete event data
   * @param dedupId - Optional deduplication ID
   */
  async publishCustomEvent(
    eventType: string, 
    eventData: Record<string, unknown>, 
    dedupId?: string
  ): Promise<void> {
    try {
      await this.eventPublisher.publish({
        type: eventType,
        source: 'auth-service',
        data: {
          ...eventData,
          timestamp: nowIso()
        }
      }, dedupId);
    } catch (error) {
      // Non-blocking error - event publishing failure shouldn't break the flow
    }
  }

  /**
   * Publishes user provider linked event
   * @param user - The user entity
   * @param identity - The provider identity
   * @param metadata - Additional metadata
   */
  async publishUserProviderLinked(
    user: User, 
    identity: { provider: string; providerAccountId: string; email?: string; name?: string },
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.publishUserEvent('UserProviderLinked', user, {
      provider: identity.provider,
      providerAccountId: identity.providerAccountId,
      providerEmail: identity.email,
      providerName: identity.name,
      linkedAt: nowIso(),
      ...metadata
    });
  }

  async publishUserProviderUnlinked(
    user: User, 
    provider: string, 
    providerAccountId: string, 
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.publishUserEvent('UserProviderUnlinked', user, {
      provider,
      providerAccountId,
      unlinkedAt: nowIso(),
      ...metadata
    });
  }
}
