/**
 * @file AuditCommandsPort.ts
 * @summary Port interface for audit command operations
 * @description Defines the contract for audit event recording operations
 */

import type { TenantId, EnvelopeId } from "@/domain/value-objects/ids";
import type { AuditEventId } from "@/domain/value-objects/audit";
import type { AuditEventType } from "../../../domain/values/enums";
import type { AuditActor } from "@lawprotect/shared-ts";

/**
 * @summary Input for recording an audit event
 * @description Parameters required to record a new audit event
 */
export interface RecordAuditEventInput {
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
 * @summary Result for recording an audit event
 * @description Result containing the recorded audit event information
 */
export interface RecordAuditEventResult {
  /** Audit event identifier */
  readonly id: AuditEventId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Event occurrence timestamp */
  readonly occurredAt: string;
  /** Event type */
  readonly type: AuditEventType;
  /** Actor information */
  readonly actor?: AuditActor;
  /** Event metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * @summary Port interface for audit command operations
 * @description Defines the contract for audit event recording operations
 */
export interface AuditCommandsPort {
  /**
   * @summary Record a new audit event
   * @description Records a new audit event with proper validation and persistence
   * @param input - Parameters for recording the audit event
   * @returns Promise resolving to the recorded audit event
   */
  recordAuditEvent(input: RecordAuditEventInput): Promise<RecordAuditEventResult>;
}






