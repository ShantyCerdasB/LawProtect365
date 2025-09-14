/**
 * @fileoverview AuditEvent type - Defines audit event structure for compliance
 * @summary Type definition for audit trail events
 * @description The AuditEvent interface defines the structure for audit events that track
 * all actions performed on envelopes, signers, and signatures for legal compliance.
 */

import { AuditEventType } from '../../enums/AuditEventType';

/**
 * Audit event for tracking all envelope and signing activities
 */
export interface AuditEvent {
  /**
   * Unique event ID
   */
  id: string;

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
   * Timestamp when the event occurred
   */
  timestamp: Date;

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