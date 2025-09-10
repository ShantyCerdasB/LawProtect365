/**
 * @file RecordAuditEventApp.service.ts
 * @summary Application service for recording audit event operations
 * @description Orchestrates the audit event recording process, delegates to the AuditCommandsPort,
 * and handles validation and error mapping for the audit event recording workflow.
 */

import type { AuditCommandsPort } from "../../ports/audit";
import type { 
  RecordAuditEventAppInput, 
  RecordAuditEventAppResult 
} from "../../../domain/types/audit/AppServiceInputs";
import { formatActor } from "@lawprotect/shared-ts";

/**
 * @summary Application service for audit event recording operations
 * @description Orchestrates the audit event recording process with proper validation
 */
export class RecordAuditEventAppService {
  constructor(private readonly auditCommands: AuditCommandsPort) {}

  /**
   * @summary Record a new audit event
   * @description Record a new audit event with proper validation and formatting
   * @param input - Input parameters for recording audit event
   * @returns Promise resolving to audit event recording result
   */
  async execute(input: RecordAuditEventAppInput): Promise<RecordAuditEventAppResult> {
    const result = await this.auditCommands.recordAuditEvent({
      envelopeId: input.envelopeId,
      type: input.type,
      actor: input.actor,
      metadata: input.metadata});

    return {
      id: result.id,
      envelopeId: result.envelopeId,
      at: result.occurredAt,
      type: result.type,
      actor: result.actor ? formatActor(result.actor) : undefined,
      metadata: result.metadata};
  }
};
