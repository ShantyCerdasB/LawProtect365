/**
 * @fileoverview AuditEvent - Interface for audit event data
 * @summary Defines data structure for audit event entities
 * @description This interface provides type-safe specifications for audit event data,
 * representing the structure of audit events in the system.
 */

import { AuditEventType } from '../../enums/AuditEventType';

export interface AuditEvent {
  id: string;
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
  createdAt: Date;
}
