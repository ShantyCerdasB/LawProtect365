/**
 * @fileoverview AuditEventService - Event service for audit events
 * @summary Handles audit-specific domain events
 * @description This service handles audit-specific domain events and
 * provides event publishing functionality for audit operations.
 */

import { BaseEventService, DomainEvent } from '@lawprotect/shared-ts';
import { AuditEvent } from '../../domain/entities/AuditEvent';
import { AuditEventTypes } from '../../domain/enums/AuditEventTypes';

/**
 * AuditEventService implementation
 * 
 * Handles audit-specific domain events and provides event publishing
 * functionality for audit operations.
 */
export class AuditEventService extends BaseEventService {
  /**
   * Publishes a module-specific event
   * @param event - Domain event to publish
   * @param traceId - Optional trace ID for observability
   */
  async publishModuleEvent(event: DomainEvent, traceId?: string): Promise<void> {
    await this.publishDomainEvent(event, traceId);
  }
  /**
   * Publishes audit event created
   * @param auditEvent - The created audit event
   */
  async publishAuditEventCreated(auditEvent: AuditEvent): Promise<void> {
    await this.publishEvent(AuditEventTypes.EVENT_CREATED, {
      auditEventId: auditEvent.getId().getValue(),
      type: auditEvent.getType(),
      entityId: auditEvent.getEntityId(),
      entityType: auditEvent.getEntityType(),
      userId: auditEvent.getUserId(),
      metadata: auditEvent.getMetadata(),
      timestamp: auditEvent.getTimestamp().toISOString()
    });
  }

  /**
   * Publishes audit trail accessed event
   * @param entityId - The entity ID
   * @param entityType - The entity type
   * @param userId - The user who accessed the audit trail
   * @param accessedAt - When the audit trail was accessed
   */
  async publishAuditTrailAccessed(
    entityId: string,
    entityType: string,
    userId: string,
    accessedAt: Date
  ): Promise<void> {
    await this.publishEvent(AuditEventTypes.TRAIL_ACCESSED, {
      entityId,
      entityType,
      userId,
      accessedAt: accessedAt.toISOString()
    });
  }

  /**
   * Publishes audit event exported event
   * @param entityId - The entity ID
   * @param entityType - The entity type
   * @param userId - The user who exported the audit events
   * @param exportedAt - When the audit events were exported
   * @param exportFormat - The export format
   * @param eventCount - Number of events exported
   */
  async publishAuditEventExported(
    entityId: string,
    entityType: string,
    userId: string,
    exportedAt: Date,
    exportFormat: string,
    eventCount: number
  ): Promise<void> {
    await this.publishEvent(AuditEventTypes.EVENTS_EXPORTED, {
      entityId,
      entityType,
      userId,
      exportedAt: exportedAt.toISOString(),
      exportFormat,
      eventCount
    });
  }

  /**
   * Publishes audit event deleted event
   * @param auditEventId - The deleted audit event ID
   * @param entityId - The entity ID
   * @param entityType - The entity type
   * @param userId - The user who deleted the audit event
   * @param deletedAt - When the audit event was deleted
   */
  async publishAuditEventDeleted(
    auditEventId: string,
    entityId: string,
    entityType: string,
    userId: string,
    deletedAt: Date
  ): Promise<void> {
    await this.publishEvent(AuditEventTypes.EVENT_DELETED, {
      auditEventId,
      entityId,
      entityType,
      userId,
      deletedAt: deletedAt.toISOString()
    });
  }

  /**
   * Publishes audit events cleaned up event
   * @param cleanedUpCount - Number of events cleaned up
   * @param olderThanDate - Date threshold for cleanup
   * @param cleanedUpAt - When the cleanup was performed
   */
  async publishAuditEventsCleanedUp(
    cleanedUpCount: number,
    olderThanDate: Date,
    cleanedUpAt: Date
  ): Promise<void> {
    await this.publishEvent(AuditEventTypes.EVENTS_CLEANED_UP, {
      cleanedUpCount,
      olderThanDate: olderThanDate.toISOString(),
      cleanedUpAt: cleanedUpAt.toISOString()
    });
  }
}

