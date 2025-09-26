/**
 * @fileoverview AuditSpec - Interface for audit event query specifications
 * @summary Defines query criteria for audit event searches
 * @description This interface provides type-safe query specifications for filtering
 * audit events by various criteria including envelope, signer, event type, and user context.
 */

import { AuditEventType } from '../../enums/AuditEventType';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';

export interface AuditSpec extends NetworkSecurityContext {
  envelopeId?: string;
  signerId?: string;
  eventType?: AuditEventType;
  userId?: string;
  userEmail?: string;
  createdBefore?: Date;
  createdAfter?: Date;
  description?: string;
}
