/**
 * @file audit.ts
 * @summary Audit utilities for actor formatting and audit operations
 * @description Provides utilities for formatting audit actor information and common audit operations
 */

/**
 * @description Generic audit actor interface for microservices
 */
export interface AuditActor {
  email?: string;
  userId?: string;
  role?: string;
  ip?: string;
  userAgent?: string;
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
