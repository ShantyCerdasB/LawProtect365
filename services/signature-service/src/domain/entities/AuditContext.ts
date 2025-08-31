/**
 * @file AuditContext.ts
 * @summary Audit context contracts
 * @description Shared contracts for audit event context and logging
 */


import { ActorContext } from "@/domain/entities";
import { TenantId } from "@lawprotect/shared-ts";



/**
 * @summary Audit context for logging events
 * @description Context information required for audit event logging
 */
export interface AuditContext {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Envelope identifier (optional for non-envelope operations) */
  readonly envelopeId?: string;
  /** Actor information */
  readonly actor?: ActorContext;
}
