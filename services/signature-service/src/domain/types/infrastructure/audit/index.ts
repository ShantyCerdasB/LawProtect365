/**
 * @fileoverview Audit infrastructure types barrel export - Exports all audit-related infrastructure types
 * @summary Centralized exports for audit infrastructure types
 * @description This barrel file exports all audit-related infrastructure types for easy importing
 * throughout the application.
 */

export * from './audit-ddb-types';
export * from './audit-mappers';

// Re-export result types for convenience
export interface AuditListResult {
  readonly items: import('../../../types/audit/AuditEvent').AuditEvent[];
  readonly nextCursor?: string;
  readonly hasNext: boolean;
}

export interface AuditCountResult {
  readonly count: number;
}
