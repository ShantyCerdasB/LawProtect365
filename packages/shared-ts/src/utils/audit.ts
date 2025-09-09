/**
 * @file audit.ts
 * @summary Audit utilities for actor formatting and audit operations
 * @description Provides utilities for formatting audit actor information and common audit operations
 */

import type { ActorContext } from "../types/actor.js";
import type { TenantId } from "../types/brand.js";

/**
 * @description Generic audit actor interface for microservices
 * Alias for ActorContext for backward compatibility
 */
export interface AuditActor extends ActorContext {}

/**
 * @description Audit context for logging events
 * Context information required for audit event logging
 */
export interface AuditContext {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Envelope identifier (optional for non-envelope operations) */
  readonly envelopeId?: string;
  /** Actor information */
  readonly actor?: ActorContext;
}

/**
 * @description Format actor information for display
 * @param actor - Actor information from audit event
 * @returns Formatted actor string (email, userId, or "system")
 */
export const formatActor = (actor: AuditActor): string => {
  if (actor.email) return actor.email;
  if (actor.userId) return actor.userId;
  return "system";
};
