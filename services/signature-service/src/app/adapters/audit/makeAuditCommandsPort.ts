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
import type { AuditCommandsPortDependencies } from "../../../shared/types/audit";
import type { AuditEventType } from "../../../domain/values/enums";
import { BadRequestError } from "../../../shared/errors";
import * as Rules from "../../../domain/rules";

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
      // Validate event type
      try {
        Rules.Audit.assertEventType(input.type);
      } catch {
        throw new BadRequestError(
          `Invalid audit event type: ${input.type}`,
          "AUDIT_INVALID_EVENT_TYPE"
        );
      }

      // Validate actor if provided
      if (input.actor) {
        try {
          Rules.Audit.assertActorShape(input.actor);
        } catch {
          throw new BadRequestError(
            "Invalid audit actor information",
            "AUDIT_INVALID_ACTOR"
          );
        }
      }

      // Validate metadata if provided
      if (input.metadata) {
        try {
          Rules.Audit.assertMetadataSerializable(input.metadata);
        } catch {
          throw new BadRequestError(
            "Invalid audit metadata",
            "AUDIT_INVALID_METADATA"
          );
        }
      }

      // Create audit event candidate
      const occurredAt = new Date().toISOString();
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
        actor: savedEvent.actor,
        metadata: savedEvent.metadata,
      };
    },
  };
};
