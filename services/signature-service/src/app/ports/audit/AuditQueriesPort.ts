/**
 * @file AuditQueriesPort.ts
 * @summary Port interface for read-only audit operations
 * @description Defines the contract for querying audit events and trails
 */

import type { EnvelopeId, TenantId, PaginationCursor } from "@/domain/value-objects";

/**
 * @description Input for getting audit trail of an envelope
 */
export interface GetAuditTrailInput {
  /** Tenant identifier */
  tenantId: TenantId;
  /** Envelope identifier */
  envelopeId: EnvelopeId;
  /** Optional pagination cursor */
  cursor?: PaginationCursor;
  /** Page size limit (will be clamped server-side) */
  limit?: number;
  /** Output format */
  format?: "json" | "pdf";
  /** Locale for PDF generation */
  locale?: string;
}

/**
 * @description Result for audit trail query
 */
export interface GetAuditTrailResult {
  /** Envelope identifier */
  envelopeId: EnvelopeId;
  /** Array of audit entries */
  entries: Array<{
    /** Event occurrence timestamp */
    at: string;
    /** Actor information */
    actor: string;
    /** Action performed */
    action: string;
    /** Optional metadata */
    metadata?: Record<string, any>;
  }>;
  /** Optional pagination cursor for next page */
  nextCursor?: PaginationCursor;
}

/**
 * @description Input for getting a specific audit event
 */
export interface GetAuditEventInput {
  /** Audit event identifier */
  eventId: string;
  /** Tenant identifier for authorization */
  tenantId: TenantId;
}

/**
 * @description Result for audit event query
 */
export interface GetAuditEventResult {
  /** Event identifier */
  id: string;
  /** Envelope identifier */
  envelopeId: EnvelopeId;
  /** Event occurrence timestamp */
  at: string;
  /** Actor information */
  actor: string;
  /** Action performed */
  action: string;
  /** Optional payload */
  payload?: Record<string, any>;
  /** Optional metadata */
  metadata?: Record<string, any>;
}

/**
 * @description Port interface for audit query operations
 */
export interface AuditQueriesPort {
  /**
   * @description Get audit trail for an envelope
   * @param input - Query parameters
   * @returns Promise resolving to audit trail
   */
  getAuditTrail(input: GetAuditTrailInput): Promise<GetAuditTrailResult>;

  /**
   * @description Get a specific audit event by ID
   * @param input - Query parameters
   * @returns Promise resolving to audit event or null if not found
   */
  getAuditEvent(input: GetAuditEventInput): Promise<GetAuditEventResult | null>;
}
