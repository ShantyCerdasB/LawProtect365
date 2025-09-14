/**
 * @file GetAuditEventApp.service.ts
 * @summary Application service for getting audit event operations
 * @description Orchestrates the audit event retrieval process, delegates to the AuditQueriesPort,
 * and handles validation and error mapping for the audit event workflow.
 */

import type { AuditQueriesPort } from "../../ports/audit/AuditQueriesPort";
import type { 
  GetAuditEventAppInput, 
  GetAuditEventAppResult 
} from "../../../domain/types/audit/AppServiceInputs";

/**
 * @summary Application service for audit event operations
 * @description Orchestrates the audit event retrieval process with proper validation
 */
export class GetAuditEventAppService {
  constructor(private readonly auditQueries: AuditQueriesPort) {}

  /**
   * @summary Get a specific audit event by ID
   * @description Get a specific audit event by ID with proper validation
   * @param input - Input parameters
   * @returns Promise resolving to audit event result or null if not found
   */
  async execute(input: GetAuditEventAppInput): Promise<GetAuditEventAppResult | null> {
    const result = await this.auditQueries.getAuditEvent({
      eventId: input.eventId});

    if (!result) {
      return null;
    }

    return {
      id: result.event.id,
      envelopeId: result.event.envelopeId,
      at: result.event.occurredAt,
      actor: result.actorDisplay,
      action: result.actionDisplay,
      payload: result.event.metadata || {},
      metadata: result.event.metadata || {}};
  }
};
