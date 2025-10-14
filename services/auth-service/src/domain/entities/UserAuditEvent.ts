/**
 * @fileoverview UserAuditEvent entity - Audit trail for user actions
 * @summary Manages user audit events and compliance tracking
 * @description The UserAuditEvent entity handles audit trail creation and management
 * for user-related actions, ensuring compliance and security monitoring.
 */

import { UserId } from '../value-objects/UserId';
import { UserAuditAction } from '../enums/UserAuditAction';

/**
 * UserAuditEvent entity representing an audit trail entry
 * 
 * Manages audit events for user actions and system changes.
 */
export class UserAuditEvent {
  constructor(
    private readonly id: string,
    private readonly userId: UserId,
    private readonly action: UserAuditAction,
    private readonly description: string | undefined,
    private readonly actorId: string | undefined,
    private readonly ipAddress: string | undefined,
    private readonly userAgent: string | undefined,
    private readonly metadata: Record<string, unknown> | undefined,
    private readonly createdAt: Date
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
      data.actorId,
      data.ipAddress,
      data.userAgent,
      data.metadata,
      data.createdAt
    );
  }

  /**
   * Creates a new UserAuditEvent
   * @param params - Audit event parameters
   * @returns UserAuditEvent instance
   */
  static create(params: {
    userId: string;
    action: UserAuditAction;
    description?: string;
    actorId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): UserAuditEvent {
    return new UserAuditEvent(
      crypto.randomUUID(),
      UserId.fromString(params.userId),
      params.action,
      params.description,
      params.actorId,
      params.ipAddress,
      params.userAgent,
      params.metadata,
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
   * Gets the user ID this audit event belongs to
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
   * Gets the audit description
   * @returns The audit description or undefined
   */
  getDescription(): string | undefined {
    return this.description;
  }

  /**
   * Gets the actor ID who performed the action
   * @returns The actor ID or undefined
   */
  getActorId(): string | undefined {
    return this.actorId;
  }

  /**
   * Gets the IP address
   * @returns The IP address or undefined
   */
  getIpAddress(): string | undefined {
    return this.ipAddress;
  }

  /**
   * Gets the user agent
   * @returns The user agent or undefined
   */
  getUserAgent(): string | undefined {
    return this.userAgent;
  }

  /**
   * Gets the metadata
   * @returns The metadata or undefined
   */
  getMetadata(): Record<string, unknown> | undefined {
    return this.metadata;
  }

  /**
   * Gets the creation timestamp
   * @returns The creation timestamp
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }
}