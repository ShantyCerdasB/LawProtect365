/**
 * @file RecordAuditEventApp.service.ts
 * @summary Application service for recording audit event operations
 * @description Orchestrates the audit event recording process, delegates to the AuditCommandsPort,
 * and handles validation and error mapping for the audit event recording workflow.
 */

import type { AuditCommandsPort } from "../../ports/audit/AuditCommandsPort";
import type { 
  RecordAuditEventAppInput, 
  RecordAuditEventAppResult 
} from "../../../shared/types/audit/AppServiceInputs";
import { formatActor } from "../../../shared/utils/Audit";

/**
 * @description Application service for audit event recording operations
 */
export class RecordAuditEventAppService {
  constructor(private readonly auditCommands: AuditCommandsPort) {}

  /**
   * @description Record a new audit event
   * @param input - Input parameters for recording audit event
   * @returns Promise resolving to audit event recording result
   */
  async execute(input: RecordAuditEventAppInput): Promise<RecordAuditEventAppResult> {
    const result = await this.auditCommands.recordAuditEvent({
      tenantId: input.tenantId,
      envelopeId: input.envelopeId,
      type: input.type,
      actor: input.actor,
      metadata: input.metadata,
    });

    return {
      id: result.id,
      envelopeId: result.envelopeId,
      at: result.occurredAt,
      type: result.type,
      actor: result.actor ? formatActor(result.actor) : undefined,
      metadata: result.metadata,
    };
  }
}
