/**
 * @fileoverview AuditSpec - Interface for audit event query specifications
 * @summary Defines query criteria for audit event searches
 * @description This interface provides type-safe query specifications for filtering
 * audit events by various criteria including envelope, signer, event type, and user context.
 */

import { AuditEventType } from '../../enums/AuditEventType';

export interface AuditSpec {
  envelopeId?: string;
  signerId?: string;
  eventType?: AuditEventType;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  createdBefore?: Date;
  createdAfter?: Date;
  description?: string;
}
