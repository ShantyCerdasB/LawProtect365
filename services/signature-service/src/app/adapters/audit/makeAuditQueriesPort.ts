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
import type { AuditQueriesPortDependencies } from "../../../domain/types/audit";
import { SYSTEM_ACTOR, AUDIT_PAGINATION_DEFAULTS } from "@lawprotect/shared-ts";

/**
 * @description Creates an implementation of AuditQueriesPort
 * @param deps - Dependencies required by the port
 * @returns AuditQueriesPort implementation
 */
export const makeAuditQueriesPort = (
  deps: AuditQueriesPortDependencies & {
    defaultPageSize?: number;
  }
): AuditQueriesPort => {
  return {
    /**
     * @description Get audit trail for an envelope
     * @param input - Query parameters for audit trail
     * @returns Promise resolving to paginated audit trail
     */
    async getAuditTrail(input: GetAuditTrailInput): Promise<GetAuditTrailResult> {
      const result = await deps.auditRepo.listByEnvelope({
        envelopeId: input.envelopeId,
        cursor: input.cursor,
        limit: input.limit ?? deps.defaultPageSize ?? AUDIT_PAGINATION_DEFAULTS.DEFAULT_LIMIT});

      // Transform audit events to the expected format using CursorPage structure
      const items = result.items.map((event) => ({
        at: event.occurredAt,
        actor: event.actor?.email || event.actor?.userId || SYSTEM_ACTOR,
        action: event.type,
        metadata: event.metadata}));

      return {
        envelopeId: input.envelopeId,
        items,
        meta: {
          hasNext: !!result.meta?.nextCursor,
          nextCursor: result.meta?.nextCursor}};
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

      return {
        event,
        actorDisplay: event.actor?.email || event.actor?.userId || SYSTEM_ACTOR,
        actionDisplay: event.type};
    }};
};
