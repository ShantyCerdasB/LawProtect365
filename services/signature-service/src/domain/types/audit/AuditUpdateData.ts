/**
 * @fileoverview AuditUpdateData - Interface for audit event update operations
 * @summary Defines data structure for updating audit event properties
 * @description This interface provides type-safe update specifications for audit events,
 * though audit events are typically immutable in practice.
 */

export interface AuditUpdateData {
  description?: string;
  metadata?: Record<string, any>;
}
