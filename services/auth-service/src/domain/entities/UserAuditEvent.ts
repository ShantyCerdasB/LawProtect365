/**
 * @fileoverview UserAuditEvent entity - Represents an audit event for user operations
 * @summary Manages user audit trail and compliance tracking
 * @description The UserAuditEvent entity encapsulates audit information for user operations,
 * including authentication events, role changes, and profile updates.
 */

import { UserId } from '../value-objects/UserId';
import { UserAuditAction } from '../enums/UserAuditAction';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';

/**
 * UserAuditEvent entity representing a user audit event
 * 
 * Manages audit trail information for user operations and compliance tracking.
 */
export class UserAuditEvent {
  constructor(
    private readonly id: string,
    private readonly userId: UserId,
    private readonly action: UserAuditAction,
    private readonly description: string,
    private readonly actorUserId: string,
    private readonly actorEmail: string,
    private readonly networkContext: NetworkSecurityContext,
    private readonly metadata: Record<string, unknown> | undefined,
    private readonly timestamp: Date
  ) {}

  /**
   * Creates a UserAuditEvent from persistence data
   * @param data - Prisma UserAuditEvent data
   * @returns UserAuditEvent instance
   */
  static fromPersistence(data: any): UserAuditEvent {
    return new UserAuditEvent(
      data.id,
      UserId.fromString(data.userId),
      data.action as UserAuditAction,
      data.description,
      data.actorUserId,
      data.actorEmail,
      {
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        country: data.country,
      },
      data.metadata,
      data.timestamp
    );
  }

  /**
   * Creates a new UserAuditEvent
   * @param config - Audit event configuration
   * @returns UserAuditEvent instance
   */
  static create(config: {
    userId: string;
    action: UserAuditAction;
    description: string;
    actorUserId: string;
    actorEmail: string;
    networkContext: NetworkSecurityContext;
    metadata?: Record<string, unknown>;
  }): UserAuditEvent {
    return new UserAuditEvent(
      crypto.randomUUID(),
      UserId.fromString(config.userId),
      config.action,
      config.description,
      config.actorUserId,
      config.actorEmail,
      config.networkContext,
      config.metadata,
      new Date()
    );
  }

  /**
   * Gets the audit event unique identifier
   * @returns The audit event ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Gets the user ID this event relates to
   * @returns The user ID value object
   */
  getUserId(): UserId {
    return this.userId;
  }

  /**
   * Gets the audit action
   * @returns The audit action
   */
  getAction(): UserAuditAction {
    return this.action;
  }

  /**
   * Gets the event description
   * @returns The event description
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * Gets the actor user ID
   * @returns The actor user ID
   */
  getActorUserId(): string {
    return this.actorUserId;
  }

  /**
   * Gets the actor email
   * @returns The actor email
   */
  getActorEmail(): string {
    return this.actorEmail;
  }

  /**
   * Gets the network security context
   * @returns The network context
   */
  getNetworkContext(): NetworkSecurityContext {
    return this.networkContext;
  }

  /**
   * Gets the event metadata
   * @returns The event metadata or undefined
   */
  getMetadata(): Record<string, unknown> | undefined {
    return this.metadata;
  }

  /**
   * Gets the event timestamp
   * @returns The event timestamp
   */
  getTimestamp(): Date {
    return this.timestamp;
  }
}
