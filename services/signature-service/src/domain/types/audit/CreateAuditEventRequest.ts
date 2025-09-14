/**
 * @fileoverview CreateAuditEventRequest type - Defines request structure for creating audit events
 * @summary Type definition for audit event creation requests
 * @description The CreateAuditEventRequest interface defines the data structure required for
 * creating new audit events in the system.
 */

import { AuditEventType } from '../../enums/AuditEventType';

/**
 * Request to create an audit event
 */
export interface CreateAuditEventRequest {
  /**
   * Type of audit event
   */
  type: AuditEventType;

  /**
   * The envelope ID this event relates to
   */
  envelopeId: string;

  /**
   * The signer ID this event relates to (if applicable)
   */
  signerId?: string;

  /**
   * The signature ID this event relates to (if applicable)
   */
  signatureId?: string;

  /**
   * The user ID who performed the action
   */
  userId?: string;

  /**
   * The email of the user who performed the action
   */
  userEmail?: string;

  /**
   * IP address of the user
   */
  ipAddress?: string;

  /**
   * User agent of the browser
   */
  userAgent?: string;

  /**
   * Additional event-specific data
   */
  metadata?: {
    [key: string]: any;
  };

  /**
   * Human-readable description of the event
   */
  description: string;
}
