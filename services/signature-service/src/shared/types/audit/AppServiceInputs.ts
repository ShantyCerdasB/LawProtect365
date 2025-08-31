/**
 * @file AppServiceInputs.ts
 * @summary Input and output types for audit application services
 * @description Defines the input and output contracts for audit application services
 */

import type { TenantId, EnvelopeId } from "@/domain/value-objects/Ids";
import type { AuditEventId } from "@/domain/value-objects/Audit";
import type { AuditEventType } from "@/domain/values/enums";
import type { AuditActor } from "@/domain/entities/AuditActor";
import type { PaginationCursor } from "@/domain/value-objects";

/**
 * @summary Input for getting audit event app service
 * @description Parameters required to retrieve a specific audit event
 */
export interface GetAuditEventAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Audit event identifier */
  readonly eventId: AuditEventId;
}

/**
 * @summary Output for getting audit event app service
 * @description Result containing the audit event data for presentation
 */
export interface GetAuditEventAppResult {
  /** Audit event identifier */
  readonly id: AuditEventId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Event occurrence timestamp */
  readonly at: string;
  /** Formatted actor information */
  readonly actor: string;
  /** Formatted action description */
  readonly action: string;
  /** Event payload data */
  readonly payload: Record<string, unknown>;
  /** Event metadata */
  readonly metadata: Record<string, unknown>;
}

/**
 * @summary Input for getting audit trail app service
 * @description Parameters required to retrieve audit trail for an envelope
 */
export interface GetAuditTrailAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Pagination cursor */
  readonly cursor?: PaginationCursor;
  /** Maximum number of items to return */
  readonly limit?: number;
  /** Response format */
  readonly format?: string;
  /** Locale for formatting */
  readonly locale?: string;
}

/**
 * @summary Output for getting audit trail app service
 * @description Result containing the audit trail data for presentation
 */
export interface GetAuditTrailAppResult {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Audit trail entries */
  readonly entries: Array<{
    /** Event occurrence timestamp */
    readonly at: string;
    /** Formatted actor information */
    readonly actor: string;
    /** Formatted action description */
    readonly action: string;
    /** Event metadata */
    readonly metadata: Record<string, unknown>;
  }>;
  /** Next pagination cursor */
  readonly nextCursor?: PaginationCursor;
}

/**
 * @summary Input for recording audit event app service
 * @description Parameters required to record a new audit event
 */
export interface RecordAuditEventAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Event type */
  readonly type: AuditEventType;
  /** Actor information */
  readonly actor?: AuditActor;
  /** Event metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * @summary Output for recording audit event app service
 * @description Result containing the recorded audit event data
 */
export interface RecordAuditEventAppResult {
  /** Audit event identifier */
  readonly id: AuditEventId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Event occurrence timestamp */
  readonly at: string;
  /** Event type */
  readonly type: string;
  /** Formatted actor information */
  readonly actor?: string;
  /** Event metadata */
  readonly metadata?: Record<string, unknown>;
}
