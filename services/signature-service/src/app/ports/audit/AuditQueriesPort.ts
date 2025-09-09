/**
 * @file AuditQueriesPort.ts
 * @summary Port interface for read-only audit operations
 * @description Defines the contract for querying audit events and trails
 */

import type { EnvelopeId, TenantId, PaginationCursor } from "../../../domain/value-objects";
import type { AuditEvent, AuditEventId } from "@/domain/value-objects/audit";
import type { CursorPage } from "@lawprotect/shared-ts";
import type { UploadFormat } from "../../../domain/values/enums";

/**
 * @description Input for getting audit trail of an envelope
 */
export interface GetAuditTrailInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Optional pagination cursor */
  readonly cursor?: PaginationCursor;
  /** Page size limit (will be clamped server-side) */
  readonly limit?: number;
  /** Output format */
  readonly format?: UploadFormat;
  /** Locale for PDF generation */
  readonly locale?: string;
}

/**
 * @description Result for audit trail query using CursorPage for consistent pagination
 */
export interface GetAuditTrailResult extends CursorPage<{
  /** Event occurrence timestamp */
  readonly at: string;
  /** Actor information */
  readonly actor: string;
  /** Action performed */
  readonly action: string;
  /** Optional metadata */
  readonly metadata?: Record<string, unknown>;
}> {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
}

/**
 * @description Input for getting a specific audit event
 */
export interface GetAuditEventInput {
  /** Audit event identifier */
  readonly eventId: AuditEventId;
  /** Tenant identifier for authorization */
  readonly tenantId: TenantId;
}

/**
 * @description Result for audit event query with complete event data
 */
export interface GetAuditEventResult {
  /** Complete audit event */
  readonly event: AuditEvent;
  /** Formatted actor information for display */
  readonly actorDisplay: string;
  /** Formatted action for display */
  readonly actionDisplay: string;
}

/**
 * @description Port interface for audit query operations
 */
export interface AuditQueriesPort {
  /**
   * @description Get audit trail for an envelope with consistent pagination
   * @param input - Query parameters
   * @returns Promise resolving to paginated audit trail
   */
  getAuditTrail(input: GetAuditTrailInput): Promise<GetAuditTrailResult>;

  /**
   * @description Get a specific audit event by ID with complete event data
   * @param input - Query parameters
   * @returns Promise resolving to audit event or null if not found
   */
  getAuditEvent(input: GetAuditEventInput): Promise<GetAuditEventResult | null>;
}






