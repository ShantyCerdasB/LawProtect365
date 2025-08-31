
/**
 * @file Audit.ts
 * @description Helpers for audit operations
 * Provides utilities for formatting audit actor information
 */

import type { AuditActor } from "../../domain/entities/AuditActor";

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
