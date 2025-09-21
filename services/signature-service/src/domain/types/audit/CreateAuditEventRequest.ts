/**
 * @fileoverview CreateAuditEventRequest - Interface for audit event creation
 * @summary Defines data structure for creating new audit events
 * @description This interface provides type-safe creation specifications for audit events,
 * including all required fields for compliance and audit trail tracking.
 */

import { AuditEventType } from '../../enums/AuditEventType';

export interface CreateAuditEventRequest {
  envelopeId: string;
  signerId?: string;
  eventType: AuditEventType;
  description: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  metadata?: Record<string, any>;
}
