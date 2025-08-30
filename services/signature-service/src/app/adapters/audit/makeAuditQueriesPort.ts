/**
 * @file makeAuditQueriesPort.ts
 * @summary Factory function that implements AuditQueriesPort
 * @description Adapts calls to the respective use cases for audit operations
 */

import type { AuditRepository } from "@/domain/ports/Audit";
import type { AuditQueriesPort, GetAuditTrailInput, GetAuditTrailResult, GetAuditEventInput, GetAuditEventResult } from "@/app/ports/audit";
import { listAuditTrail } from "@/use-cases/audit/ListAuditTrail";
import { getAuditEventById } from "@/use-cases/audit/GetAuditEventById";

/**
 * @description Dependencies for the audit queries port
 */
export interface AuditQueriesPortDependencies {
  /** Audit repository for data access */
  auditRepo: AuditRepository;
}

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
     */
    async getAuditTrail(input: GetAuditTrailInput): Promise<GetAuditTrailResult> {
      const result = await listAuditTrail(
        {
          tenantId: input.tenantId,
          envelopeId: input.envelopeId,
          cursor: input.cursor,
          limit: input.limit,
        },
        {
          repos: {
            audit: deps.auditRepo,
          },
        }
      );

      // Transform audit events to the expected format
      const entries = result.items.map((event) => ({
        at: event.occurredAt,
        actor: event.actor?.email || event.actor?.userId || "system",
        action: event.type,
        metadata: event.metadata,
      }));

      return {
        envelopeId: input.envelopeId,
        entries,
        nextCursor: result.nextCursor,
      };
    },

    /**
     * @description Get a specific audit event by ID
     */
    async getAuditEvent(input: GetAuditEventInput): Promise<GetAuditEventResult | null> {
      try {
        // First get the event to find its envelopeId
        const event = await deps.auditRepo.getById(input.eventId as any);
        if (!event) {
          return null;
        }

        const result = await getAuditEventById(
          {
            eventId: input.eventId as any,
            tenantId: input.tenantId,
            envelopeId: event.envelopeId,
          },
          {
            repos: {
              audit: deps.auditRepo,
            },
          }
        );

        return {
          id: result.event.id,
          envelopeId: result.event.envelopeId,
          at: result.event.occurredAt,
          actor: result.event.actor?.email || result.event.actor?.userId || "system",
          action: result.event.type,
          payload: result.event.metadata,
          metadata: result.event.metadata,
        };
      } catch (error) {
        // If event not found or access denied, return null
        return null;
      }
    },
  };
};
