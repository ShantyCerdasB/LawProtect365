/**
 * @file makeAuditQueriesPort.ts
 * @summary Factory function that implements AuditQueriesPort
 * @description Adapts calls to the audit repository for audit operations
 */

import type { 
  AuditQueriesPort, 
  GetAuditTrailInput, 
  GetAuditTrailResult, 
  GetAuditEventInput, 
  GetAuditEventResult
} from "../../ports/audit";
import type { AuditQueriesPortDependencies } from "../../../shared/types/audit";

/**
 * @description Creates an implementation of AuditQueriesPort
 * @param deps - Dependencies required by the port
 * @returns AuditQueriesPort implementation
 */
export const makeAuditQueriesPort = (
  deps: AuditQueriesPortDependencies
): AuditQueriesPort => {
  return {
    /**
     * @description Get audit trail for an envelope
     * @param input - Query parameters for audit trail
     * @returns Promise resolving to paginated audit trail
     */
    async getAuditTrail(input: GetAuditTrailInput): Promise<GetAuditTrailResult> {
      const result = await deps.auditRepo.listByEnvelope({
        tenantId: input.tenantId,
        envelopeId: input.envelopeId,
        cursor: input.cursor,
        limit: input.limit ?? 50,
      });

      // Transform audit events to the expected format using CursorPage structure
      const items = result.items.map((event) => ({
        at: event.occurredAt,
        actor: event.actor?.email || event.actor?.userId || "system",
        action: event.type,
        metadata: event.metadata,
      }));

      return {
        envelopeId: input.envelopeId,
        items,
        meta: {
          limit: input.limit ?? 50,
          nextCursor: result.meta?.nextCursor,
        },
      };
    },

    /**
     * @description Get a specific audit event by ID
     * @param input - Query parameters for audit event
     * @returns Promise resolving to audit event or null if not found
     */
    async getAuditEvent(input: GetAuditEventInput): Promise<GetAuditEventResult | null> {
      const event = await deps.auditRepo.getById(input.eventId);
      if (!event) {
        return null;
      }

      // Validate tenant access
      if (event.tenantId !== input.tenantId) {
        return null;
      }

      return {
        event,
        actorDisplay: event.actor?.email || event.actor?.userId || "system",
        actionDisplay: event.type,
      };
    },
  };
};
