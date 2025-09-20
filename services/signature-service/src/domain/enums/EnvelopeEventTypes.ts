/**
 * @fileoverview EnvelopeEventTypes enum - Defines all envelope event types
 * @summary Enumerates the types of envelope domain events
 * @description The EnvelopeEventTypes enum defines all possible types of envelope
 * domain events that can be published for event-driven architecture.
 */

/**
 * Envelope event type enumeration
 * 
 * Defines all possible types of envelope domain events that can be published
 * for event-driven architecture and cross-service communication.
 */
export enum EnvelopeEventTypes {
  /**
   * Envelope was created
   * - Published when a new envelope is created
   * - Contains envelope metadata and initial state
   */
  CREATED = 'envelope.created',

  /**
   * Envelope was updated
   * - Published when envelope properties are modified
   * - Contains changes made to the envelope
   */
  UPDATED = 'envelope.updated',

  /**
   * Envelope status changed
   * - Published when envelope status transitions
   * - Contains old and new status information
   */
  STATUS_CHANGED = 'envelope.status_changed',

  /**
   * Envelope was deleted
   * - Published when envelope is permanently removed
   * - Contains envelope identification information
   */
  DELETED = 'envelope.deleted',

  /**
   * Envelope has expired
   * - Published when envelope expiration date is reached
   * - Contains expiration timestamp
   */
  EXPIRED = 'envelope.expired',

  /**
   * Envelope was completed
   * - Published when all signatures are collected
   * - Contains completion timestamp
   */
  COMPLETED = 'envelope.completed',

  /**
   * Envelope was cancelled
   * - Published when envelope is cancelled by owner
   * - Contains cancellation reason and timestamp
   */
  CANCELLED = 'envelope.cancelled'
}
