/**
 * @file GetAuditEventApp.service.ts
 * @summary Application service for getting audit event operations
 * @description Orchestrates the audit event retrieval process, delegates to the AuditQueriesPort,
 * and handles validation and error mapping for the audit event workflow.
 */

import type { AuditQueriesPort } from "@/app/ports/audit";

/**
 * @description Input parameters for getting audit event
 */
export interface GetAuditEventAppInput {
  /** Audit event identifier */
  eventId: string;
  /** Tenant identifier */
  tenantId: string;
}

/**
 * @description Output result for getting audit event
 */
export interface GetAuditEventAppResult {
  /** Event identifier */
  id: string;
  /** Envelope identifier */
  envelopeId: string;
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
 * @description Application service for audit event operations
 */
export class GetAuditEventAppService {
  constructor(private readonly auditQueries: AuditQueriesPort) {}

  /**
   * @description Get a specific audit event by ID
   * @param input - Input parameters
   * @returns Promise resolving to audit event result or null if not found
   */
  async execute(input: GetAuditEventAppInput): Promise<GetAuditEventAppResult | null> {
    const result = await this.auditQueries.getAuditEvent({
      eventId: input.eventId,
      tenantId: input.tenantId as any, // TODO: Add proper type conversion
    });

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      envelopeId: result.envelopeId as string,
      at: result.at,
      actor: result.actor,
      action: result.action,
      payload: result.payload,
      metadata: result.metadata,
    };
  }
}
