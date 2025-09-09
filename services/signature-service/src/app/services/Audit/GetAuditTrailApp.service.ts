/**
 * @file GetAuditTrailApp.service.ts
 * @summary Application service for getting audit trail operations
 * @description Orchestrates the audit trail retrieval process, delegates to the AuditQueriesPort,
 * and handles validation and error mapping for the audit trail workflow.
 */

import type { AuditQueriesPort } from "../../ports/audit";
import type { 
  GetAuditTrailAppInput, 
  GetAuditTrailAppResult 
} from "../../../domain/types/audit/AppServiceInputs";
import type { PaginationCursor } from "../../../domain/value-objects";

/**
 * @description Application service for audit trail operations
 */
export class GetAuditTrailAppService {
  constructor(private readonly auditQueries: AuditQueriesPort) {}

  /**
   * @description Get audit trail for an envelope
   * @param input - Input parameters
   * @returns Promise resolving to audit trail result
   */
  async execute(input: GetAuditTrailAppInput): Promise<GetAuditTrailAppResult> {
    const result = await this.auditQueries.getAuditTrail({
      tenantId: input.tenantId,
      envelopeId: input.envelopeId,
      cursor: input.cursor,
      limit: input.limit,
    });

    return {
      envelopeId: result.envelopeId,
      entries: result.items.map(item => ({
        at: item.at,
        actor: item.actor,
        action: item.action,
        metadata: item.metadata || {},
      })),
      nextCursor: result.meta?.nextCursor as PaginationCursor | undefined,
    };
  }
}






