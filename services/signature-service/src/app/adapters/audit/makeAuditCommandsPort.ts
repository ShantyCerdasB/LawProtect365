/**
 * @file makeAuditCommandsPort.ts
 * @summary Factory function that implements AuditCommandsPort
 * @description Adapts calls to the audit repository for audit command operations
 */

import type { 
  AuditCommandsPort, 
  RecordAuditEventInput, 
  RecordAuditEventResult
} from "../../ports/audit/AuditCommandsPort";
import type { AuditCommandsPortDependencies } from "../../../domain/types/audit";
import type { AuditEventType } from "../../../domain/values/enums";
import { assertTenantBoundary, nowIso } from "@lawprotect/shared-ts";

/**
 * @description Creates an implementation of AuditCommandsPort
 * @param deps - Dependencies required by the port
 * @returns AuditCommandsPort implementation
 */
export const makeAuditCommandsPort = (
  deps: AuditCommandsPortDependencies
): AuditCommandsPort => {
  return {
    /**
     * @description Record a new audit event
     * @param input - Parameters for recording the audit event
     * @returns Promise resolving to the recorded audit event
     */
    async recordAuditEvent(input: RecordAuditEventInput): Promise<RecordAuditEventResult> {
      // Apply generic rules
      assertTenantBoundary(input.tenantId, input.tenantId);
      
      // Apply domain-specific rules
      // Note: Audit event validation would need proper integration

      // Create audit event candidate
      const occurredAt = nowIso();
      const candidate = {
        tenantId: input.tenantId,
        envelopeId: input.envelopeId,
        type: input.type,
        occurredAt,
        actor: input.actor,
        metadata: input.metadata,
      };

      // Record the audit event
      const savedEvent = await deps.auditRepo.record(candidate);

      // Return the result
      return {
        id: savedEvent.id,
        envelopeId: savedEvent.envelopeId,
        occurredAt: savedEvent.occurredAt,
        type: savedEvent.type as AuditEventType, // Cast since it was validated when saved
        actor: savedEvent.actor as any, // Type assertion needed due to branded types mismatch
        metadata: savedEvent.metadata,
      };
    },
  };
};
