/**
 * @fileoverview AuditEvent - Interface for audit event data
 * @summary Defines data structure for audit event entities
 * @description This interface provides type-safe specifications for audit event data,
 * representing the structure of audit events in the system.
 */

import { AuditEventType } from '../../enums/AuditEventType';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';

export interface AuditEvent extends NetworkSecurityContext {
  id: string;
  envelopeId: string;
  signerId?: string;
  eventType: AuditEventType;
  description: string;
  userId?: string;
  userEmail?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
