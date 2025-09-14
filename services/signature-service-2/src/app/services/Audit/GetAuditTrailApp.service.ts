/**
 * @file GetAuditTrailApp.service.ts
 * @summary Application service for getting audit trail operations
 * @description Orchestrates the audit trail retrieval process, delegates to the AuditQueriesPort,
 * and handles validation and error mapping for the audit trail workflow.
 */

import type { AuditQueriesPort } from "../../ports/audit/AuditQueriesPort";
import type { 
  GetAuditTrailAppInput, 
  GetAuditTrailAppResult 
} from "../../../domain/types/audit/AppServiceInputs";
import type { PaginationCursor } from "../../../domain/value-objects";

/**
 * @summary Application service for audit trail operations
 * @description Orchestrates the audit trail retrieval process with proper validation
 */
export class GetAuditTrailAppService {
  constructor(private readonly auditQueries: AuditQueriesPort) {}

  /**
   * @summary Get audit trail for an envelope
   * @description Get audit trail for an envelope with pagination support
   * @param input - Input parameters
   * @returns Promise resolving to audit trail result
   */
  async execute(input: GetAuditTrailAppInput): Promise<GetAuditTrailAppResult> {
    const result = await this.auditQueries.getAuditTrail({
      envelopeId: input.envelopeId,
      cursor: input.cursor,
      limit: input.limit});

    return {
      envelopeId: result.envelopeId,
      entries: result.items.map(item => ({
        at: item.at,
        actor: item.actor,
        action: item.action,
        metadata: item.metadata || {}})),
      nextCursor: result.meta?.nextCursor as PaginationCursor | undefined};
  }
};
