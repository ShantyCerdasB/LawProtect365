/**
 * @fileoverview AuditEvent entity - Represents an audit event in the system
 * @summary Domain entity for audit events
 * @description The AuditEvent entity represents an audit event that tracks
 * changes and actions performed on entities in the system for compliance
 * and security purposes.
 */

import { AuditEventId } from '../value-objects/AuditEventId';
import { AuditEventType } from '../enums/AuditEventType';

/**
 * AuditEvent entity
 * 
 * Represents an audit event that tracks changes and actions performed
 * on entities in the system for compliance and security purposes.
 */
export class AuditEvent {
  constructor(
    private readonly id: AuditEventId,
    private readonly type: AuditEventType,
    private readonly entityId: string,
    private readonly entityType: string,
    private readonly userId: string,
    private readonly metadata: Record<string, any>,
    private readonly timestamp: Date
  ) {}

  /**
   * Gets the audit event unique identifier
   */
  getId(): AuditEventId {
    return this.id;
  }

  /**
   * Gets the audit event type
   */
  getType(): AuditEventType {
    return this.type;
  }

  /**
   * Gets the entity ID that was audited
   */
  getEntityId(): string {
    return this.entityId;
  }

  /**
   * Gets the entity type that was audited
   */
  getEntityType(): string {
    return this.entityType;
  }

  /**
   * Gets the user ID who performed the action
   */
  getUserId(): string {
    return this.userId;
  }

  /**
   * Gets the audit event metadata
   */
  getMetadata(): Record<string, any> {
    return this.metadata;
  }

  /**
   * Gets the audit event timestamp
   */
  getTimestamp(): Date {
    return this.timestamp;
  }
}
