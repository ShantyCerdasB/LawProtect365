/**
 * @file AuditRepository.ts
 * @summary Audit repository contract
 * @description Repository interface for audit events persistence
 */

import type { AuditEvent, AuditEventId } from "@/domain/value-objects/audit";
import type { EnvelopeId, TenantId, PaginationCursor } from "../../../../domain/value-objects";
import type { CursorPage } from "@lawprotect/shared-ts";

/**
 * @summary Input for listing audit events by envelope
 * @description Parameters for retrieving audit events for a specific envelope
 */
export interface ListByEnvelopeInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Maximum number of results */
  readonly limit: number;
  /** Pagination cursor */
  readonly cursor?: PaginationCursor;
}

/**
 * @summary Audit repository contract
 * @description Defines the interface for audit event persistence operations
 */
export interface AuditRepository {
  /**
   * @summary Create a new audit event
   * @description Records a new audit event with auto-generated ID and hash
   */
  record(event: Omit<AuditEvent, "id" | "hash"> & { prevHash?: string }): Promise<AuditEvent>;

  /**
   * @summary Get audit event by ID
   * @description Retrieves a specific audit event by its unique identifier
   */
  getById(eventId: AuditEventId): Promise<AuditEvent | null>;

  /**
   * @summary List audit events by envelope
   * @description Retrieves audit events for a specific envelope with pagination
   */
  listByEnvelope(input: ListByEnvelopeInput): Promise<CursorPage<AuditEvent>>;
}






