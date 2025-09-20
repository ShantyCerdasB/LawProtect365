/**
 * @fileoverview AuditEventTypes enum - Defines all audit event types
 * @summary Enumerates the types of audit domain events
 * @description The AuditEventTypes enum defines all possible types of audit
 * domain events that can be published for event-driven architecture.
 */

/**
 * Audit event type enumeration
 * 
 * Defines all possible types of audit domain events that can be published
 * for event-driven architecture and cross-service communication.
 */
export enum AuditEventTypes {
  /**
   * Audit event was created
   * - Published when a new audit event is recorded
   * - Contains audit event details and metadata
   */
  EVENT_CREATED = 'audit.event_created',

  /**
   * Audit trail was accessed
   * - Published when someone accesses audit trail
   * - Contains access information and timestamp
   */
  TRAIL_ACCESSED = 'audit.trail_accessed',

  /**
   * Audit events were exported
   * - Published when audit events are exported
   * - Contains export format and event count
   */
  EVENTS_EXPORTED = 'audit.events_exported',

  /**
   * Audit event was deleted
   * - Published when an audit event is deleted
   * - Contains deletion information and timestamp
   */
  EVENT_DELETED = 'audit.event_deleted',

  /**
   * Audit events were cleaned up
   * - Published when old audit events are cleaned up
   * - Contains cleanup count and date threshold
   */
  EVENTS_CLEANED_UP = 'audit.events_cleaned_up'
}
