/**
 * @file GetAuditTrailApp.service.ts
 * @summary Application service for getting audit trail operations
 * @description Orchestrates the audit trail retrieval process, delegates to the AuditQueriesPort,
 * and handles validation and error mapping for the audit trail workflow.
 */

import type { AuditQueriesPort } from "@/app/ports/audit";

/**
 * @description Input parameters for getting audit trail
 */
export interface GetAuditTrailAppInput {
  /** Tenant identifier */
  tenantId: string;
  /** Envelope identifier */
  envelopeId: string;
  /** Optional pagination cursor */
  cursor?: string;
  /** Page size limit */
  limit?: number;
  /** Output format */
  format?: "json" | "pdf";
  /** Locale for PDF generation */
  locale?: string;
}

/**
 * @description Output result for getting audit trail
 */
export interface GetAuditTrailAppResult {
  /** Envelope identifier */
  envelopeId: string;
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
  nextCursor?: string;
}

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
      tenantId: input.tenantId as any, // TODO: Add proper type conversion
      envelopeId: input.envelopeId as any, // TODO: Add proper type conversion
      cursor: input.cursor as any, // TODO: Add proper type conversion
      limit: input.limit,
      format: input.format,
      locale: input.locale,
    });

    return {
      envelopeId: result.envelopeId as string,
      entries: result.entries,
      nextCursor: result.nextCursor as string | undefined,
    };
  }
}
